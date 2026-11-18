//
// Tests the diff line parser: parses diffs as git diff-tree writes them and checks each line's
// kind, numbers and text.
//

import { diffLine, parseDiffLines } from "../../lib/diff-lines";

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
