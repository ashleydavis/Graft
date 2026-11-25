//
// Tests the Git interface function against the real `git`, the only unit tests that run it. Each
// test makes its own repo in a uniquely named directory under the project's `tmp/`, so the tests
// can run in parallel with themselves, and checks only that the function starts git with the
// arguments, reports its exit code, standard output and standard error and sends the event that
// names the command with how long it ran, and how that command is written for a shell. It checks
// git runs with the environment Ziggy gives the calling thread, or with the process's own, and that
// git reads a path after `:(literal)` as itself. It also runs the `log` wrapper's page command
// against a real repo with a merge, a branch of its own, a remote-tracking branch, a detached HEAD
// and a stash, because only real git shows whether paging every branch and HEAD by a skip count
// lists every commit once and leaves the stash out, and checks the `git log` commands the `log`
// wrapper builds give output its parser reads when the repo has `log.showSignature` set and a
// signed commit. It checks git reads a hash the `log` wrapper puts before `--` as a commit when a
// file has the same name, that HEAD before `--` is read as a commit when a file is named HEAD,
// that a branch with the same name as a short hash still wins over the commit and that a full
// hash is read as a commit even when a branch has its name. It checks git reads a
// hash the `diff-tree` wrapper puts before `--` as a commit when a file has the hash as its name,
// and that without the `--` git refuses the hash as ambiguous. It runs the `branch` wrapper's
// command against real repos, because only real git shows how it writes each branch and the
// checked-out one, and checks the `log` wrapper's command for a branch's page lists only the
// branch's commits when a tag has the branch's name.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_branch = @import("../lib/git-branch.zig");
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

//
// The length of a full commit hash, which `git rev-parse` writes.
//
const full_hash_length = 40;

//
// The length of the short hash the tests use, which is git's default abbreviation.
//
const short_hash_length = 7;

comptime {
    std.debug.assert(short_hash_length < full_hash_length);
}

//
// Reads the full hash of the commit the revision names in the test repo into the buffer.
//
fn read_commit_hash(
    directory: *const TestDirectory,
    revision: []const u8,
    hash: *[full_hash_length]u8,
) !void {
    std.debug.assert(revision.len > 0);

    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "rev-parse",
        revision,
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expectEqual(@as(usize, full_hash_length + 1), result.stdout.len);
    @memcpy(hash, result.stdout[0..full_hash_length]);
}

//
// Writes an empty file with the name into the test repo's working tree.
//
fn write_empty_file(directory: *const TestDirectory, name: []const u8) !void {
    std.debug.assert(name.len > 0);

    var path_buffer: [128]u8 = undefined;
    const path = try std.fmt.bufPrint(&path_buffer, "{s}/{s}", .{
        directory.path(),
        name,
    });
    std.debug.assert(path.len > directory.path().len);
    try std.Io.Dir.cwd().writeFile(io, .{
        .sub_path = path,
        .data = "",
        .flags = .{},
    });
}

//
// Runs `git log` in the test repo with the revision arguments the `log` wrapper builds, followed
// by `--`, and checks git lists only the commit the expected hash names.
//
fn expect_log_lists_only(
    directory: *const TestDirectory,
    revision_args: []const []const u8,
    expected_hash: []const u8,
) !void {
    std.debug.assert(revision_args.len > 0);
    std.debug.assert(expected_hash.len == full_hash_length);

    var args_buffer: [16][]const u8 = undefined;
    const fixed_args = [_][]const u8{
        "-C",
        directory.path(),
        "log",
        "-z",
        "--max-count=1",
        "--format=%H",
    };
    const arg_count = fixed_args.len + revision_args.len + 1;
    std.debug.assert(arg_count <= args_buffer.len);
    @memcpy(args_buffer[0..fixed_args.len], &fixed_args);
    @memcpy(args_buffer[fixed_args.len .. arg_count - 1], revision_args);
    args_buffer[arg_count - 1] = "--";

    const args = args_buffer[0..arg_count];
    const result = try git_interface.start_git(io, std.testing.allocator, args);
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expectEqualStrings(expected_hash, std.mem.trimEnd(u8, result.stdout, "\x00"));
}

test "git log with -- after a short hash reads that commit when a file has the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    var first_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD~1", &first_hash);
    const short_hash = first_hash[0..short_hash_length];
    try write_empty_file(&directory, short_hash);

    try expect_log_lists_only(&directory, &.{short_hash}, &first_hash);
}

test "git log with -- after a full hash reads that commit when a file has the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    var first_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD~1", &first_hash);
    try write_empty_file(&directory, &first_hash);

    try expect_log_lists_only(&directory, &.{&first_hash}, &first_hash);
}

test "git log with -- after --skip=1 and every branch reads the next page with a file named HEAD" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    var first_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD~1", &first_hash);
    try write_empty_file(&directory, "HEAD");

    try expect_log_lists_only(
        &directory,
        &.{ "--skip=1", "--branches", "--remotes", "HEAD" },
        &first_hash,
    );
}

test "git log with -- after a short hash still reads a branch with the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    var first_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD~1", &first_hash);
    var second_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD", &second_hash);
    const short_hash = first_hash[0..short_hash_length];
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "branch",
        short_hash,
        "HEAD",
    });

    try expect_log_lists_only(&directory, &.{short_hash}, &second_hash);
    try expect_log_lists_only(&directory, &.{&first_hash}, &first_hash);
}

test "git log with -- after a full hash reads that commit when a branch has the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    var first_hash: [full_hash_length]u8 = undefined;
    try read_commit_hash(&directory, "HEAD~1", &first_hash);
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "branch",
        &first_hash,
        "HEAD",
    });

    try expect_log_lists_only(&directory, &.{&first_hash}, &first_hash);
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
// several pages, and page boundaries fall between the branches' commits.
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

//
// Makes an empty commit with the message at the date on a new branch with the name, then switches
// back to main.
//
fn commit_on_branch_at_date(
    directory: *const TestDirectory,
    branch: []const u8,
    message: []const u8,
    date: []const u8,
) !void {
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "--create", branch });
    try commit_at_date(directory, message, date);
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "main" });
}

//
// Makes the paging test's repo: a main line with a merged side branch, a branch "other" with
// commits only it reaches, a remote-tracking branch "origin/feature" with a commit only it
// reaches, a branch "empty" pointing at a commit on main, a detached HEAD with a commit only HEAD
// reaches, a stash and an untracked file named HEAD. Each commit has its own date, so git log
// lists them in the order of their dates.
//
fn make_branches_repo(directory: *const TestDirectory) !void {
    // The side branch's commits are dated between the main line's, so git log mixes them in.
    try init_repo(directory);
    try commit_at_date(directory, "Main 1", "2026-01-01T00:00:00+00:00");
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "--create", "side" });
    try commit_at_date(directory, "Side 1", "2026-01-02T00:00:00+00:00");
    try commit_at_date(directory, "Side 2", "2026-01-04T00:00:00+00:00");
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "main" });
    try commit_at_date(directory, "Main 2", "2026-01-03T00:00:00+00:00");
    try commit_at_date(directory, "Main 3", "2026-01-05T00:00:00+00:00");
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

    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "switch",
        "--quiet",
        "--create",
        "other",
    });
    try commit_at_date(directory, "Other 1", "2026-01-07T00:00:00+00:00");
    try commit_at_date(directory, "Other 2", "2026-01-08T00:00:00+00:00");
    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "main" });

    try commit_on_branch_at_date(directory, "feature", "Feature 1", "2026-01-09T00:00:00+00:00");
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "update-ref",
        "refs/remotes/origin/feature",
        "feature",
    });
    try run_git_successfully(&.{ "-C", directory.path(), "branch", "--quiet", "-D", "feature" });
    try run_git_successfully(&.{ "-C", directory.path(), "branch", "empty", "main~1" });

    try run_git_successfully(&.{ "-C", directory.path(), "switch", "--quiet", "--detach", "main" });
    try commit_at_date(directory, "Detached 1", "2026-01-10T00:00:00+00:00");

    try write_repo_file(directory, "notes.txt", "A note to stash.\n");
    try run_git_successfully(&.{ "-C", directory.path(), "add", "notes.txt" });
    try run_git_at_date("2026-01-11T00:00:00+00:00", &.{
        "-C",
        directory.path(),
        "-c",
        "user.name=Graft Test",
        "-c",
        "user.email=graft-test@example.com",
        "-c",
        "commit.gpgsign=false",
        "stash",
        "--quiet",
    });
    try write_empty_file(directory, "HEAD");
}

test "every page read from every branch and HEAD lists each of their commits once, stash left out" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try make_branches_repo(&directory);

    var arena_state = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena_state.deinit();

    const arena = arena_state.allocator();
    var titles: std.ArrayList([]const u8) = .empty;
    var hashes: std.ArrayList([]const u8) = .empty;
    var start: ?git_log.LogPageStart = null;
    for (0..16) |_| {
        const page = try read_page(arena, &directory, start);
        for (page) |page_commit| {
            try titles.append(arena, page_commit.title);
            try hashes.append(arena, page_commit.hash);
        }
        if (page.len < test_page_size) {
            break;
        }
        start = .{
            .skip_count = @intCast(hashes.items.len),
        };
    } else {
        return error.PagesNeverEnded;
    }

    const expected_titles = [_][]const u8{
        "Detached 1",
        "Feature 1",
        "Other 2",
        "Other 1",
        "Merge side",
        "Main 3",
        "Side 2",
        "Main 2",
        "Side 1",
        "Main 1",
    };
    try std.testing.expectEqual(expected_titles.len, titles.items.len);
    for (expected_titles, titles.items) |expected_title, title| {
        try std.testing.expectEqualStrings(expected_title, title);
    }

    const whole_log = try git_interface.start_git(io, arena, &.{
        "-C",
        directory.path(),
        "log",
        "--format=%H",
        "--branches",
        "--remotes",
        "HEAD",
        "--",
    });
    try std.testing.expectEqual(@as(?u8, 0), whole_log.exit_code);
    var expected_hashes: std.ArrayList([]const u8) = .empty;
    var lines = std.mem.splitScalar(u8, std.mem.trimEnd(u8, whole_log.stdout, "\n"), '\n');
    while (lines.next()) |line| {
        try expected_hashes.append(arena, line);
    }
    try std.testing.expectEqual(expected_hashes.items.len, hashes.items.len);
    for (expected_hashes.items, hashes.items) |expected_hash, hash| {
        try std.testing.expectEqualStrings(expected_hash, hash);
    }
}

// Makes an SSH key with no passphrase at `.git/signing-key` in the test's repo, so a commit can be
// signed without GPG on the machine and without a key outside the test directory.
//
fn make_signing_key(directory: *const TestDirectory) !void {
    const key_path = try std.fmt.allocPrint(
        std.testing.allocator,
        "{s}/.git/signing-key",
        .{directory.path()},
    );
    defer std.testing.allocator.free(key_path);

    const result = try std.process.run(std.testing.allocator, io, .{
        .argv = &.{
            "ssh-keygen",
            "-q",
            "-t",
            "ed25519",
            "-N",
            "",
            "-C",
            "graft-test",
            "-f",
            key_path,
        },
        .stdout_limit = .unlimited,
        .stderr_limit = .unlimited,
        .cwd = .inherit,
        .environ_map = null,
        .create_no_window = true,
        .timeout = .none,
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    if (result.term != .exited) {
        std.debug.print("ssh-keygen did not exit: {s}\n", .{result.stderr});
    }
    try std.testing.expect(result.term == .exited);
    try std.testing.expectEqual(@as(u8, 0), result.term.exited);
}

//
// Makes an empty commit with the message in the repo, signed with the SSH key
// `make_signing_key` made, then sets `log.showSignature=true` in the repo's config, as a user who
// signs their commits might have it.
//
fn commit_signed_with_show_signature(directory: *const TestDirectory, message: []const u8) !void {
    try make_signing_key(directory);
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "-c",
        "user.name=Graft Test",
        "-c",
        "user.email=graft-test@example.com",
        "-c",
        "gpg.format=ssh",
        "-c",
        "user.signingkey=.git/signing-key",
        "commit",
        "--quiet",
        "--allow-empty",
        "--gpg-sign",
        "--message",
        message,
    });
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "config",
        "log.showSignature",
        "true",
    });
}

//
// Runs the command the `log` wrapper built with `start_git`, the way `run_git` starts it, and
// checks git exits with 0 and its output parses into the one commit the repo holds.
//
fn expect_log_command_parses(
    directory: *const TestDirectory,
    command: git_interface.GitCommand,
    title: []const u8,
) !void {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const argv = try arena.allocator().alloc([]const u8, command.args.len + 2);
    argv[0] = "-C";
    argv[1] = directory.path();
    @memcpy(argv[2..], command.args);
    const result = try git_interface.start_git(io, arena.allocator(), argv);
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);

    const commits = try git_log.parse_log_output(arena.allocator(), result.stdout, 50);
    try std.testing.expectEqual(@as(usize, 1), commits.len);
    try std.testing.expectEqualStrings(title, commits[0].title);
}

//
// Checks the `log` wrapper's commands work with real git when the repo signs its commits and has
// `log.showSignature` set, by making a signed commit in a temporary repo, running the page command
// and the one commit command the wrapper builds and parsing what each writes.
//
test "the log wrapper's commands read a signed commit when log.showSignature is set" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit_signed_with_show_signature(&directory, "A signed commit");

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const signed = try git_interface.start_git(io, arena.allocator(), &.{
        "-C",
        directory.path(),
        "cat-file",
        "commit",
        "HEAD",
    });
    try std.testing.expect(std.mem.indexOf(u8, signed.stdout, "gpgsig") != null);

    const head = try git_interface.start_git(io, arena.allocator(), &.{
        "-C",
        directory.path(),
        "rev-parse",
        "HEAD",
    });
    const head_hash = std.mem.trimEnd(u8, head.stdout, "\n");

    try expect_log_command_parses(
        &directory,
        try git_log.read_log_page_command(
            arena.allocator(),
            .{
                .repo_path = directory.path(),
                .page_size = 50,
                .start = null,
            },
            "--max-count=50",
        ),
        "A signed commit",
    );
    try expect_log_command_parses(
        &directory,
        try git_log.read_commit_command(arena.allocator(), .{
            .repo_path = directory.path(),
            .hash = head_hash,
        }),
        "A signed commit",
    );
}

//
// The length of a full SHA-1 commit hash in hexadecimal, as `git rev-parse HEAD` writes it, which
// the `git diff-tree` tests below read and name a file after.
//
const diff_tree_hash_length = std.crypto.hash.Sha1.digest_length * 2;

comptime {
    std.debug.assert(diff_tree_hash_length == 40);
}

//
// Writes the text to the file with the name in the test repo's working tree, so a test can commit
// it or leave it untracked beside the commits.
//
fn write_repo_file(directory: *const TestDirectory, name: []const u8, data: []const u8) !void {
    std.debug.assert(name.len > 0);

    var path_buffer: [128]u8 = undefined;
    const path = try std.fmt.bufPrint(&path_buffer, "{s}/{s}", .{
        directory.path(),
        name,
    });
    std.debug.assert(path.len > directory.path().len);
    try std.Io.Dir.cwd().writeFile(io, .{
        .sub_path = path,
        .data = data,
        .flags = .{},
    });
}

//
// Makes a test repo whose one commit adds notes.txt with one line, and an untracked empty file
// named after that commit's full hash, and reads the hash into `hash`, so the `git diff-tree` tests
// read a commit whose hash is also a file's name.
//
fn make_repo_with_hash_named_file(
    directory: *const TestDirectory,
    hash: *[diff_tree_hash_length]u8,
) !void {
    try init_repo(directory);
    try write_repo_file(directory, "notes.txt", "The first note.\n");
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "add",
        "--",
        "notes.txt",
    });
    try commit(directory, "Add the notes");

    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "rev-parse",
        "HEAD",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expectEqual(@as(usize, diff_tree_hash_length + 1), result.stdout.len);
    @memcpy(hash, result.stdout[0..diff_tree_hash_length]);
    try write_repo_file(directory, hash, "");
}

//
// The arguments of a `git diff-tree` for a commit's changed files in a test. An options struct,
// because the list argument and the hash are both strings a call could swap.
//
const ChangedFilesDiffTreeOptions = struct {
    //
    // `--name-status` or `--numstat`, the list the `diff-tree` wrapper asks git for.
    //
    list_arg: []const u8,

    //
    // The commit's full hash, which is also the name of a file in the test repo.
    //
    hash: []const u8,

    //
    // Whether `--` follows the hash, as the `diff-tree` wrapper puts it, so a test can show git
    // refusing the hash without it.
    //
    ends_with_separator: bool,
};

//
// Runs `git diff-tree` in the test repo with the arguments the `diff-tree` wrapper builds for a
// commit's changed files, with the list argument, the hash and the `--` the options give, and
// returns git's result. The caller frees its output.
//
fn run_changed_files_diff_tree(
    directory: *const TestDirectory,
    options: ChangedFilesDiffTreeOptions,
) !git_interface.GitResult {
    std.debug.assert(options.list_arg.len > 0);
    std.debug.assert(options.hash.len == diff_tree_hash_length);

    const args = [_][]const u8{
        "-C",
        directory.path(),
        "diff-tree",
        "-r",
        "-z",
        "--root",
        "--no-commit-id",
        options.list_arg,
        options.hash,
        "--",
    };
    if (options.ends_with_separator) {
        return git_interface.start_git(io, std.testing.allocator, &args);
    } else {
        return git_interface.start_git(io, std.testing.allocator, args[0 .. args.len - 1]);
    }
}

test "git diff-tree with -- after a hash lists its changed files when a file has its name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    var hash: [diff_tree_hash_length]u8 = undefined;
    try make_repo_with_hash_named_file(&directory, &hash);

    const name_status = try run_changed_files_diff_tree(&directory, .{
        .list_arg = "--name-status",
        .hash = &hash,
        .ends_with_separator = true,
    });
    defer std.testing.allocator.free(name_status.stdout);
    defer std.testing.allocator.free(name_status.stderr);

    try std.testing.expectEqual(@as(?u8, 0), name_status.exit_code);
    try std.testing.expectEqualStrings("A\x00notes.txt\x00", name_status.stdout);

    const numstat = try run_changed_files_diff_tree(&directory, .{
        .list_arg = "--numstat",
        .hash = &hash,
        .ends_with_separator = true,
    });
    defer std.testing.allocator.free(numstat.stdout);
    defer std.testing.allocator.free(numstat.stderr);

    try std.testing.expectEqual(@as(?u8, 0), numstat.exit_code);
    try std.testing.expectEqualStrings("1\t0\tnotes.txt\x00", numstat.stdout);
}

test "git diff-tree without -- after the hash fails when a file has the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    var hash: [diff_tree_hash_length]u8 = undefined;
    try make_repo_with_hash_named_file(&directory, &hash);

    const result = try run_changed_files_diff_tree(&directory, .{
        .list_arg = "--name-status",
        .hash = &hash,
        .ends_with_separator = false,
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 128), result.exit_code);
    try std.testing.expectEqualStrings("", result.stdout);
    try std.testing.expect(std.mem.indexOf(u8, result.stderr, "ambiguous argument") != null);
}

test "git diff-tree with -- after a hash reads a file's diff when a file has the hash's name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    var hash: [diff_tree_hash_length]u8 = undefined;
    try make_repo_with_hash_named_file(&directory, &hash);

    const result = try git_interface.start_git(io, std.testing.allocator, &.{
        "-C",
        directory.path(),
        "diff-tree",
        "-r",
        "-p",
        "--root",
        "--no-commit-id",
        &hash,
        "--",
        "notes.txt",
    });
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expect(std.mem.indexOf(u8, result.stdout, "+The first note.\n") != null);
}

//
// Runs the `branch` wrapper's command in the test repo and parses what git writes, in the arena.
//
fn read_test_repo_branches(
    arena: std.mem.Allocator,
    directory: *const TestDirectory,
) ![]const git_branch.Branch {
    const args = try std.mem.concat(arena, []const u8, &.{
        &.{
            "-C",
            directory.path(),
        },
        git_branch.read_branches_args,
    });
    const result = try git_interface.start_git(io, arena, args);
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    return git_branch.parse_branch_output(arena, result.stdout);
}

test "the branch wrapper's command lists each local branch and marks the checked-out one" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "branch",
        "feature/x",
    });

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const branches = try read_test_repo_branches(arena.allocator(), &directory);
    try std.testing.expectEqual(@as(usize, 2), branches.len);
    try std.testing.expectEqualStrings("feature/x", branches[0].name);
    try std.testing.expect(!branches[0].isCheckedOut);
    try std.testing.expectEqualStrings("main", branches[1].name);
    try std.testing.expect(branches[1].isCheckedOut);
}

test "the branch wrapper's command lists no branch in a repo with no commits" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const branches = try read_test_repo_branches(arena.allocator(), &directory);
    try std.testing.expectEqual(@as(usize, 0), branches.len);
}

test "the log wrapper's branch page lists only the branch's commits when a tag has its name" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "branch",
        "feature/x",
    });
    try commit(&directory, "The second commit");
    try run_git_successfully(&.{
        "-C",
        directory.path(),
        "tag",
        "feature/x",
    });

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const command = try git_log.read_log_page_command(
        arena.allocator(),
        .{
            .repo_path = directory.path(),
            .page_size = 50,
            .start = null,
            .branch = "feature/x",
        },
        "--max-count=50",
    );
    const args = try std.mem.concat(arena.allocator(), []const u8, &.{
        &.{
            "-C",
            directory.path(),
        },
        command.args,
    });
    const result = try git_interface.start_git(io, arena.allocator(), args);
    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);

    const commits = try git_log.parse_log_output(arena.allocator(), result.stdout, 50);
    try std.testing.expectEqual(@as(usize, 1), commits.len);
    try std.testing.expectEqualStrings("The first commit", commits[0].title);
}
