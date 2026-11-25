//
// Tests the branches task the way the frontend runs it: each test starts a backend with Ziggy's
// fake native app, registering the branches task made with a mock of the Git interface function,
// queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const branches_task = @import("../lib/branches-task.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// The arguments of the `git for-each-ref` call the task makes for the repo at "/repo".
//
const branch_args: []const []const u8 = &.{
    "-C",
    "/repo",
    "for-each-ref",
    "--sort=refname",
    "--format=%(HEAD) %(refname)",
    "refs/heads/",
};

//
// The arguments the help panel is given to show for the same command.
//
const branch_shown_args: []const []const u8 = &.{
    "for-each-ref",
    "--sort=refname",
    "--format=%(HEAD) %(refname)",
    "refs/heads/",
};

//
// Declares a backend whose only task is the branches task, run with the Git interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .branches = branches_task.branches_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the branches task with the data and waits for the message
// containing the text.
//
fn expect_task_message(
    comptime run_git: git_interface.RunGit,
    data_json: []const u8,
    expected_text: []const u8,
) !void {
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

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"branches\",\"source\":\"repo-explorer-page\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the branches task gives the repo's local branches as its result" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = branch_args,
        .expected_shown_args = branch_shown_args,
        .exit_code = 0,
        .stdout = "  refs/heads/feature/x\n* refs/heads/main\n",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"branches\":[{\"name\":\"feature/x\"," ++
            "\"isCheckedOut\":false},{\"name\":\"main\",\"isCheckedOut\":true}]}",
    );
}

test "the branches task gives no branches for a repo with no commits" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = branch_args,
        .expected_shown_args = branch_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"branches\":[]}",
    );
}

test "the branches task fails with a description of the error when git fails" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = branch_args,
        .expected_shown_args = branch_shown_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: not a git repository\n",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "Running git for-each-ref failed, so the repo's branches could not be read.",
    );
}

test "the branches task refuses an empty repo path without starting git" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .expected_shown_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"\"}",
        "The repo path is empty. Give the path of the repo to read.",
    );
}
