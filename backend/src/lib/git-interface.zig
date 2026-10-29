//
// The Git interface: the one function that starts `git`. Every Git operation in Graft goes through
// it, so a test can give the code above it a mock in its place.
//

const std = @import("std");

const assert = std.debug.assert;

//
// What `git` reported when it ended. The caller owns `stdout` and `stderr` and frees them with the
// allocator it passed.
//
pub const GitResult = struct {
    //
    // The code `git` exited with, or null when it ended without exiting, such as when a signal
    // killed it. Zero means it succeeded.
    //
    exit_code: ?u8,

    //
    // Everything `git` wrote to its standard output.
    //
    stdout: []const u8,

    //
    // Everything `git` wrote to its standard error.
    //
    stderr: []const u8,
};

//
// The type of the Git interface function: starts `git` with the arguments and reports how it
// ended. A plain function pointer, so the code that runs Git takes `run_git` itself as an argument,
// and a unit test passes a mock instead.
//
pub const RunGit = *const fn (
    io: std.Io,
    allocator: std.mem.Allocator,
    args: []const []const u8,
) anyerror!GitResult;

//
// The Git interface function. Starts `git` (found on PATH) with the arguments, waits for it to end
// and reports its exit code, standard output and standard error. A `git` that exits with an error
// still returns its result, and the caller reads the exit code, because what a failure means
// depends on the command. The function returns an error when it fails to start `git`.
//
pub fn run_git(
    io: std.Io,
    allocator: std.mem.Allocator,
    args: []const []const u8,
) anyerror!GitResult {
    assert(args.len > 0);

    const argv = try allocator.alloc([]const u8, args.len + 1);
    defer allocator.free(argv);

    argv[0] = "git";
    @memcpy(argv[1..], args);
    const result = try std.process.run(allocator, io, .{
        .argv = argv,
        .stdout_limit = .unlimited,
        .stderr_limit = .unlimited,
        .cwd = .inherit,
        .environ_map = null,
        .create_no_window = true,
        .timeout = .none,
    });
    const exit_code: ?u8 = if (result.term == .exited) result.term.exited else null;
    if (exit_code != null) assert(result.term == .exited);
    assert(argv.len == args.len + 1);
    return .{
        .exit_code = exit_code,
        .stdout = result.stdout,
        .stderr = result.stderr,
    };
}
