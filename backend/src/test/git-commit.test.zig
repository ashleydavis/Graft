//
// Tests the `commit` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with, the text the frontend is sent when git fails (git's own error
// text, such as a hook's), the text sent when git cannot be started or the error text cannot be
// allocated, the refusal of an empty message and that it frees everything when an allocation
// fails.
//

const std = @import("std");
const git_commit = @import("../lib/git-commit.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;

//
// The request to commit in the repo at "repo" with a message of two paragraphs.
//
const commit_request: git_commit.CommitRequest = .{
    .repo_path = "repo",
    .message = "Add the notes\n\nThe notes say what is next.",
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
// Makes a mock of `git commit --message <message>` in the repo at "repo" that exits with the code
// and writes the text to its standard output and standard error.
//
fn commit_mock(
    comptime exit_code: ?u8,
    comptime stdout: []const u8,
    comptime stderr: []const u8,
) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "repo",
            "commit",
            "--message",
            commit_request.message,
        },
        .expected_shown_args = &.{
            "commit",
            "--message",
            commit_request.message,
        },
        .exit_code = exit_code,
        .stdout = stdout,
        .stderr = stderr,
        .start_error = null,
    });
}

//
// Commits with the request through the mock and checks it fails with GitCommitFailed and sends the
// frontend the expected text.
//
fn expect_commit_failure(comptime run_git: git_interface.RunGit, expected_text: []const u8) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.GitCommitFailed, git_commit.commit(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        run_git,
        commit_request,
    ));
    try std.testing.expectEqualStrings(expected_text, task.failure.?);
}

test "commit runs git commit with the message as one argument" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try git_commit.commit(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime commit_mock(0, "[main 1a2b3c4] Add the notes\n", ""),
        commit_request,
    );
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "commit sends git's error text when a hook refuses the commit" {
    try expect_commit_failure(
        comptime commit_mock(1, "", "The pre-commit hook found a problem.\n"),
        "Git did not make the commit:\nThe pre-commit hook found a problem.",
    );
}

test "commit sends what git wrote to its standard output when its standard error is empty" {
    try expect_commit_failure(
        comptime commit_mock(1, "On branch main\nnothing to commit, working tree clean\n", " \n"),
        "Git did not make the commit:\nOn branch main\nnothing to commit, working tree clean",
    );
}

test "commit sends that git gave no reason when git ends without exiting and wrote nothing" {
    try expect_commit_failure(
        comptime commit_mock(null, "", ""),
        "Git did not make the commit and gave no reason. Graft's log has the details.",
    );
}

test "commit refuses an empty message without starting git" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.EmptyCommitMessage, git_commit.commit(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_never_called,
        .{
            .repo_path = "repo",
            .message = " \n\t",
        },
    ));
    try std.testing.expectEqualStrings(
        "The commit task got an empty commit message, so no commit was made. Write a message " ++
            "and commit again.",
        task.failure.?,
    );
}

test "commit sends what to check when git cannot be started" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock_start_fails = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .expected_shown_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_commit.commit(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_start_fails,
        commit_request,
    ));
    try std.testing.expectEqualStrings(
        "Graft could not run git commit. Check that git is installed and on the PATH, then " ++
            "check the commit pane for the commit before committing again.",
        task.failure.?,
    );
}

test "commit sends that git made no commit when its error text cannot be allocated" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    //
    // The mock allocates what git wrote to its standard output and standard error, so the third
    // allocation is the one that builds the failure text.
    //
    var failing = std.testing.FailingAllocator.init(arena.allocator(), .{
        .fail_index = 2,
    });
    try std.testing.expectError(error.OutOfMemory, git_commit.commit(
        io,
        git_mock.mock_services(&task),
        failing.allocator(),
        comptime commit_mock(1, "", "The pre-commit hook found a problem.\n"),
        commit_request,
    ));
    try std.testing.expectEqualStrings(
        "Git did not make the commit. Graft's log has git's output.",
        task.failure.?,
    );
}

//
// Commits with the request through a mock whose git fails, with the allocator, for the allocation
// failure test, so both the commit and the failure text it builds are covered. What git wrote is
// allocated in an arena over the allocator, as a task's is.
//
fn commit_failing(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    git_commit.commit(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        comptime commit_mock(1, "", "The pre-commit hook found a problem.\n"),
        commit_request,
    ) catch |err| {
        if (err == error.GitCommitFailed) {
            return;
        }
        return err;
    };
    return error.CommitDidNotFail;
}

test "commit frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, commit_failing, .{});
}
