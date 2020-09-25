import * as core from "@actions/core";
import * as exec from "@actions/exec";

import findMaxSatisfyingSemver from "semver/ranges/max-satisfying";


export async function findLatestVersionFromText(text: string, stableOnly: boolean): Promise<string | null> {
    /* Start by normalising all of the input as trimmed and split by newline. */

    const cleanedText: string = text.trim();
    const textBlocks: string[] = cleanedText.split("\n");
    const cleanedTextBlocks: string[] = textBlocks.map(String.prototype.trim);

    /* Determine highest version. Note that "stableOnly" needs to be here otherwise context is lost. */

    const maxVersion: string = findMaxSatisfyingSemver(
        cleanedTextBlocks, ">0.0.0", {includePrerelease: !stableOnly}
    ) || "0.0.0";

    if (stableOnly) {
        core.info(
            `[Autolib] [Result] Of input: [${cleanedText}] the max stable version found was: [${maxVersion}].`
        );
    } else {
        core.info(
            `[Autolib] [Result] Of input: [${cleanedText}] the max unstable version found was: [${maxVersion}].`
        );
    }

    return maxVersion;
}


// noinspection JSUnusedGlobalSymbols
/**
 * Using `git` tags, find the latest version (if this is possible).
 *
 * If no version is found, just return 0.0.0 with no info associated.
 *
 * @param stableOnly whether we should only extract stable versions
 */
export async function findLatestVersionFromGitTags(stableOnly: boolean): Promise<string> {
    let latestVersion: string | null = null;

    await exec.exec('git fetch --tags');

    // noinspection AnonymousFunctionJS
    await exec.exec('git tag', [], {
        listeners: {
            stdout: async (data: Buffer) => {
                const dataText: string = data.toString();

                latestVersion = await (findLatestVersionFromText(dataText, stableOnly));
            }
        }
    });

    /* Fallback to 0.0.0 when no tags are found to be valid. */

    if (!latestVersion) {
        core.warning("[Autolib] No tags were found, returning a max version of [0.0.0].");
    }

    return latestVersion || "0.0.0";
}
