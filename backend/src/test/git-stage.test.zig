//
// Tests the `add` and `restore --staged` wrappers with the mock of the Git interface function in
// place of `git`: the arguments each starts git with, the text the frontend is sent when git fails
// and the refusal of an empty path.
//

const std = @import("std");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const git_stage = @import("../lib/git-stage.zig");

const io = std.testing.io;

//
// The request for notes.txt in the repo at "repo".
//
const notes_request: git_stage.StageRequest = .{
    .repo_path = "repo",
    .path = "notes.txt",
};

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
// Makes a mock of `git add -- notes.txt` in the repo at "repo" that exits with the code.
//
fn add_mock(comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "repo",
            "add",
            "--",
            "notes.txt",
        },
        .expected_shown_args = &.{
            "add",
            "--",
            "notes.txt",
        },
        .exit_code = exit_code,
        .stdout = "",
        .stderr = "fatal: pathspec did not match\n",
        .start_error = null,
    });
}

//
// Makes a mock of `git restore --staged -- notes.txt` in the repo at "repo" that exits with the
// code.
//
fn restore_mock(comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "repo",
            "restore",
            "--staged",
            "--",
            "notes.txt",
        },
        .expected_shown_args = &.{
            "restore",
            "--staged",
            "--",
            "notes.txt",
        },
        .exit_code = exit_code,
        .stdout = "",
        .stderr = "fatal: could not resolve HEAD\n",
        .start_error = null,
    });
}

test "stage_file runs git add on the one file" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try git_stage.stage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime add_mock(0),
        notes_request,
    );
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "stage_file fails with GitAddFailed when git exits with an error" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.GitAddFailed, git_stage.stage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime add_mock(128),
        notes_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git add failed, so the file was not staged. Check that the file still has " ++
            "changes. Git's output is in Graft's log.",
        task.failure.?,
    );
}

test "stage_file refuses an empty path without starting git" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.InvalidFilePath, git_stage.stage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_never_called,
        .{
            .repo_path = "repo",
            .path = "",
        },
    ));
    try std.testing.expectEqualStrings(stage_path_text, task.failure.?);
}

test "stage_file refuses an absolute path without starting git" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.InvalidFilePath, git_stage.stage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_never_called,
        .{
            .repo_path = "repo",
            .path = "/etc/passwd",
        },
    ));
    try std.testing.expectEqualStrings(stage_path_text, task.failure.?);
}

//
// The text the frontend is sent when the stage or unstage task gets a path that is empty or
// outside the repo, which the refusal tests check.
//
const stage_path_text = "The stage or unstage task got a path that is empty or outside the " ++
    "repo, so no file was staged or unstaged. Give the path of a changed file from the " ++
    "repo's root.";

test "unstage_file runs git restore --staged on the one file" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try git_stage.unstage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime restore_mock(0),
        notes_request,
    );
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "unstage_file fails with GitRestoreFailed when git ends without exiting" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.GitRestoreFailed, git_stage.unstage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime restore_mock(null),
        notes_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git restore failed, so the file was not unstaged. Check that the file still " ++
            "has staged changes. Git's output is in Graft's log.",
        task.failure.?,
    );
}

test "unstage_file refuses an empty path without starting git" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.InvalidFilePath, git_stage.unstage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_never_called,
        .{
            .repo_path = "repo",
            .path = "",
        },
    ));
    try std.testing.expectEqualStrings(stage_path_text, task.failure.?);
}

//
// Stages notes.txt with the allocator, for the allocation failure test. What git wrote is
// allocated in an arena over the allocator, as a task's is.
//
fn stage_notes(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    try git_stage.stage_file(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime add_mock(0),
        notes_request,
    );
}

test "stage_file frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, stage_notes, .{});
}
