//
// Tests the Git interface function against the real `git`, the only unit tests that run it. Each
// test makes its own repo in a uniquely named directory under the project's `tmp/`, so the tests
// can run in parallel with themselves, and checks only that the function starts git with the
// arguments, reports its exit code, standard output and standard error and sends the event that
// names the command with how long it ran, and how that command is written for a shell. It checks
// git runs with the environment Ziggy gives the calling thread, or with the process's own, and that
// git reads a path after `:(literal)` as itself. It also runs the `log` wrapper's page command
// against a real repo with a merge, because only real git shows whether paging by a start commit
// and a skip count lists every commit once.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_log = @import("../lib/git-log.zig");
const test_environment = @import("test-environment.zig");

const assert = std.debug.assert;
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

//
// Writes each file with the same one line in the repo's working tree, then commits them all, with
// a fixed author so the commit runs without the user's own git config.
//
fn commit_files(directory: *const TestDirectory, file_names: []const []const u8) !void {
    assert(file_names.len > 0);

    var repo = try std.Io.Dir.cwd().openDir(io, directory.path(), .{});
    defer repo.close(io);

    for (file_names) |file_name| {
        try repo.writeFile(io, .{
            .sub_path = file_name,
            .data = "A line.\n",
        });
    }
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "add",
        "--all",
    });
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
        "--message",
        "Add the files",
    });
}

//
// Runs `git diff-tree -p` for the newest commit in the repo, limited to the path, and returns what
// git wrote, which the caller frees with `std.testing.allocator`.
//
fn read_newest_commit_diff(directory: *const TestDirectory, path: []const u8) ![]const u8 {
    assert(path.len > 0);

    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "diff-tree",
        "-r",
        "-p",
        "--root",
        "--no-commit-id",
        "HEAD",
        "--",
        path,
    });
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    return result.stdout;
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

test "start_git runs git with the environment Ziggy gives the calling thread" {
    var environment = try std.testing.environ.createMap(std.testing.allocator);
    defer environment.deinit();

    try environment.put("GIT_AUTHOR_NAME", "Ada Author");
    try environment.put("GIT_AUTHOR_EMAIL", "ada@example.com");
    ziggy.utils.process_env.setEnvironMap(&environment);
    defer ziggy.utils.process_env.setEnvironMap(null);

    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "var",
        "GIT_AUTHOR_IDENT",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expect(std.mem.startsWith(u8, result.stdout, "Ada Author <ada@example.com> "));
}

test "start_git runs git with the process's environment when the thread has none of its own" {
    try std.testing.expectEqual(
        @as(?*const std.process.Environ.Map, null),
        ziggy.utils.process_env.getEnvironMap(),
    );
    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-c",
        "alias.has-home=!test -n \"$HOME\"",
        "has-home",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
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
    });
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    return .{
        .stdout = result.stdout,
    };
}

test "run_git sends the shown command with its duration and runs git in the repo" {
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
            "\"command\":\"git log --format=%s\",\"durationMs\":",
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

test "git reads a path after :(literal) as itself" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit_files(&directory, &.{
        "foo[1].txt",
        "foo1.txt",
    });

    const literal_diff = try read_newest_commit_diff(&directory, ":(literal)foo[1].txt");
    defer std.testing.allocator.free(literal_diff);

    try std.testing.expect(std.mem.indexOf(u8, literal_diff, "b/foo[1].txt\n") != null);
    try std.testing.expect(std.mem.indexOf(u8, literal_diff, "foo1.txt") == null);

    //
    // Without `:(literal)` git reads `[1]` as a pattern that matches foo1.txt, which is why Graft
    // passes the literal path.
    //
    const pattern_diff = try read_newest_commit_diff(&directory, "foo[1].txt");
    defer std.testing.allocator.free(pattern_diff);

    try std.testing.expect(std.mem.indexOf(u8, pattern_diff, "b/foo1.txt\n") != null);

    //
    // `*` and `?` are read as themselves too, so they match neither file.
    //
    const star_diff = try read_newest_commit_diff(&directory, ":(literal)foo*.txt");
    defer std.testing.allocator.free(star_diff);

    try std.testing.expectEqualStrings("", star_diff);
    const question_diff = try read_newest_commit_diff(&directory, ":(literal)foo?.txt");
    defer std.testing.allocator.free(question_diff);

    try std.testing.expectEqualStrings("", question_diff);
}

//
// Runs `git log --format=%s` in the repo through `run_git` with the allocator and frees what git
// wrote, for the allocation failure test.
//
fn run_git_log(
    allocator: std.mem.Allocator,
    io_task: std.Io,
    services: TaskServices,
    repo_path: []const u8,
) !void {
    const result = try git_interface.run_git(io_task, services, allocator, .{
        .repo_path = repo_path,
        .args = &.{
            "log",
            "--format=%s",
        },
    });
    allocator.free(result.stdout);
    allocator.free(result.stderr);
}

//
// A task that runs `git log` through `run_git` once for each allocation it makes, failing that
// allocation, so the test checks `run_git` frees git's output when the event cannot be sent.
//
fn log_allocation_failures_task_handler(
    services: TaskServices,
    timers: Timers,
    io_task: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: LogTaskRequest,
) anyerror!LogTaskResult {
    _ = timers;
    _ = context;
    _ = allocator;
    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        run_git_log,
        .{
            io_task,
            services,
            payload.repoPath,
        },
    );
    return .{
        .stdout = "checked",
    };
}

test "run_git frees everything when an allocation fails" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");

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
            .log = log_allocation_failures_task_handler,
        },
        .menu = &.{},
        .ui_files = &.{},
    }));
    defer native_app.stop(io, std.testing.allocator);

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"log\",\"source\":\"test\",\"data\":{{\"repoPath\":\"{s}\"}}}}}}",
        .{directory.path()},
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(
        io,
        std.testing.allocator,
        "\"status\":\"succeeded\",\"outputs\":{\"stdout\":\"checked\"}",
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
            "--",
            "it's here.txt",
        },
    }, 1432);
    try std.testing.expectEqualStrings("git-command", event.type);
    try std.testing.expectEqualStrings("cd '/home/ada/my repo'", event.directoryCommand);
    try std.testing.expectEqualStrings(
        "git diff-tree abc123 -- 'it'\\''s here.txt'",
        event.command,
    );
    try std.testing.expectEqual(@as(u64, 1432), event.durationMs);
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
    }, 7);
    try std.testing.expectEqualStrings("git log", event.command);
}

test "git_command_event frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        build_quoted_git_command_event,
        .{},
    );
}

//
// Derives the shown arguments from the arguments with the allocator and checks them against the
// expected ones, freeing the list, so each test below names only the two lists.
//
fn expect_shown_args(
    allocator: std.mem.Allocator,
    args: []const []const u8,
    expected_shown_args: []const []const u8,
) !void {
    const shown = try git_interface.shown_args(allocator, args);
    defer allocator.free(shown);

    try std.testing.expectEqual(expected_shown_args.len, shown.len);
    for (expected_shown_args, shown) |expected_arg, shown_arg| {
        try std.testing.expectEqualStrings(expected_arg, shown_arg);
    }
}

test "shown_args leaves out -z" {
    try expect_shown_args(std.testing.allocator, &.{
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
    }, &.{
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
    });
}

test "shown_args leaves out a --format with separator characters" {
    try expect_shown_args(std.testing.allocator, &.{
        "log",
        "-z",
        "--max-count=50",
        "--format=%H%x1f%P%x1f%s",
    }, &.{
        "log",
        "--max-count=50",
    });
}

test "shown_args keeps a --format with no separator characters" {
    try expect_shown_args(std.testing.allocator, &.{
        "log",
        "--format=%s",
    }, &.{
        "log",
        "--format=%s",
    });
}

test "shown_args keeps every argument after --, even -z and a --format" {
    try expect_shown_args(std.testing.allocator, &.{
        "diff-tree",
        "-z",
        "abc123",
        "--",
        "-z",
        "--format=%x1f",
    }, &.{
        "diff-tree",
        "abc123",
        "--",
        "-z",
        "--format=%x1f",
    });
}

test "shown_args keeps every argument when Graft adds none to read the output" {
    try expect_shown_args(std.testing.allocator, &.{
        "add",
        "--",
        "notes.txt",
    }, &.{
        "add",
        "--",
        "notes.txt",
    });
}

test "shown_args leaves out the :(literal) in front of each path after --" {
    try expect_shown_args(std.testing.allocator, &.{
        "diff-tree",
        "-p",
        "abc123",
        "--",
        ":(literal)foo[1].txt",
        ":(literal)a*b?.txt",
    }, &.{
        "diff-tree",
        "-p",
        "abc123",
        "--",
        "foo[1].txt",
        "a*b?.txt",
    });
}

test "shown_args keeps a :(literal) before --" {
    try expect_shown_args(std.testing.allocator, &.{
        "log",
        ":(literal)main",
    }, &.{
        "log",
        ":(literal)main",
    });
}

test "shown_path leaves out :(literal) only from the start of a path" {
    try std.testing.expectEqualStrings("foo[1].txt", git_interface.shown_path(
        ":(literal)foo[1].txt",
    ));
    try std.testing.expectEqualStrings("notes.txt", git_interface.shown_path("notes.txt"));
    try std.testing.expectEqualStrings("a:(literal)b", git_interface.shown_path("a:(literal)b"));
    try std.testing.expectEqualStrings("--", git_interface.shown_path("--"));
}

//
// Derives the shown arguments of a command with a `-z` before `--` and one after it with the
// allocator, for the allocation failure test.
//
fn derive_shown_args_with_path(allocator: std.mem.Allocator) !void {
    try expect_shown_args(allocator, &.{
        "diff",
        "-z",
        "--",
        "-z",
    }, &.{
        "diff",
        "--",
        "-z",
    });
}

test "shown_args frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        derive_shown_args_with_path,
        .{},
    );
}

test "is_parser_arg picks out -z and a --format with separator characters only" {
    try std.testing.expect(git_interface.is_parser_arg("-z"));
    try std.testing.expect(git_interface.is_parser_arg("--format=%H%x1f%s"));
    try std.testing.expect(git_interface.is_parser_arg("--format=%s%x00"));
    try std.testing.expect(!git_interface.is_parser_arg("--format=%s"));
    try std.testing.expect(!git_interface.is_parser_arg("-zz"));
    try std.testing.expect(!git_interface.is_parser_arg("--max-count=1"));
    try std.testing.expect(!git_interface.is_parser_arg("%x1f"));
}

//
// Works out the milliseconds `elapsed_milliseconds` gives for an end reading the duration after
// the start reading, so each check in the test below names only the duration.
//
fn measured_milliseconds(start: std.Io.Timestamp, duration: std.Io.Duration) u64 {
    return git_interface.elapsed_milliseconds(.{
        .start = start,
        .end = start.addDuration(duration),
    });
}

test "elapsed_milliseconds gives the whole milliseconds between two readings of a clock" {
    const start = std.Io.Timestamp.fromNanoseconds(5 * std.time.ns_per_s);
    try std.testing.expectEqual(
        @as(u64, 0),
        measured_milliseconds(start, .fromNanoseconds(0)),
    );
    try std.testing.expectEqual(
        @as(u64, 0),
        measured_milliseconds(start, .fromMicroseconds(999)),
    );
    try std.testing.expectEqual(
        @as(u64, 12),
        measured_milliseconds(start, .fromMicroseconds(12_700)),
    );
    try std.testing.expectEqual(
        @as(u64, 1_400),
        measured_milliseconds(start, .fromMilliseconds(1_400)),
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

//
// The page size the paging test reads with. It is small so the test repo's few commits fill
// several pages, and a page boundary falls between the merged branch's commits and the merge.
//
const test_page_size: u32 = 2;

//
// Runs git with the arguments, with the author and commit dates set to the date through the
// environment Ziggy gives the calling thread, so a test sets the order `git log` lists the
// commits in.
//
fn run_git_at_date(date: []const u8, args: []const []const u8) !void {
    var environment = try std.testing.environ.createMap(std.testing.allocator);
    defer environment.deinit();

    try environment.put("GIT_AUTHOR_DATE", date);
    try environment.put("GIT_COMMITTER_DATE", date);
    ziggy.utils.process_env.setEnvironMap(&environment);
    defer ziggy.utils.process_env.setEnvironMap(null);

    try run_git_successfully(args);
}

//
// Makes an empty commit with the message in the repo at the date, with a fixed author so the
// commit is made the same way on every machine.
//
fn commit_at_date(directory: *const TestDirectory, message: []const u8, date: []const u8) !void {
    try run_git_at_date(date, &.{
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

//
// Reads one page of the repo's commits with the command the `log` wrapper builds for it, run by
// `start_git` against the real repo, and parses git's output. Everything is allocated with the
// arena, which the caller frees.
//
fn read_page(
    arena: std.mem.Allocator,
    directory: *const TestDirectory,
    start: ?git_log.LogPageStart,
) ![]const git_log.Commit {
    const max_count = try std.fmt.allocPrint(arena, "--max-count={d}", .{test_page_size});
    const command = try git_log.read_log_page_command(arena, .{
        .repo_path = directory.path(),
        .page_size = test_page_size,
        .start = start,
    }, max_count);
    const repo_args = [_][]const u8{
        "-C",
        command.repo_path,
    };
    const args = try std.mem.concat(arena, []const u8, &.{ &repo_args, command.args });
    const result = try git_interface.start_git(io, arena, args);
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    const commits = try git_log.parse_log_output(arena, result.stdout, test_page_size);
    try std.testing.expect(commits.len <= test_page_size);
    return commits;
}

test "every page read from the start commit lists the commits of one git log, merge included" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    // The side branch's commits are dated between the main line's, so git log mixes them in.
    try init_repo(&directory);
    try commit_at_date(&directory, "Main 1", "2026-01-01T00:00:00+00:00");
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "--create", "side" });
    try commit_at_date(&directory, "Side 1", "2026-01-02T00:00:00+00:00");
    try commit_at_date(&directory, "Side 2", "2026-01-04T00:00:00+00:00");
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "main" });
    try commit_at_date(&directory, "Main 2", "2026-01-03T00:00:00+00:00");
    try commit_at_date(&directory, "Main 3", "2026-01-05T00:00:00+00:00");
    try run_git_at_date("2026-01-06T00:00:00+00:00", &.{
        "-C",
        directory.path(),
        "-c",
        "user.name=Graft Test",
        "-c",
        "user.email=graft-test@example.com",
        "-c",
        "commit.gpgsign=false",
        "merge",
        "--quiet",
        "--no-ff",
        "--no-edit",
        "--message",
        "Merge side",
        "side",
    });

    var arena_state = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena_state.deinit();

    const arena = arena_state.allocator();
    var hashes: std.ArrayList([]const u8) = .empty;
    const first_page = try read_page(arena, &directory, null);
    try std.testing.expectEqual(@as(usize, test_page_size), first_page.len);
    for (first_page) |page_commit| {
        try hashes.append(arena, page_commit.hash);
    }
    const start_hash = first_page[0].hash;

    // A commit made on top after the first page is read does not shift the later pages.
    try commit_at_date(&directory, "Main 4", "2026-01-07T00:00:00+00:00");
    for (0..16) |_| {
        const page = try read_page(arena, &directory, .{
            .hash = start_hash,
            .skip_count = @intCast(hashes.items.len),
        });
        for (page) |page_commit| {
            try hashes.append(arena, page_commit.hash);
        }
        if (page.len < test_page_size) {
            break;
        }
    } else {
        return error.PagesNeverEnded;
    }

    const whole_log = try git_interface.start_git(io, arena, &.{
        "-C",
        directory.path(),
        "log",
        "--format=%H",
        start_hash,
    });
    try std.testing.expectEqual(@as(?u8, 0), whole_log.exit_code);
    var expected_hashes: std.ArrayList([]const u8) = .empty;
    var lines = std.mem.splitScalar(u8, std.mem.trimEnd(u8, whole_log.stdout, "\n"), '\n');
    while (lines.next()) |line| {
        try expected_hashes.append(arena, line);
    }
    try std.testing.expectEqual(@as(usize, 6), expected_hashes.items.len);
    try std.testing.expectEqual(expected_hashes.items.len, hashes.items.len);
    for (expected_hashes.items, hashes.items) |expected_hash, hash| {
        try std.testing.expectEqualStrings(expected_hash, hash);
    }
}
