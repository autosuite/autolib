import fs from 'fs';

import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { ReplacementMap } from './types/ReplacementMap';
import { SemVer } from './types/SemVer';


/**
 * Given a file, perform replacements based on the [ReplacementMap] and write.
 *
 * @param filename the file's name
 * @param replacements the [Array] of [ReplacementMap]s
 */
export async function rewriteFileContentsWithReplacements(
    filename: string, replacements: Array<ReplacementMap>,
): Promise<void> {
    fs.exists(filename, function (exists: boolean) {
        if (exists) {
            /* If the file exists, we can perform the replacement by reading from the file first: */

            fs.readFile(filename, (_, data: Buffer) => {
                let replaced: string = data.toString();

                replacements.forEach(replaceMap => {
                    replaced = replaced.replace(replaceMap.matcher, replaceMap.replacement);
                })

                fs.writeFile(filename, replaced, () => null);
            });
        } else {
            /* If the file does not exist, we produce a warning and stop. */

            core.warning(`[Autolib] Cannot perform replace-rewrite of file that does not exist: ${filename}.`);
        }
    });
}


/**
 * Given a file, perform a single replacement based on the matcher and replacement.
 *
 * @param filename the file's name
 * @param matcher the matcher [RegExp]
 * @param replacement the replacement [string]
 */
export async function rewriteFileContentsWithReplacement(
    filename: string, matcher: RegExp, replacement: string,
): Promise<void> {
    rewriteFileContentsWithReplacements(filename, [new ReplacementMap(matcher, replacement)]);
}


/**
 * Given [string] of newline-delimited tags in text, find the latest tag and return it as [[SemVer]].
 *
 * Note the example: `1.0.0-rc2 < 1.0.0`.
 *
 * @param text the text with tags from which to find the latest SemVer version
 * @param stableOnly if the function should ignore all prerelease/build info-appended versions
 * @returns a SemVer representation as a 4-ary [Tuple] of 3 [number]s and 1 optional [string]
 */
export async function findLatestSemVerUsingString(text: string, stableOnly: boolean): Promise<SemVer> {
    const versionsInText: SemVer[] = text.trim().split("\n")
        /* Remove surrounding whitespace from all tags. */

        .map(tag => tag.trim())

        /* Convert into SemVer or zeroed "invalid" version. */

        .map(tag => {
            try {
                const candidate: SemVer = SemVer.constructFromText(tag);

                if (stableOnly && candidate.info) {
                    /* If in "stable-only" mode, versions with info strings are invalid. */

                    core.info(`[Autolib] [Parse] ${tag} is valid SemVer but it's not stable and this is stable mode.`);

                    return SemVer.constructZero();
                }

                core.info(`[Autolib] [Parse] ${tag} is valid SemVer! Nice.`);

                return candidate;
            } catch {
                core.info(`[Autolib] [Parse] ${tag} is invalid SemVer.`);

                return SemVer.constructZero();
            }
        })

        /* Filter out "zeroed" versions. */

        .filter(tag => !tag.isZero());

    const max: SemVer = SemVer.max(versionsInText);

    core.info(
        `[Autolib] [Result] Of versions: [${versionsInText.join(", ")}], the ${stableOnly ? "stable max" : "max"} ` +
        `was found to be: [${max}].`
    );

    return max;
}


/**
 * Using `git` tags, find the latest version (if this is possible).
 *
 * If no version is found, just return 0.0.0 with no info associated.
 *
 * @param stableOnly whether we should only extract stable versions
 */
export async function findLatestVersionFromGitTags(stableOnly: boolean): Promise<SemVer> {
    let text: SemVer | null = null;

    try {
        await exec.exec('git fetch --tags');
        await exec.exec('git tag', [], {
            listeners: {
                stdout: async (data: Buffer) => {
                    text = await findLatestSemVerUsingString(data.toString(), stableOnly);
                }
            }
        });
    } catch {
        core.warning("[Autolib] Compliant git tag cannot be found. Returning 0.0.0.");
    }

    if (!text) {
        return SemVer.constructZero();
    }

    return text;
}
