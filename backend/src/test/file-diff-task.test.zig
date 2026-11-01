//
// Tests the file diff task the way the frontend runs it: each test starts a backend with Ziggy's
// fake native app, registering the file diff task made with a mock of the Git interface function,
// queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const error_text = @import("../lib/error-text.zig");
const file_diff_task = @import("../lib/file-diff-task.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// The hash of the commit the tests read.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// The arguments of the `git diff-tree` call the task makes for README.md in the commit.
//
const diff_args: []const []const u8 = &.{
    "-C",
    "/repo",
    "diff-tree",
    "-r",
    "-p",
    "--root",
    "--no-commit-id",
    commit_hash,
    "--",
    "README.md",
};

//
// The data the frontend queues the task with for README.md in the commit.
//
const readme_data = "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++
    "\",\"path\":\"README.md\"}";

//
// Declares a backend whose only task is the file diff task, run with the Git interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"file-diff" = file_diff_task.file_diff_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
        .describe_error = error_text.describe_error,
    });
}

//
// Starts a backend of the app, queues the file diff task with the data and waits for the message
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
            "\"taskType\":\"file-diff\",\"source\":\"commits\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the file diff task gives the file's diff as its result" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = diff_args,
        .exit_code = 0,
        .stdout = "diff --git a/README.md b/README.md\n+# Test repo\n",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        readme_data,
        "\"status\":\"succeeded\",\"outputs\":{\"diff\":" ++
            "\"diff --git a/README.md b/README.md\\n+# Test repo\\n\"}",
    );
}

test "the file diff task fails with a description of the error when git diff-tree fails" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = diff_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        readme_data,
        "Running git diff-tree failed, so the commit's changes could not be read.",
    );
}

test "the file diff task fails with a description of the error when the path is empty" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++ "\",\"path\":\"\"}",
        "A file's diff was asked for with an empty path.",
    );
}
