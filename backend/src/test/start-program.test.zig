//
// Tests the program starter with a real program, `git`, which every machine that builds Graft has,
// as the Git interface function's tests do: it checks only that the starter starts a program,
// waits for it and reports how it ended.
//

const std = @import("std");
const start_program = @import("../lib/start-program.zig");

const io = std.testing.io;

test "start_program reports a program that succeeded" {
    const result = try start_program.start_program(io, std.testing.allocator, &.{
        "git",
        "--version",
    });
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
}

test "start_program reports the exit code and standard error of a program that failed" {
    const result = try start_program.start_program(io, std.testing.allocator, &.{
        "git",
        "graft-no-such-command",
    });
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expect(result.exit_code != null);
    try std.testing.expect(result.exit_code.? != 0);
    try std.testing.expect(std.mem.indexOf(u8, result.stderr, "graft-no-such-command") != null);
}

test "start_program fails when the program is not on the PATH" {
    try std.testing.expectError(error.FileNotFound, start_program.start_program(
        io,
        std.testing.allocator,
        &.{"graft-no-such-program"},
    ));
}
