import fs from "fs";

import findMaxSatisfyingSemver from "semver/ranges/max-satisfying";

import * as core from "@actions/core";
import * as exec from "@actions/exec";

import { ReplacementMap } from "./types/ReplacementMap";


/**
 * Given a file, perform replacements based on the [ReplacementMap] and write.
 *
 * @param filename the file's name
 * @param replacements the [Array] of [ReplacementMap]s
 */
export async function rewriteFileContentsWithReplacements(
    filename: string, replacements: ReplacementMap[],
): Promise<void> {
    fs.exists(filename, (exists: boolean) => {
        if (exists) {
            /* If the file exists, we can perform the replacement by reading from the file first: */

            fs.readFile(filename, (_, data: Buffer) => {
                let replaced: string = data.toString();

                replacements.forEach((replaceMap: ReplacementMap) => {
                    replaced = replaced.replace(replaceMap.matcher, replaceMap.replacement);
                });

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
    await rewriteFileContentsWithReplacements(filename, [new ReplacementMap(matcher, replacement)]);
}

export async function findLatestVersionFromText(text: string, stableOnly: boolean): Promise<string | null> {
    const cleanedText: string[] = text.trim()
        .split('\n')
        .map(text => text.trim());

    const maxVersion: string = findMaxSatisfyingSemver(
        cleanedText, ">0.0.0", {includePrerelease: !stableOnly}
    )!;

    core.info(
        `[Autolib] [Result] Of versions: [${cleanedText.join(', ')}], the ` +
        `${stableOnly ? 'stable max' : 'max including pre-releases'} was found to be: [${maxVersion}].`
    );

    return maxVersion;
}


/**
 * Using `git` tags, find the latest version (if this is possible).
 *
 * If no version is found, just return 0.0.0 with no info associated.
 *
 * @param stableOnly whether we should only extract stable versions
 */
export async function findLatestVersionFromGitTags(stableOnly: boolean): Promise<string> {
    try {
        await exec.exec('git fetch --tags');
        await exec.exec('git tag', [], {
            listeners: {
                stdout: async (data: Buffer) => {
                    return (await findLatestVersionFromText(data.toString(), stableOnly))!;
                }
            }
        });
    } catch {
        core.warning('[Autolib] Error in fetching a compliant max git tag. Returning [0.0.0].');
    }

    /* Fallthrough: 0.0.0 when no tags are found to be valid. */

    return "0.0.0";
}
