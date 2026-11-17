//
// Splits a file's diff, as git diff-tree writes it, into lines the file pane colours by kind and
// numbers in the old and new file, so the diff reads as the style guide's diff view draws one.
//

//
// What a line of a diff is: one of git's header lines before the first hunk or a "\ No newline at
// end of file" note ("meta"), a hunk's "@@" header ("hunk"), or a line the change added, deleted
// or kept ("added", "deleted", "context").
//
export type DiffLineKind = "meta" | "hunk" | "added" | "deleted" | "context";

//
// One line of a diff, with its number in each file it is in.
//
export interface IDiffLine {
    // What the line is, which picks its colours.
    kind: DiffLineKind;

    // The line's number in the old file, or undefined for a line the old file does not have.
    oldNumber: number | undefined;

    // The line's number in the new file, or undefined for a line the new file does not have.
    newNumber: number | undefined;

    // The line's text: without git's "+", "-" or " " for a hunk's line, as git wrote it otherwise.
    text: string;
}

//
// Matches a hunk header, "@@ -<old start>[,<count>] +<new start>[,<count>] @@", capturing the
// old and new start lines.
//
const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

//
// Splits the diff into its lines and works out each line's kind and numbers. Lines before the first
// hunk header are git's own header lines. Each hunk header starts the numbering again from the
// lines it names. The newline git ends the diff with makes no line of its own.
//
export function parseDiffLines(diff: string): IDiffLine[] {
    const texts = diff.split("\n");
    if (texts[texts.length - 1] === "") {
        texts.pop();
    }
    const lines: IDiffLine[] = [];
    let isInHunk = false;
    let oldNumber = 0;
    let newNumber = 0;
    for (const text of texts) {
        const header = HUNK_HEADER.exec(text);
        if (header) {
            isInHunk = true;
            oldNumber = Number(header[1]);
            newNumber = Number(header[2]);
            lines.push(diffLine("hunk", undefined, undefined, text));
            continue;
        }
        if (!isInHunk) {
            lines.push(diffLine("meta", undefined, undefined, text));
            continue;
        }
        if (text.startsWith("+")) {
            lines.push(diffLine("added", undefined, newNumber, text.slice(1)));
            newNumber += 1;
        }
        else {
            if (text.startsWith("-")) {
                lines.push(diffLine("deleted", oldNumber, undefined, text.slice(1)));
                oldNumber += 1;
            }
            else {
                if (text.startsWith(" ")) {
                    lines.push(diffLine("context", oldNumber, newNumber, text.slice(1)));
                    oldNumber += 1;
                    newNumber += 1;
                }
                else {
                    lines.push(diffLine("meta", undefined, undefined, text));
                }
            }
        }
    }
    return lines;
}

//
// Builds one line of a diff, so parseDiffLines writes each line's parts in one place.
//
export function diffLine(kind: DiffLineKind, oldNumber: number | undefined, newNumber: number | undefined, text: string): IDiffLine {
    return {
        kind,
        oldNumber,
        newNumber,
        text,
    };
}
