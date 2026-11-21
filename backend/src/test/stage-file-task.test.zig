//
// Tests the stage file and unstage file tasks the way the frontend runs them: each test starts a
// backend with Ziggy's fake native app, registering both tasks made with a mock of the Git
// interface function, queues one as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const stage_file_task = @import("../lib/stage-file-task.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// Declares a backend whose only tasks are the stage file and unstage file tasks, run with the Git
// interface function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"stage-file" = stage_file_task.stage_file_task_handler(run_git),
            .@"unstage-file" = stage_file_task.unstage_file_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the task of the type for notes.txt in the repo at "/repo"
// and waits for the message containing the text.
//
fn expect_task_message(
    comptime run_git: git_interface.RunGit,
    task_type: []const u8,
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
            "\"taskType\":\"{s}\",\"source\":\"repo-explorer-page\"," ++
            "\"data\":{{\"repoPath\":\"/repo\",\"path\":\"notes.txt\"}}}}}}",
        .{task_type},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

//
// Answers `git add -- notes.txt` with the exit code.
//
fn add_mock(comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
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
        .stderr = "",
        .start_error = null,
    });
}

//
// Answers `git restore --staged -- notes.txt` with the exit code.
//
fn restore_mock(comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
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
        .stderr = "",
        .start_error = null,
    });
}

test "the stage file task stages the file and gives its path as its result" {
    try expect_task_message(
        comptime add_mock(0),
        "stage-file",
        "\"status\":\"succeeded\",\"outputs\":{\"path\":\"notes.txt\"}",
    );
}

test "the stage file task fails with a description of the error when git add fails" {
    try expect_task_message(
        comptime add_mock(128),
        "stage-file",
        "Running git add failed, so the file was not staged.",
    );
}

test "the unstage file task unstages the file and gives its path as its result" {
    try expect_task_message(
        comptime restore_mock(0),
        "unstage-file",
        "\"status\":\"succeeded\",\"outputs\":{\"path\":\"notes.txt\"}",
    );
}

test "the unstage file task fails with a description of the error when git restore fails" {
    try expect_task_message(
        comptime restore_mock(128),
        "unstage-file",
        "Running git restore failed, so the file was not unstaged.",
    );
}
