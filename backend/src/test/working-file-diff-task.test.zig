//
// Tests the working file diff task the way the frontend runs it: each test starts a backend with
// Ziggy's fake native app, registering the working file diff task made with a mock of the Git
// interface function, queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const working_file_diff_task = @import("../lib/working-file-diff-task.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// Declares a backend whose only task is the working file diff task, run with the Git interface
// function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"working-file-diff" = working_file_diff_task.working_file_diff_task_handler(
                run_git,
            ),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the working file diff task with the data and waits for the
// message containing the text.
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
            "\"taskType\":\"working-file-diff\",\"source\":\"repo-explorer-page\"," ++
            "\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the working file diff task gives a staged file's diff as its result" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
            "diff",
            "--cached",
            "--",
            "README.md",
        },
        .expected_shown_args = &.{
            "diff",
            "--cached",
            "--",
            "README.md",
        },
        .exit_code = 0,
        .stdout = "+# Test repo\n",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"path\":\"README.md\",\"isStaged\":true,\"status\":\"M\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"diff\":\"+# Test repo\\n\"}",
    );
}

test "the working file diff task reads an untracked file's whole text" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
            "diff",
            "--no-index",
            "--",
            "/dev/null",
            "new.txt",
        },
        .expected_shown_args = &.{
            "diff",
            "--no-index",
            "--",
            "/dev/null",
            "new.txt",
        },
        .exit_code = 1,
        .stdout = "+A new file.\n",
        .stderr = "",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"path\":\"new.txt\",\"isStaged\":false,\"status\":\"?\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"diff\":\"+A new file.\\n\"}",
    );
}

test "the working file diff task fails with a description of the error when git diff fails" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "/repo",
            "diff",
            "--",
            "gone.txt",
        },
        .expected_shown_args = &.{
            "diff",
            "--",
            "gone.txt",
        },
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad path\n",
        .start_error = null,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"path\":\"gone.txt\",\"isStaged\":false,\"status\":\"D\"}",
        "Running git diff failed, so the file's changes could not be read.",
    );
}
