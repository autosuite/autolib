import * as core from '@actions/core';

/**
 * The regular expression that represents a version release.
 *
 * For example, `v0.11.5-beta+17-2020-05-12` will provide parts:
 *
 * - `0`: `0`
 * - `1`: `11`
 * - `2`: `5`
 * - `3`: `-beta+17-2020-05-12`
 */
export const SEMVER_REGEXP = /v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<info>.*)/;


/** A basic concrete representation of a Semantic Version. */
export class SemVer {
    /** The major version, immutable. */
    private _major: number;

    /** The minor number, immutable. */
    private _minor: number;

    /** The patch number, immutable. */
    private _patch: number;

    /** The information string, if applicable, immutable. */
    private _info: string | null;

    get major(): number {
        return this._major;
    }

    get minor(): number {
        return this._minor;
    }

    get patch(): number {
        return this._patch;
    }

    get info(): string | null {
        return this._info;
    }

    /**
     * From a textual version, create a [SemVer].
     *
     * These might be something like `0.31.5` or `2.0.0-some_info_here+2020-03-01`, for example.
     *
     * @param text the textual version
     */
    public static constructFromText(text: string): SemVer {
        const match: RegExpMatchArray | null = text.match(SEMVER_REGEXP);

        if (!match) {
            throw Error(`Provided text is not valid SemVer: [${text}]`);
        }

        const groups: { [key: string]: string } | undefined = match.groups;

        if (!groups) {
            throw Error("Text has no line-delimited trimmed SemVer versions!");
        }

        const major: number = parseInt(groups["major"]);
        const minor: number = parseInt(groups["minor"]);
        const patch: number = parseInt(groups["patch"]);

        /* Force set to null if falsey (empty string). */

        const info: string | null = groups["info"] || null;

        return new SemVer(major, minor, patch, info);
    }

    /**
     * Return the "zero version" as a [SemVer].
     */
    public static constructZero(): SemVer {
        return new SemVer(0, 0, 0, null);
    }

    /**
     * Find the largest of any number of [[SemVer]]s.
     *
     * @param versions the [[SemVer]]s for which to find the maximum
     */
    public static max(versions: SemVer[]): SemVer {
        let runningMax: SemVer = SemVer.constructZero();

        if (versions.length === 0) {
            core.warning("[Autolib] Running SemVer.max with an empty array. Returning 0.0.0.");
        }

        versions.forEach(version => {
            runningMax = SemVer.compare(version, runningMax);
        });

        return runningMax;
    }

    /**
     * Return the larger of two [[SemVer]]s.
     *
     * @param left a [[SemVer]]
     * @param right a [[SemVer]]
     */
    private static compare(left: SemVer, right: SemVer): SemVer {
        const majorIsSame: boolean = left.major == right.major;
        const majorIsLeft: boolean = left.major > right.major;

        const minorIsSame: boolean = left.minor == right.minor;
        const minorIsLeft: boolean = left.minor > right.minor;

        const patchIsSame: boolean = left.patch == right.patch;
        const patchIsLeft: boolean = left.patch > right.patch;

        /* Is minor greater? */

        const minorIncremented: boolean = majorIsSame && minorIsLeft

        /* Is minor the same and the left patch is greater? */

        const patchIncremented: boolean = !minorIncremented && minorIsSame && patchIsLeft;

        /* Failing that, is the left version stable and the right version unstable? */

        const versionStabilized: boolean = (
            !patchIncremented && patchIsSame && left.info === null && right.info !== null
        );

        /* Failing that, is the left version's version lexically greater? */

        const infoIncremented: boolean = (
            !versionStabilized && left.info != null && right.info != null && left.info.localeCompare(right.info) === 1
        );

        if (majorIsLeft || minorIncremented || patchIncremented || versionStabilized || infoIncremented) {
            return left;
        }

        return right;
    }

    public constructor(major: number, minor: number, patch: number, info: string | null) {
        this._major = major;
        this._minor = minor;
        this._patch = patch;
        this._info = info;
    }

    /**
     * Return "true" if this is a "zero version".
     */
    public isZero(): boolean {
        return (this.major === 0 && this.minor === 0 && this.patch === 0 && this.info == null);
    }

    public toString(): string {
        const representation = `${this.major}.${this.minor}.${this.patch}`;

        if (this.info) {
            return `${representation}${this.info}`;
        }

        return representation;
    }
}
