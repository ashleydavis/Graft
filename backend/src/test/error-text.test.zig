//
// Tests the descriptions of Graft's errors: each error of Graft's own gets a sentence that says
// what went wrong and what to do, and any other error gets none, so Ziggy uses its name.
//

const std = @import("std");
const error_text = @import("../lib/error-text.zig");

//
// Fails the test when the error has no description or the description does not hold the text.
//
fn expect_description(err: anyerror, expected_text: []const u8) !void {
    const description = error_text.describe_error(err) orelse return error.NoDescription;
    try std.testing.expect(std.mem.indexOf(u8, description, expected_text) != null);
    try std.testing.expect(std.mem.endsWith(u8, description, "."));
}

test "describe_error describes each error the commits task can fail with" {
    try expect_description(error.GitLogFailed, "Running git log failed");
    try expect_description(error.UnexpectedGitLogOutput, "Graft could not read");
    try expect_description(error.InvalidPageSize, "page size of 0");
    try expect_description(error.InvalidCommitHash, "not hexadecimal");
}

test "describe_error describes each error the commit details and file diff tasks can fail with" {
    try expect_description(error.CommitReadFailed, "the commit's details could not be read");
    try expect_description(error.GitDiffTreeFailed, "Running git diff-tree failed");
    try expect_description(error.UnexpectedGitDiffTreeOutput, "Graft could not read");
    try expect_description(error.InvalidFilePath, "empty path");
}

test "describe_error has no description of an error that is not Graft's" {
    const description = error_text.describe_error(error.OutOfMemory);
    try std.testing.expectEqual(@as(?[]const u8, null), description);
}
