/** A [RegExp] to [string] replacement map for use on a file. */
export class ReplacementMap {
    /** The regular expression to match and replace. */
    matcher: RegExp;

    /** The literal replacement to use to replace the given regular expression. */
    replacement: string;

    constructor(matcher: RegExp, replacement: string) {
        this.matcher = matcher;
        this.replacement = replacement;
    }
}
