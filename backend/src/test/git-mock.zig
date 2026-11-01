//
// The mocks of the Git interface function, for unit testing the `log` wrapper and every other Git
// abstraction without running `git`.
//

const std = @import("std");
const git_interface = @import("../lib/git-interface.zig");

//
// What a mock of the Git interface function expects and answers.
//
pub const MockGitOptions = struct {
    //
    // The arguments the code under test must start git with. Any other arguments fail the call
    // with error.UnexpectedGitArguments, so a test fails when the code builds the wrong command.
    //
    expected_args: []const []const u8,

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
            allocator: std.mem.Allocator,
            args: []const []const u8,
        ) anyerror!git_interface.GitResult {
            _ = io;
            if (options.start_error) |err| {
                return err;
            }
            if (args.len != options.expected_args.len) {
                std.debug.print("git was started with {d} arguments, not {d}\n", .{
                    args.len,
                    options.expected_args.len,
                });
                return error.UnexpectedGitArguments;
            }
            for (args, options.expected_args) |arg, expected_arg| {
                if (!std.mem.eql(u8, arg, expected_arg)) {
                    std.debug.print("git was given the argument {s}, not {s}\n", .{
                        arg,
                        expected_arg,
                    });
                    return error.UnexpectedGitArguments;
                }
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
            allocator: std.mem.Allocator,
            args: []const []const u8,
        ) anyerror!git_interface.GitResult {
            inline for (calls) |call| {
                if (is_same_args(args, call.expected_args)) {
                    return mock_git(call)(io, allocator, args);
                }
            }
            std.debug.print("git was started with {d} arguments that no call expects\n", .{
                args.len,
            });
            return error.UnexpectedGitArguments;
        }
    }.mock_git_calls_run;
}

//
// Whether the arguments git was started with are the expected ones, in the same order.
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
