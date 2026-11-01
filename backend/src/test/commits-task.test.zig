//
// Tests the commits task the way the frontend runs it: each test starts a backend with Ziggy's
// fake native app, registering the commits task made with a mock of the Git interface function,
// queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const commits_task = @import("../lib/commits-task.zig");
const error_text = @import("../lib/error-text.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// The hash of the one commit the mocks answer with.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// What `git log -z` writes for a repo of one commit.
//
const one_commit_output = commit_hash ++ "\x1f\x1fHEAD -> main\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
    "The first commit\x1f\x00";

//
// The format argument the `log` wrapper passes.
//
const format_arg = "--format=%H%x1f%P%x1f%D%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%s%x1f%b";

//
// Declares a backend whose only task is the commits task, run with the Git interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .commits = commits_task.commits_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
        .describe_error = error_text.describe_error,
    });
}

//
// Starts a backend of the app, queues the commits task with the data and waits for the message
// containing the text.
//
fn expect_task_message(
    comptime run_git: git_interface.RunGit,
    data_json: []const u8,
    expected_text: []const u8,
) !void {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), declare_app(run_git));
    defer native_app.stop(io, std.testing.allocator);

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"commits\",\"source\":\"commits\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the commits task reads the first page and gives it as its result" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{ "-C", "/repo", "log", "-z", "--max-count=50", format_arg },
        .exit_code = 0,
        .stdout = one_commit_output,
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"pageSize\":50}",
        "\"status\":\"succeeded\",\"outputs\":{\"commits\":[{\"hash\":\"" ++ commit_hash ++
            "\",\"parentHashes\":[],\"refs\":[\"HEAD -> main\"],\"authorName\":\"Ada Author\"",
    );
}

test "the commits task reads a later page after the hash it is given" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
            "log",
            "-z",
            "--max-count=5",
            format_arg,
            "--skip=1",
            "abc123",
        },
        .exit_code = 0,
        .stdout = one_commit_output,
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"pageSize\":5,\"afterHash\":\"abc123\"}",
        "\"status\":\"succeeded\"",
    );
}

test "the commits task fails with a description of the error when git log fails" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{ "-C", "/repo", "log", "-z", "--max-count=50", format_arg },
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: not a git repository\n",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"pageSize\":50}",
        "Running git log failed, so the commits could not be read.",
    );
}

test "the commits task fails when its data has no page size" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try expect_task_message(mock, "{\"repoPath\":\"/repo\"}", "\"status\":\"failed\"");
}
