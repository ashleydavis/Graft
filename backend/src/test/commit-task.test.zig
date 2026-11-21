//
// Tests the commit task the way the frontend runs it: each test starts a backend with Ziggy's fake
// native app, registering the task made with a mock of the Git interface function, queues it as
// the frontend does and checks how it ends, with git's error text when git fails.
//

const std = @import("std");
const ziggy = @import("ziggy");
const commit_task = @import("../lib/commit-task.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const test_environment = @import("test-environment.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// Declares a backend whose only task is the commit task, run with the Git interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .commit = commit_task.commit_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the commit task with the message "Add the notes" in the
// repo at "/repo" and waits for the message containing the text.
//
fn expect_task_message(comptime run_git: git_interface.RunGit, expected_text: []const u8) !void {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), declare_app(run_git));
    defer native_app.stop(io, std.testing.allocator);

    try native_app.send(
        io,
        std.testing.allocator,
        "{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{\"taskId\":\"t1\"," ++
            "\"taskType\":\"commit\",\"source\":\"repo-explorer-page\"," ++
            "\"data\":{\"repoPath\":\"/repo\",\"message\":\"Add the notes\"}}}",
    );
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

//
// Makes a mock of `git commit --message "Add the notes"` that returns the exit code and the
// standard error.
//
fn commit_mock(comptime exit_code: ?u8, comptime stderr: []const u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
            "commit",
            "--message",
            "Add the notes",
        },
        .expected_shown_args = &.{
            "commit",
            "--message",
            "Add the notes",
        },
        .exit_code = exit_code,
        .stdout = "",
        .stderr = stderr,
        .start_error = null,
    });
}

test "the commit task commits and gives the message as its result" {
    try expect_task_message(
        comptime commit_mock(0, ""),
        "\"status\":\"succeeded\",\"outputs\":{\"message\":\"Add the notes\"}",
    );
}

test "the commit task fails with git's error text when a hook refuses the commit" {
    try expect_task_message(
        comptime commit_mock(1, "The pre-commit hook found a problem.\n"),
        "Git did not make the commit:\\nThe pre-commit hook found a problem.",
    );
}
