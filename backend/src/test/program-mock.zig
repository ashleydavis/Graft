//
// The mock of the program starter, for unit testing the code that opens files without starting
// the file manager or an editor.
//

const std = @import("std");
const start_program = @import("../lib/start-program.zig");

//
// What a mock of the program starter expects and returns.
//
pub const MockProgramOptions = struct {
    //
    // The program and arguments the code under test must start. An expected argument that starts
    // with `*` matches any argument that ends with the rest of it, for a full path under a test's
    // temporary directory, whose name is known only when the test runs. Any others fail the call
    // with error.UnexpectedProgramArguments, so a test fails when the code builds the wrong
    // command.
    //
    expected_argv: []const []const u8,

    //
    // The exit code the mock reports, or null for a program that ended without exiting.
    //
    exit_code: ?u8,

    //
    // What the mock reports the program wrote to its standard error.
    //
    stderr: []const u8,

    //
    // The error the mock fails with in place of a result, as the real starter does when the
    // program cannot be started, or null to return a result.
    //
    start_error: ?anyerror,
};

//
// Makes a mock of the program starter that checks it was given the expected program and
// arguments and returns the result the options hold. The options are fixed when the mock is made,
// so the mock keeps no state and can run on any thread, as a task does. The result it returns is
// allocated with the allocator it is given, as the real starter's result is.
//
pub fn mock_start_program(comptime options: MockProgramOptions) start_program.StartProgram {
    return struct {
        //
        // Returns the result the options hold for one call.
        //
        fn mock_start_program_run(
            io: std.Io,
            allocator: std.mem.Allocator,
            argv: []const []const u8,
        ) anyerror!start_program.ProgramResult {
            _ = io;
            if (options.start_error) |err| {
                return err;
            }
            if (!is_same_argv(argv, options.expected_argv)) {
                std.debug.print("a program was started with unexpected arguments:\n", .{});
                for (argv) |arg| {
                    std.debug.print("  {s}\n", .{arg});
                }
                return error.UnexpectedProgramArguments;
            }
            return .{
                .exit_code = options.exit_code,
                .stderr = try allocator.dupe(u8, options.stderr),
            };
        }
    }.mock_start_program_run;
}

//
// Whether the arguments are the expected ones, in the same order.
//
fn is_same_argv(argv: []const []const u8, expected_argv: []const []const u8) bool {
    if (argv.len != expected_argv.len) {
        return false;
    }
    for (argv, expected_argv) |arg, expected_arg| {
        if (!is_same_arg(arg, expected_arg)) {
            return false;
        }
    }
    return true;
}

//
// Whether the argument is the expected one, or ends with what follows the `*` an expected
// argument starts with.
//
fn is_same_arg(arg: []const u8, expected_arg: []const u8) bool {
    if (std.mem.startsWith(u8, expected_arg, "*")) {
        return std.mem.endsWith(u8, arg, expected_arg[1..]);
    }
    return std.mem.eql(u8, arg, expected_arg);
}
