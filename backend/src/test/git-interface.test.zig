//
// Tests the Git interface function against the real `git`, the only unit tests that run it. Each
// test makes its own repo in a uniquely named directory under the project's `tmp/`, so the tests
// can run in parallel with themselves, and checks only that the function starts git with the
// arguments, reports its exit code, standard output and standard error and sends the event that
// names the command, and how that command is written for a shell.
//

const std = @import("std");
const ziggy = @import("ziggy");
const error_text = @import("../lib/error-text.zig");
const git_interface = @import("../lib/git-interface.zig");
const test_environment = @import("test-environment.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// A directory of one test's own under the project's `tmp/`, deleted when the test ends.
//
const TestDirectory = struct {
    //
    // The directory's path. The tests run in `backend/`, so it starts with `../tmp/`.
    //
    path_buffer: [64]u8,

    //
    // How much of `path_buffer` the path fills.
    //
    path_length: u32,

    //
    // The directory's path.
    //
    fn path(self: *const TestDirectory) []const u8 {
        return self.path_buffer[0..self.path_length];
    }
};

//
// Makes a test directory with a random name, so no two tests share one.
//
fn make_test_directory(directory: *TestDirectory) !void {
    var random_bytes: [8]u8 = undefined;
    io.random(&random_bytes);
    const path = try std.fmt.bufPrint(&directory.path_buffer, "../tmp/git-interface-test-{s}", .{
        std.fmt.bytesToHex(random_bytes, .lower),
    });
    directory.path_length = @intCast(path.len);
    try std.Io.Dir.cwd().createDirPath(io, path);
}

//
// Deletes a test directory and everything in it.
//
fn delete_test_directory(directory: *const TestDirectory) void {
    std.Io.Dir.cwd().deleteTree(io, directory.path()) catch |err| {
        std.debug.panic("could not delete the test directory {s}: {s}", .{
            directory.path(),
            @errorName(err),
        });
    };
}

//
// Runs git with `start_git`, frees what it wrote and fails the test when it
// did not exit with 0.
//
fn run_git_successfully(args: []const []const u8) !void {
    const result = try git_interface.start_git(io, std.testing.allocator, args);
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    if (result.exit_code != 0) {
        std.debug.print("git failed: {s}\n", .{result.stderr});
    }
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
}

//
// Makes an empty repo in the test directory.
//
fn init_repo(directory: *const TestDirectory) !void {
    try run_git_successfully(&.{
        "init",
        "--quiet",
        "--initial-branch=main",
        directory.path(),
    });
}

//
// Makes an empty commit with the message in the repo, with a fixed author so the user's own
// git config is not needed.
//
fn commit(directory: *const TestDirectory, message: []const u8) !void {
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "-c",
        "user.name=Graft Test",
        "-c",
        "user.email=graft-test@example.com",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--quiet",
        "--allow-empty",
        "--message",
        message,
    });
}

test "start_git reports what git wrote to its standard output and exit code 0" {
    const result = try git_interface.start_git(io, std.testing.allocator, &.{"--version"});
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expect(std.mem.startsWith(u8, result.stdout, "git version "));
    try std.testing.expectEqualStrings("", result.stderr);
}

test "start_git runs git in a repo with the arguments it is given" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "log",
        "--format=%s",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expectEqualStrings("The second commit\nThe first commit\n", result.stdout);
    try std.testing.expectEqualStrings("", result.stderr);
}

test "start_git reports git's error exit code and standard error without failing" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "log",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 128), result.exit_code);
    try std.testing.expectEqualStrings("", result.stdout);
    try std.testing.expect(result.stderr.len > 0);
}

//
// Runs `git --version` and frees what it wrote, for the allocation failure test.
//
fn run_git_version(allocator: std.mem.Allocator) !void {
    const result = try git_interface.start_git(io, allocator, &.{"--version"});
    allocator.free(result.stdout);
    allocator.free(result.stderr);
}

test "start_git frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, run_git_version, .{});
}

//
// The data the test's task is queued with: the repo to run git in.
//
const LogTaskRequest = struct {
    //
    // The path of the repo.
    //
    repoPath: []const u8,
};

//
// The result of the test's task: what git wrote to its standard output.
//
const LogTaskResult = struct {
    //
    // What git wrote to its standard output.
    //
    stdout: []const u8,
};

//
// A task that runs `git log --format=%s` in the repo through `run_git`, as a wrapper's task does,
// so the test sees the event `run_git` sends and git's output.
//
fn log_task_handler(
    services: TaskServices,
    timers: Timers,
    io_task: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: LogTaskRequest,
) anyerror!LogTaskResult {
    _ = timers;
    _ = context;
    const result = try git_interface.run_git(io_task, services, allocator, .{
        .repo_path = payload.repoPath,
        .args = &.{
            "log",
            "--format=%s",
        },
        .shown_args = &.{
            "log",
            "--format=%s",
        },
    });
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    return .{
        .stdout = result.stdout,
    };
}

test "run_git sends the command as the help panel shows it and runs git in the repo" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");

    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .log = log_task_handler,
        },
        .menu = &.{},
        .ui_files = &.{},
        .describe_error = error_text.describe_error,
    }));
    defer native_app.stop(io, std.testing.allocator);

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"log\",\"source\":\"test\",\"data\":{{\"repoPath\":\"{s}\"}}}}}}",
        .{directory.path()},
    );
    defer std.testing.allocator.free(message);

    const expected_event = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"type\":\"git-command\",\"directoryCommand\":\"cd {s}\"," ++
            "\"command\":\"git log --format=%s\"}}",
        .{directory.path()},
    );
    defer std.testing.allocator.free(expected_event);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_event);
    try native_app.expectMessageContaining(
        io,
        std.testing.allocator,
        "\"status\":\"succeeded\",\"outputs\":{\"stdout\":" ++
            "\"The second commit\\nThe first commit\\n\"}",
    );
}

test "git_command_event writes the cd into the repo and the shown command for a shell" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const event = try git_interface.git_command_event(arena.allocator(), .{
        .repo_path = "/home/ada/my repo",
        .args = &.{
            "diff-tree",
            "-z",
            "abc123",
        },
        .shown_args = &.{
            "diff-tree",
            "abc123",
            "--",
            "it's here.txt",
        },
    });
    try std.testing.expectEqualStrings("git-command", event.type);
    try std.testing.expectEqualStrings("cd '/home/ada/my repo'", event.directoryCommand);
    try std.testing.expectEqualStrings(
        "git diff-tree abc123 -- 'it'\\''s here.txt'",
        event.command,
    );
}

//
// Builds the event for a command whose repo path needs quoting in an arena on the allocator and
// frees the arena, for the allocation failure test.
//
fn build_quoted_git_command_event(allocator: std.mem.Allocator) !void {
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const event = try git_interface.git_command_event(arena.allocator(), .{
        .repo_path = "/a b/it's",
        .args = &.{
            "log",
            "-z",
        },
        .shown_args = &.{
            "log",
        },
    });
    try std.testing.expectEqualStrings("git log", event.command);
}

test "git_command_event frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        build_quoted_git_command_event,
        .{},
    );
}

test "format_command_line leaves plain words as they are and quotes the rest" {
    const line = try git_interface.format_command_line(std.testing.allocator, &.{
        "git",
        "log",
        "--max-count=50",
        "",
        "a b",
        "$HOME",
        "x;y",
        "don't",
    });
    defer std.testing.allocator.free(line);

    try std.testing.expectEqualStrings(
        "git log --max-count=50 '' 'a b' '$HOME' 'x;y' 'don'\\''t'",
        line,
    );
}

test "format_command_line writes one word without a space" {
    const line = try git_interface.format_command_line(std.testing.allocator, &.{"git"});
    defer std.testing.allocator.free(line);

    try std.testing.expectEqualStrings("git", line);
}

//
// Formats a command line with a word that needs quoting with the allocator and frees it, for the
// allocation failure test.
//
fn format_quoted_command_line(allocator: std.mem.Allocator) !void {
    const line = try git_interface.format_command_line(allocator, &.{
        "cd",
        "/a b/it's",
        "plain",
    });
    allocator.free(line);
}

test "format_command_line frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        format_quoted_command_line,
        .{},
    );
}

test "is_plain_shell_word accepts only words a shell reads as they are" {
    try std.testing.expect(git_interface.is_plain_shell_word("--max-count=50"));
    try std.testing.expect(git_interface.is_plain_shell_word("/tmp/graft/test-repo"));
    try std.testing.expect(git_interface.is_plain_shell_word("--format=%s"));
    try std.testing.expect(git_interface.is_plain_shell_word("a,b:c+d@e_f"));
    try std.testing.expect(!git_interface.is_plain_shell_word(""));
    try std.testing.expect(!git_interface.is_plain_shell_word("a b"));
    try std.testing.expect(!git_interface.is_plain_shell_word("it's"));
    try std.testing.expect(!git_interface.is_plain_shell_word("$HOME"));
    try std.testing.expect(!git_interface.is_plain_shell_word("a*"));
    try std.testing.expect(!git_interface.is_plain_shell_word("~/repo"));
}
