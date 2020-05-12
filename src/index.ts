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
const SEMVER_REGEXP: RegExp = /v?(\d)\.(\d)\.\d)(.*)/;

/**
 * Given an [[Array]] of tags, find the latest SemVer tag and return it.
 *
 * We need to iterate all anyway to ignore all the useless values, so let's not define a comparator.
 *
 * Note the example: `1.0.0-rc2 < 1.0.0`.
 *
 * @param tags the tags from which to find the latest SemVer version
 * @param stableOnly if the function should ignore all prerelease/build info-appended versions
 * @returns a SemVer representation as a 4-ary [[Tuple]] of 3 [[Number]]s and 1 optional [[string]]
 */
export function determineLatestSemanticVersion(
    tags: string, stableOnly: boolean
): [Number, Number, Number, string | null] {
    let largestSeen: [Number, Number, Number, string | null] = [0, 0, 0, null];

    tags.split("\n").forEach((tag: string) => {
        core.info(`Found tag: [${tag}].`);

        const match: RegExpMatchArray | null = tag.match(SEMVER_REGEXP);

        if (!match) {
            return;
        }

        const major: Number = parseInt(match[0]);
        const minor: Number = parseInt(match[1]);
        const patch: Number = parseInt(match[2]);

        /* Force set to null if falsey (empty string). */

        const info: string | null = match[3] || null;

        /* Skip if not stable and stableOnly is true. */

        if (stableOnly && info) {
            return;
        }

        largestSeen = determineLargestSeen(largestSeen, major, minor, patch, info);
    });

    return largestSeen;
}

/**
 * Determine the largest seen Semantic Version.
 *
 * @param largestSeen the largest seen (so far) version
 * @param major the major version to compare
 * @param minor the minor version to compare
 * @param patch the patch version to compare
 * @param info the info string, if applicable, to compare
 */
function determineLargestSeen(
    largestSeen: [Number, Number, Number, string | null],
    major: Number,
    minor: Number,
    patch: Number,
    info: string | null,
): [Number, Number, Number, string | null] {
    /* Record singular comparisons. */

    const majorIsSame: boolean = major == largestSeen[0];
    const majorIsNewer: boolean = major > largestSeen[0];

    const minorIsSame: boolean = minor == largestSeen[1];
    const minorIsNewer: boolean = minor > largestSeen[1];

    const patchIsSame: boolean = patch == largestSeen[2];
    const patchIsNewer: boolean = patch > largestSeen[2];

    const infoExisted: boolean = largestSeen[3] != null;
    const infoLexicallyGreater: boolean = (
        info != null && largestSeen[3] != null && info.localeCompare(largestSeen[3]) == 1
    );

    if (majorIsNewer) {
        /* A bigger major number is found. */

        return [major, minor, patch, info];
    } else if (majorIsSame) {
        /* Minor is the same and the patch is greater. */

        const patchVersionIncrement: boolean = minorIsSame && patchIsNewer;

        /* The SemVer string is the same but there is no new extra info. */

        const stableVersionIncrement: boolean = minorIsSame && patchIsSame && !info && infoExisted;

        if (minorIsNewer || patchVersionIncrement || stableVersionIncrement || infoLexicallyGreater) {
            return [major, minor, patch, info];
        }
    }

    return largestSeen;
}
