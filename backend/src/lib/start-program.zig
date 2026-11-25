//
// The program starter: the one function that starts a program other than `git`, such as the file
// manager or the user's editor. Every such start in Graft goes through it, so a unit test gives
// the code above it a mock in its place.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;

//
// How a program the starter ran ended. The caller owns `stderr` and frees it with the allocator it
// passed.
//
pub const ProgramResult = struct {
    //
    // The code the program exited with, or null when it ended without exiting, such as when a
    // signal killed it. Zero means it succeeded.
    //
    exit_code: ?u8,

    //
    // Everything the program wrote to its standard error, which gives the reason it failed.
    //
    stderr: []const u8,
};

//
// The type of the program starter: starts the program `argv[0]` with the arguments after it,
// waits for it to end and reports how it ended. A plain function pointer, so the code that opens
// files takes the starter as an argument and a unit test passes a mock instead.
//
pub const StartProgram = *const fn (
    io: std.Io,
    allocator: std.mem.Allocator,
    argv: []const []const u8,
) anyerror!ProgramResult;

//
// Starts the program (found on PATH) with the arguments, waits for it to end and reports its exit
// code and standard error. It runs with Graft's own environment, so the file manager and the
// editor see the user's desktop session, as when the user starts them. A thread Ziggy gave an
// environment of its own (a test's) passes that one, and any other thread passes a copy of the
// process's environment, because a spawn given no environment starts the program with an empty
// one on Linux and macOS. A program that exits with an error still returns its result, and the
// caller reads the exit code. The function returns an error when it fails to start the program.
//
pub fn start_program(
    io: std.Io,
    allocator: std.mem.Allocator,
    argv: []const []const u8,
) anyerror!ProgramResult {
    assert(argv.len > 0);
    assert(argv[0].len > 0);

    var arena_state = std.heap.ArenaAllocator.init(allocator);
    defer arena_state.deinit();

    var process_environ: std.process.Environ.Map = undefined;
    var environ_map: *const std.process.Environ.Map = undefined;
    if (ziggy.utils.process_env.getEnvironMap()) |thread_environ| {
        environ_map = thread_environ;
    } else {
        process_environ = try ziggy.new_instance.process_environ_map(arena_state.allocator());
        environ_map = &process_environ;
    }
    const result = try std.process.run(allocator, io, .{
        .argv = argv,
        .stdout_limit = .unlimited,
        .stderr_limit = .unlimited,
        .cwd = .inherit,
        .environ_map = environ_map,
        .create_no_window = true,
        .timeout = .none,
    });
    allocator.free(result.stdout);

    var exit_code: ?u8 = null;
    if (result.term == .exited) {
        exit_code = result.term.exited;
    }
    if (exit_code != null) assert(result.term == .exited);
    return .{
        .exit_code = exit_code,
        .stderr = result.stderr,
    };
}
