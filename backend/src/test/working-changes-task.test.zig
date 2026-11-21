//
// Tests the working changes task the way the frontend runs it: each test starts a backend with
// Ziggy's fake native app, registering the working changes task made with a mock of the Git
// interface function, queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const working_changes_task = @import("../lib/working-changes-task.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// The arguments of the `git status` call the task makes for the repo at "/repo".
//
const status_args: []const []const u8 = &.{
    "-C",
    "/repo",
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--no-renames",
};

//
// The arguments the help panel is given to show for the same command.
//
const status_shown_args: []const []const u8 = &.{
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--no-renames",
};

//
// Declares a backend whose only task is the working changes task, run with the Git interface
// function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"working-changes" = working_changes_task.working_changes_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the working changes task for the repo at "/repo" and waits
// for the message containing the text.
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
            "\"taskType\":\"working-changes\",\"source\":\"repo-explorer-page\"," ++
            "\"data\":{\"repoPath\":\"/repo\"}}}",
    );
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the working changes task gives the unstaged and staged files as its result" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 0,
        .stdout = " M notes.txt\x00A  new.txt\x00",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "\"status\":\"succeeded\",\"outputs\":{\"unstaged\":[{\"status\":\"M\"," ++
            "\"path\":\"notes.txt\"}],\"staged\":[{\"status\":\"A\",\"path\":\"new.txt\"}]}",
    );
}

test "the working changes task fails with a description of the error when git status fails" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: not a git repository\n",
        .start_error = null,
    });
    try expect_task_message(mock, "Running git status failed, so the repo's changes could not");
}
