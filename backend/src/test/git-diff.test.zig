//
// Tests the `diff` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with for a file's staged changes, its unstaged changes and an untracked
// file, which exit codes it reads as a success and the refusal of an empty path.
//

const std = @import("std");
const git_diff = @import("../lib/git-diff.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;

//
// What `git diff` writes for notes.txt changed from one line to another.
//
const notes_diff = "diff --git a/notes.txt b/notes.txt\n" ++
    "--- a/notes.txt\n" ++
    "+++ b/notes.txt\n" ++
    "@@ -1 +1 @@\n" ++
    "-The first note.\n" ++
    "+The second note.\n";

//
// A mock that is never expected to be called: it fails the test's call if the code starts git.
//
const mock_never_called = git_mock.mock_git(.{
    .expected_args = &.{},
    .expected_shown_args = &.{},
    .exit_code = 0,
    .stdout = "",
    .stderr = "",
    .start_error = error.GitStartedWhenItShouldNotBe,
});

//
// Makes a mock that expects git to be started in the repo at "repo" with the arguments, shows the
// same arguments, exits with the code and writes `notes_diff`.
//
fn diff_mock(comptime args: []const []const u8, comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &[_][]const u8{
            "-C",
            "repo",
        } ++ args,
        .expected_shown_args = args,
        .exit_code = exit_code,
        .stdout = notes_diff,
        .stderr = "",
        .start_error = null,
    });
}

//
// Reads the diff of notes.txt from the side through the mock and checks it is `notes_diff`.
//
fn expect_notes_diff(comptime mock: git_interface.RunGit, side: git_diff.ChangeSide) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const diff = try git_diff.read_working_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        .{
            .repo_path = "repo",
            .path = "notes.txt",
            .side = side,
        },
    );
    try std.testing.expectEqualStrings(notes_diff, diff);
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "read_working_file_diff reads a file's staged changes with git diff --cached" {
    try expect_notes_diff(comptime diff_mock(&.{
        "diff",
        "--cached",
        "--",
        "notes.txt",
    }, 0), .staged);
}

test "read_working_file_diff reads a file's unstaged changes with git diff" {
    try expect_notes_diff(comptime diff_mock(&.{
        "diff",
        "--",
        "notes.txt",
    }, 0), .unstaged);
}

test "read_working_file_diff reads an untracked file against /dev/null, exiting with 1" {
    try expect_notes_diff(comptime diff_mock(&.{
        "diff",
        "--no-index",
        "--",
        "/dev/null",
        "notes.txt",
    }, 1), .untracked);
}

test "read_working_file_diff fails with GitDiffFailed when git diff of a tracked file exits 1" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime diff_mock(&.{
        "diff",
        "--",
        "notes.txt",
    }, 1);
    try std.testing.expectError(error.GitDiffFailed, git_diff.read_working_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        .{
            .repo_path = "repo",
            .path = "notes.txt",
            .side = .unstaged,
        },
    ));
    try std.testing.expectEqualStrings(
        "Running git diff failed, so the file's changes could not be read. Check that the file " ++
            "still has changes. Git's output is in Graft's log.",
        task.failure.?,
    );
}

test "read_working_file_diff refuses an empty path without starting git" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.InvalidFilePath, git_diff.read_working_file_diff(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .path = "",
            .side = .staged,
        },
    ));
    try std.testing.expectEqualStrings(working_file_diff_path_text, task.failure.?);
}

test "read_working_file_diff refuses a path outside the repo without starting git" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.InvalidFilePath, git_diff.read_working_file_diff(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .path = "../outside.txt",
            .side = .untracked,
        },
    ));
    try std.testing.expectEqualStrings(working_file_diff_path_text, task.failure.?);
}

//
// The text the frontend is sent when the working file diff task gets a path that is empty or
// outside the repo, which both refusal tests check.
//
const working_file_diff_path_text = "The working file diff task got a path that is empty or " ++
    "outside the repo, so no diff was read. Give the path of a changed file from the repo's root.";

test "change_side picks the staged, untracked or unstaged changes from the list and status" {
    try std.testing.expectEqual(git_diff.ChangeSide.staged, git_diff.change_side(true, "M"));
    try std.testing.expectEqual(git_diff.ChangeSide.untracked, git_diff.change_side(false, "?"));
    try std.testing.expectEqual(git_diff.ChangeSide.unstaged, git_diff.change_side(false, "D"));
}

test "is_diff_success reads 0 as a success, 1 only for an untracked file and no exit as a failure" {
    try std.testing.expect(git_diff.is_diff_success(.staged, 0));
    try std.testing.expect(git_diff.is_diff_success(.untracked, 1));
    try std.testing.expect(!git_diff.is_diff_success(.unstaged, 1));
    try std.testing.expect(!git_diff.is_diff_success(.untracked, 128));
    try std.testing.expect(!git_diff.is_diff_success(.staged, null));
}

//
// Reads the unstaged diff of notes.txt with the allocator, for the allocation failure test. The
// diff is allocated in an arena over the allocator, as a task's is.
//
fn read_notes_diff(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    _ = try git_diff.read_working_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime diff_mock(&.{
            "diff",
            "--",
            "notes.txt",
        }, 0),
        .{
            .repo_path = "repo",
            .path = "notes.txt",
            .side = .unstaged,
        },
    );
}

test "read_working_file_diff frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_notes_diff, .{});
}
