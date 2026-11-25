//
// Tests the tags task the way the frontend runs it: each test starts a backend with Ziggy's fake
// native app, registering the tags task made with a mock of the Git interface function, queues the
// task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const tags_task = @import("../lib/tags-task.zig");
const test_environment = @import("test-environment.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// The `git for-each-ref` call the task makes for the tag names of the repo at /repo, returning
// what git returns when it exits with the code and output.
//
fn names_call(comptime exit_code: ?u8, comptime output: []const u8) git_mock.MockGitOptions {
    return .{
        .expected_args = &.{
            "-C",
            "/repo",
            "for-each-ref",
            "--sort=refname",
            "--format=%(refname:strip=2)",
            "refs/tags",
        },
        .expected_shown_args = &.{
            "for-each-ref",
            "--sort=refname",
            "--format=%(refname:strip=2)",
            "refs/tags",
        },
        .exit_code = exit_code,
        .stdout = output,
        .stderr = "",
        .start_error = null,
    };
}

//
// Declares a backend whose only task is the tags task, run with the Git interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .tags = tags_task.tags_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the tags task with the data and waits for the message
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
            "\"taskType\":\"tags\",\"source\":\"repo-explorer-page\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the tags task gives the names of the repo's tags" {
    const mock = comptime git_mock.mock_git(names_call(0, "v1.0\nv2.0\n"));
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"names\":[\"v1.0\",\"v2.0\"]}",
    );
}

test "the tags task gives no names for a repo with no tags" {
    const mock = comptime git_mock.mock_git(names_call(0, ""));
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"names\":[]}",
    );
}

test "the tags task fails with a description of the error when git fails" {
    const mock = comptime git_mock.mock_git(names_call(128, ""));
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\"}",
        "Running git for-each-ref failed, so the repo's tags could not be read.",
    );
}

test "the tags task refuses an empty repo path" {
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
