//
// Tests the diff line parser: parses diffs as git diff-tree writes them and checks each line's
// kind, numbers and text, then splits the lines into hunks and checks each hunk's header and lines.
//

import { diffLine, parseDiffLines, splitDiffHunks } from "../../lib/diff-lines";

describe("parseDiffLines", () => {
    test("reads git's header lines before the first hunk as header lines", () => {
        expect(parseDiffLines("diff --git a/notes.txt b/notes.txt\nindex 1111111..2222222 100644\n")).toEqual([
            diffLine("meta", undefined, undefined, "diff --git a/notes.txt b/notes.txt"),
            diffLine("meta", undefined, undefined, "index 1111111..2222222 100644"),
        ]);
    });

    test("numbers a hunk's lines from its header in the old and new file", () => {
        expect(parseDiffLines("@@ -3,3 +3,3 @@ heading\n kept\n-old\n+new\n kept too\n")).toEqual([
            diffLine("hunk", undefined, undefined, "@@ -3,3 +3,3 @@ heading"),
            diffLine("context", 3, 3, "kept"),
            diffLine("deleted", 4, undefined, "old"),
            diffLine("added", undefined, 4, "new"),
            diffLine("context", 5, 5, "kept too"),
        ]);
    });

    test("reads hunk headers with no counts and starts each hunk's numbers afresh", () => {
        expect(parseDiffLines("@@ -1 +1 @@\n-a\n+b\n@@ -10,0 +11,1 @@\n+c")).toEqual([
            diffLine("hunk", undefined, undefined, "@@ -1 +1 @@"),
            diffLine("deleted", 1, undefined, "a"),
            diffLine("added", undefined, 1, "b"),
            diffLine("hunk", undefined, undefined, "@@ -10,0 +11,1 @@"),
            diffLine("added", undefined, 11, "c"),
        ]);
    });

    test("reads git's no newline note inside a hunk as a header line", () => {
        expect(parseDiffLines("@@ -1 +1 @@\n-a\n\\ No newline at end of file\n")).toEqual([
            diffLine("hunk", undefined, undefined, "@@ -1 +1 @@"),
            diffLine("deleted", 1, undefined, "a"),
            diffLine("meta", undefined, undefined, "\\ No newline at end of file"),
        ]);
    });

    test("reads an empty diff as no lines", () => {
        expect(parseDiffLines("")).toEqual([]);
    });
});

describe("splitDiffHunks", () => {
    test("puts git's header lines in a hunk with no header and each hunk's lines under its header", () => {
        const lines = parseDiffLines("--- a/notes.txt\n+++ b/notes.txt\n@@ -1 +1 @@\n-a\n+b\n@@ -10,0 +11,1 @@\n+c\n\\ No newline at end of file\n");
        expect(splitDiffHunks(lines)).toEqual([
            {
                header: undefined,
                lines: [lines[0], lines[1]],
            },
            {
                header: lines[2],
                lines: [lines[3], lines[4]],
            },
            {
                header: lines[5],
                lines: [lines[6], lines[7]],
            },
        ]);
    });

    test("gives a hunk with no lines when its header is the last line", () => {
        const lines = parseDiffLines("@@ -1 +1 @@\n");
        expect(splitDiffHunks(lines)).toEqual([
            {
                header: lines[0],
                lines: [],
            },
        ]);
    });

    test("gives no hunks for no lines", () => {
        expect(splitDiffHunks([])).toEqual([]);
    });
});
