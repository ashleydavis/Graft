//
// Tests the commit details task the way the frontend runs it: each test starts a backend with
// Ziggy's fake native app, registering the commit details task made with a mock of the Git
// interface function, queues the task as the frontend does and checks how it ends.
//

const std = @import("std");
const ziggy = @import("ziggy");
const commit_details_task = @import("../lib/commit-details-task.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// The hash of the commit the tests read.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// The format argument the `log` wrapper passes.
//
const format_arg = "--format=%H%x1f%P%x1f%D%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%s%x1f%b";

//
// The `git log` call the task makes for the commit, answered with the commit.
//
const log_call: git_mock.MockGitOptions = .{
    .expected_args = &.{
        "-C",
        "/repo",
        "log",
        "-z",
        "--no-show-signature",
        "--max-count=1",
        format_arg,
        commit_hash,
        "--",
    },
    .expected_shown_args = &.{
        "log",
        "--no-show-signature",
        "--max-count=1",
        commit_hash,
        "--",
    },
    .exit_code = 0,
    .stdout = commit_hash ++ "\x1f\x1fHEAD -> main\x1f" ++
        "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
        "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
        "The first commit\x1f\x00",
    .stderr = "",
    .start_error = null,
};

//
// The arguments of the `git diff-tree` call the task makes for the commit's changed files.
//
const diff_tree_args: []const []const u8 = &.{
    "-C",
    "/repo",
    "diff-tree",
    "-r",
    "-z",
    "--root",
    "--no-commit-id",
    "--name-status",
    commit_hash,
};

//
// The arguments the help panel is given to show for the same command.
//
const diff_tree_shown_args: []const []const u8 = &.{
    "diff-tree",
    "-r",
    "--root",
    "--no-commit-id",
    "--name-status",
    commit_hash,
};

//
// The `git diff-tree` call the task makes for the line counts of the commit's changed files,
// returning README.md's one added line.
//
const numstat_call: git_mock.MockGitOptions = .{
    .expected_args = &.{
        "-C",
        "/repo",
        "diff-tree",
        "-r",
        "-z",
        "--root",
        "--no-commit-id",
        "--numstat",
        commit_hash,
    },
    .expected_shown_args = &.{
        "diff-tree",
        "-r",
        "--root",
        "--no-commit-id",
        "--numstat",
        commit_hash,
    },
    .exit_code = 0,
    .stdout = "1\t0\tREADME.md\x00",
    .stderr = "",
    .start_error = null,
};

//
// Declares a backend whose only task is the commit details task, run with the Git interface
// function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"commit-details" = commit_details_task.commit_details_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the commit details task with the data and waits for the
// message containing the text.
//
fn expect_task_message(
    comptime run_git: git_interface.RunGit,
    data_json: []const u8,
    expected_text: []const u8,
) !void {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(std.testing.allocator, native_app.data_tmp);
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), declare_app(run_git));
    defer native_app.stop(io, std.testing.allocator);

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"commit-details\",\"source\":\"commits\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

//
// Starts a backend of the app, queues the commit details task with data the backend refuses, waits
// for the message containing the failure text and checks the backend still handles a later
// message, so a test fails when the refusal crashes the backend.
//
fn expect_task_refused(
    comptime run_git: git_interface.RunGit,
    data_json: []const u8,
    failure_text: []const u8,
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
            "\"taskType\":\"commit-details\",\"source\":\"commits\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, "\"status\":\"failed\"");
    try native_app.expectMessageContaining(io, std.testing.allocator, failure_text);
    try native_app.send(
        io,
        std.testing.allocator,
        "{\"kind\":\"system\",\"id\":2,\"name\":\"get-platform\"}",
    );
    try native_app.expectMessageContaining(io, std.testing.allocator, "{\"id\":2,\"ok\":true");
}

test "the commit details task gives the commit and the files it changed with their line counts" {
    const mock = comptime git_mock.mock_git_calls(&.{
        log_call,
        .{
            .expected_args = diff_tree_args,
            .expected_shown_args = diff_tree_shown_args,
            .exit_code = 0,
            .stdout = "A\x00README.md\x00",
            .stderr = "",
            .start_error = null,
        },
        numstat_call,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++ "\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"commit\":{\"hash\":\"" ++ commit_hash ++
            "\",\"parentHashes\":[],\"refs\":[\"HEAD -> main\"],\"authorName\":\"Ada Author\"",
    );
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++ "\"}",
        "\"changedFiles\":[{\"status\":\"A\",\"path\":\"README.md\",\"linesAdded\":1," ++
            "\"linesDeleted\":0,\"isBinary\":false}]",
    );
}

test "the commit details task fails with a description of the error when git log fails" {
    const mock = comptime git_mock.mock_git_calls(&.{
        .{
            .expected_args = log_call.expected_args,
            .expected_shown_args = log_call.expected_shown_args,
            .exit_code = 128,
            .stdout = "",
            .stderr = "fatal: bad object\n",
            .start_error = null,
        },
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++ "\"}",
        "Running git log failed, so the commit's details could not be read.",
    );
}

test "the commit details task fails with a description of the error when git diff-tree fails" {
    const mock = comptime git_mock.mock_git_calls(&.{
        log_call,
        .{
            .expected_args = diff_tree_args,
            .expected_shown_args = diff_tree_shown_args,
            .exit_code = 128,
            .stdout = "",
            .stderr = "fatal: bad object\n",
            .start_error = null,
        },
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"hash\":\"" ++ commit_hash ++ "\"}",
        "Running git diff-tree failed, so the commit's changes could not be read.",
    );
}

test "the commit details task fails when its data has no hash" {
    const mock = comptime git_mock.mock_git_calls(&.{});
    try expect_task_message(mock, "{\"repoPath\":\"/repo\"}", "\"status\":\"failed\"");
}

test "the commit details task refuses an empty repo path and the backend keeps running" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .expected_shown_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try expect_task_refused(
        mock,
        "{\"repoPath\":\"\",\"hash\":\"" ++ commit_hash ++ "\"}",
        "The repo path is empty. Give the path of the repo to read.",
    );
}
