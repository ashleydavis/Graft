//
// Tests the `diff-tree` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with for a commit's changed files and for one file's diff, how it parses
// git's list of changed files and every way the request or git's output can be refused.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_diff_tree = @import("../lib/git-diff-tree.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const ConsoleLog = ziggy.task_queue.utils.log.ConsoleLog;

//
// The hash of the commit the tests read.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// The arguments `read_changed_files` starts git with for the commit in the repo at "repo".
//
const changed_files_args: []const []const u8 = &.{
    "-C",
    "repo",
    "diff-tree",
    "-r",
    "-z",
    "--root",
    "--no-commit-id",
    "--name-status",
    commit_hash,
};

//
// The arguments `read_file_diff` starts git with for notes.txt in the commit in the repo at "repo".
//
const file_diff_args: []const []const u8 = &.{
    "-C",
    "repo",
    "diff-tree",
    "-r",
    "-p",
    "--root",
    "--no-commit-id",
    commit_hash,
    "--",
    "notes.txt",
};

//
// The request for the changed files of the commit in the repo at "repo".
//
const changed_files_request: git_diff_tree.ChangedFilesRequest = .{
    .repo_path = "repo",
    .hash = commit_hash,
};

//
// The request for the diff of notes.txt in the commit in the repo at "repo".
//
const file_diff_request: git_diff_tree.FileDiffRequest = .{
    .repo_path = "repo",
    .hash = commit_hash,
    .path = "notes.txt",
};

//
// What `git diff-tree -z --name-status` writes for a commit that changed three files.
//
const three_files_output = "M\x00notes.txt\x00A\x00docs/new file.md\x00D\x00old.txt\x00";

//
// What `git diff-tree -p` writes for notes.txt changed from one line to another.
//
const notes_diff = "diff --git a/notes.txt b/notes.txt\n" ++
    "index ad96917..f76ea96 100644\n" ++
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
    .exit_code = 0,
    .stdout = "",
    .stderr = "",
    .start_error = error.GitStartedWhenItShouldNotBe,
});

test "read_changed_files lists each file the commit changed with its status" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .exit_code = 0,
        .stdout = three_files_output,
        .stderr = "",
        .start_error = null,
    });
    const files = try git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        changed_files_request,
    );
    try std.testing.expectEqual(@as(usize, 3), files.len);
    try std.testing.expectEqualStrings("M", files[0].status);
    try std.testing.expectEqualStrings("notes.txt", files[0].path);
    try std.testing.expectEqualStrings("A", files[1].status);
    try std.testing.expectEqualStrings("docs/new file.md", files[1].path);
    try std.testing.expectEqualStrings("D", files[2].status);
    try std.testing.expectEqualStrings("old.txt", files[2].path);
}

test "read_changed_files lists no files when git lists none, as for a merge commit" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = null,
    });
    const files = try git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        changed_files_request,
    );
    try std.testing.expectEqual(@as(usize, 0), files.len);
}

test "read_changed_files refuses a hash that git could read as an option without starting git" {
    try std.testing.expectError(error.InvalidCommitHash, git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = "--all",
        },
    ));
}

test "read_changed_files fails with GitDiffTreeFailed when git exits with an error" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitDiffTreeFailed, git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
}

test "read_changed_files passes up the error when git cannot be started" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
}

//
// Reads the changed files of `three_files_output` with the allocator, for the allocation failure
// test. They are allocated in an arena over the allocator, as a task's are.
//
fn read_three_files(allocator: std.mem.Allocator) !void {
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .exit_code = 0,
        .stdout = three_files_output,
        .stderr = "",
        .start_error = null,
    });
    _ = try git_diff_tree.read_changed_files(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        changed_files_request,
    );
}

test "read_changed_files frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_three_files, .{});
}

test "parse_name_status_output refuses a status with no path" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00notes.txt\x00A\x00"),
    );
}

test "parse_name_status_output refuses output that does not end with a NUL" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00notes.txt\x00extra"),
    );
}

test "parse_name_status_output refuses a status that is not one letter, such as a rename's" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "R100\x00old.txt\x00"),
    );
}

test "parse_name_status_output refuses an empty path" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00\x00"),
    );
}

test "read_file_diff reads the diff of the one file in the commit" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .exit_code = 0,
        .stdout = notes_diff,
        .stderr = "",
        .start_error = null,
    });
    const diff = try git_diff_tree.read_file_diff(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        file_diff_request,
    );
    try std.testing.expectEqualStrings(notes_diff, diff);
}

test "read_file_diff refuses a hash that git could read as an option without starting git" {
    try std.testing.expectError(error.InvalidCommitHash, git_diff_tree.read_file_diff(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = "-p",
            .path = "notes.txt",
        },
    ));
}

test "read_file_diff refuses an empty path without starting git" {
    try std.testing.expectError(error.InvalidFilePath, git_diff_tree.read_file_diff(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = commit_hash,
            .path = "",
        },
    ));
}

test "read_file_diff fails with GitDiffTreeFailed when git exits with an error" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitDiffTreeFailed, git_diff_tree.read_file_diff(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        file_diff_request,
    ));
}

//
// Reads the diff of notes.txt with the allocator, for the allocation failure test. The diff is
// allocated in an arena over the allocator, as a task's is.
//
fn read_notes_diff(allocator: std.mem.Allocator) !void {
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .exit_code = 0,
        .stdout = notes_diff,
        .stderr = "",
        .start_error = null,
    });
    _ = try git_diff_tree.read_file_diff(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        file_diff_request,
    );
}

test "read_file_diff frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_notes_diff, .{});
}
