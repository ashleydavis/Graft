//
// The mocks of the Git interface function, for unit testing the `log` wrapper and every other Git
// abstraction without running `git`.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");

const RunningTask = ziggy.task_runner.RunningTask;
const TaskServices = ziggy.task_runner.TaskServices;

//
// Makes the running task a unit test of a wrapper gives its task services, which keeps the text a
// wrapper sets with fail_with, so the test can check the text the frontend would be sent. The
// mocks send no event and queue no child, so nothing reads the worker, which is left undefined
// because a worker exists only inside a pool.
//
pub fn mock_task() RunningTask {
    const task: RunningTask = .{
        .worker = undefined,
        .task_id = "mock-task",
        .task_source = "mock-source",
        .cancelled = false,
        .children = .empty,
        .inflight_children = 0,
        .next_child = 0,
        .failure = null,
    };
    std.debug.assert(task.failure == null);
    return task;
}

//
// Gives the task services a unit test of a wrapper passes, for the wrappers that run a mock in
// place of the Git interface function, over the test's own task from mock_task. The wrappers write
// to the log when git fails, so it is a real one that writes to the console.
//
pub fn mock_services(task: *RunningTask) TaskServices {
    std.debug.assert(task.failure == null);
    return .{
        .task = task,
        .log = ziggy.log.ConsoleLog.init(),
    };
}

//
// What a mock of the Git interface function expects and answers.
//
pub const MockGitOptions = struct {
    //
    // The arguments the code under test must start git with, starting with `-C <repo>`. Any other
    // arguments fail the call with error.UnexpectedGitArguments, so a test fails when the code
    // builds the wrong command.
    //
    expected_args: []const []const u8,

    //
    // The arguments after `git` the help panel must show, as `shown_args` in the Git interface
    // derives them from the arguments git is started with. Any others fail the call with
    // error.UnexpectedGitArguments, so a test fails when the panel would show the wrong command.
    //
    expected_shown_args: []const []const u8,

    //
    // The exit code the mock reports, or null for a git that ended without exiting.
    //
    exit_code: ?u8,

    //
    // What the mock reports git wrote to its standard output.
    //
    stdout: []const u8,

    //
    // What the mock reports git wrote to its standard error.
    //
    stderr: []const u8,

    //
    // The error the mock fails with in place of an answer, as the real function does when git
    // cannot be started, or null to answer.
    //
    start_error: ?anyerror,
};

//
// Makes a mock of the Git interface function that checks it was given the expected arguments and
// answers as the options say. The options are fixed when the mock is made, so the mock keeps no
// state and can run on any thread, as a task does. What it answers is allocated with the
// allocator it is given, as the real function's answer is.
//
pub fn mock_git(comptime options: MockGitOptions) git_interface.RunGit {
    return struct {
        //
        // Answers one call as the options say.
        //
        fn mock_git_run(
            io: std.Io,
            services: TaskServices,
            allocator: std.mem.Allocator,
            command: git_interface.GitCommand,
        ) anyerror!git_interface.GitResult {
            _ = io;
            _ = services;
            if (options.start_error) |err| {
                return err;
            }
            if (!is_same_command(command, options.expected_args)) {
                std.debug.print("git was started with arguments the test does not expect\n", .{});
                return error.UnexpectedGitArguments;
            }

            const shown_args = try git_interface.shown_args(std.testing.allocator, command.args);
            defer std.testing.allocator.free(shown_args);

            if (!is_same_args(shown_args, options.expected_shown_args)) {
                std.debug.print("the help panel would show a command no test expects\n", .{});
                return error.UnexpectedGitArguments;
            }

            const stdout = try allocator.dupe(u8, options.stdout);
            errdefer allocator.free(stdout);

            return .{
                .exit_code = options.exit_code,
                .stdout = stdout,
                .stderr = try allocator.dupe(u8, options.stderr),
            };
        }
    }.mock_git_run;
}

//
// Makes a mock of the Git interface function for code that starts git more than once: each call
// is answered as the options whose expected arguments it matches say and a call that matches none
// fails with error.UnexpectedGitArguments. Like `mock_git`, it keeps no state.
//
pub fn mock_git_calls(comptime calls: []const MockGitOptions) git_interface.RunGit {
    return struct {
        //
        // Answers one call as the options it matches say.
        //
        fn mock_git_calls_run(
            io: std.Io,
            services: TaskServices,
            allocator: std.mem.Allocator,
            command: git_interface.GitCommand,
        ) anyerror!git_interface.GitResult {
            inline for (calls) |call| {
                if (is_same_command(command, call.expected_args)) {
                    return mock_git(call)(io, services, allocator, command);
                }
            }
            std.debug.print("git was started with {d} arguments that no call expects\n", .{
                command.args.len,
            });
            return error.UnexpectedGitArguments;
        }
    }.mock_git_calls_run;
}

//
// Whether the command starts git with the expected arguments: `-C`, the command's repo, then its
// arguments, in the same order.
//
fn is_same_command(command: git_interface.GitCommand, expected_args: []const []const u8) bool {
    if (expected_args.len != command.args.len + 2) {
        return false;
    }
    if (!std.mem.eql(u8, expected_args[0], "-C")) {
        return false;
    }
    if (!std.mem.eql(u8, expected_args[1], command.repo_path)) {
        return false;
    }
    return is_same_args(command.args, expected_args[2..]);
}

//
// Whether the arguments are the expected ones, in the same order.
//
fn is_same_args(args: []const []const u8, expected_args: []const []const u8) bool {
    if (args.len != expected_args.len) {
        return false;
    }
    for (args, expected_args) |arg, expected_arg| {
        if (!std.mem.eql(u8, arg, expected_arg)) {
            return false;
        }
    }
    return true;
}
