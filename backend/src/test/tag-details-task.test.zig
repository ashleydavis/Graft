//
// Tests the tag details task the way the frontend runs it: each test starts a backend with Ziggy's
// fake native app, registering the tag details task made with a mock of the Git interface
// function, queues the task as the frontend does and checks how it ends: the tag's details for a
// listed tag, and a refusal without reading the tag for a name git did not list.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");
const tag_details_task = @import("../lib/tag-details-task.zig");
const test_environment = @import("test-environment.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// The hash of the commit the tag points at.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// The `git for-each-ref` call the task makes for the tag names of the repo at /repo, which lists
// the one tag v1.0.
//
const names_call: git_mock.MockGitOptions = .{
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
    .exit_code = 0,
    .stdout = "v1.0\n",
    .stderr = "",
    .start_error = null,
};

//
// The `git for-each-ref` call the task makes for the details of the lightweight tag v1.0.
//
const tag_call: git_mock.MockGitOptions = .{
    .expected_args = &.{
        "-C",
        "/repo",
        "for-each-ref",
        "--format=%(refname:strip=2)%1f%(objecttype)%1f%(objectname)%1f" ++
            "%(*objectname)%1f%(subject)%1f%(*subject)%1f" ++
            "%(taggername)%1f%(taggeremail:trim)%1f%(taggerdate:iso-strict)%1f" ++
            "%(contents:body)%00",
        "refs/tags/v1.0",
    },
    .expected_shown_args = &.{
        "for-each-ref",
        "refs/tags/v1.0",
    },
    .exit_code = 0,
    .stdout = "v1.0\x1fcommit\x1f" ++ commit_hash ++ "\x1f\x1fAdd the notes\x1f\x1f\x1f\x1f\x1f" ++
        "\x00\n",
    .stderr = "",
    .start_error = null,
};

//
// Declares a backend whose only task is the tag details task, run with the Git interface
// function.
//
fn declare_app(comptime run_git: git_interface.RunGit) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"tag-details" = tag_details_task.tag_details_task_handler(run_git),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app, queues the tag details task with the data and waits for the
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
            "\"taskType\":\"tag-details\",\"source\":\"repo-explorer-page\",\"data\":{s}}}}}",
        .{data_json},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the tag details task gives a listed lightweight tag's commit, with no annotation field" {
    const mock = comptime git_mock.mock_git_calls(&.{
        names_call,
        tag_call,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"name\":\"v1.0\"}",
        "\"status\":\"succeeded\",\"outputs\":{\"name\":\"v1.0\",\"commitHash\":\"" ++
            commit_hash ++ "\",\"commitTitle\":\"Add the notes\"}",
    );
}

test "the tag details task refuses a name git did not list without reading it" {
    const mock = comptime git_mock.mock_git_calls(&.{
        names_call,
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"name\":\"--all\"}",
        "That tag is not one of the repo's tags, so its details could not be read.",
    );
}

test "the tag details task fails with a description of the error when listing the tags fails" {
    const mock = comptime git_mock.mock_git_calls(&.{
        .{
            .expected_args = names_call.expected_args,
            .expected_shown_args = names_call.expected_shown_args,
            .exit_code = 128,
            .stdout = "",
            .stderr = "fatal: not a git repository\n",
            .start_error = null,
        },
    });
    try expect_task_message(
        mock,
        "{\"repoPath\":\"/repo\",\"name\":\"v1.0\"}",
        "Running git for-each-ref failed, so the repo's tags could not be read.",
    );
}

test "the tag details task fails when its data has no name" {
    const mock = comptime git_mock.mock_git_calls(&.{});
    try expect_task_message(mock, "{\"repoPath\":\"/repo\"}", "\"status\":\"failed\"");
}
