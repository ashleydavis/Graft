//
// Tests the Git interface function against the real `git`, the only unit tests that run it. Each
// test makes its own repo in a uniquely named directory under the project's `tmp/`, so the tests
// can run in parallel with themselves, and checks only that the function starts git with the
// arguments and reports its exit code, standard output and standard error.
//

const std = @import("std");
const git_interface = @import("../lib/git-interface.zig");

const io = std.testing.io;

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
// Runs git through the Git interface function, frees what it wrote and fails the test when it
// did not exit with 0.
//
fn run_git_successfully(args: []const []const u8) !void {
    const result = try git_interface.run_git(io, std.testing.allocator, args);
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

test "run_git reports what git wrote to its standard output and exit code 0" {
    const result = try git_interface.run_git(io, std.testing.allocator, &.{"--version"});
    defer std.testing.allocator.free(result.stdout);
    defer std.testing.allocator.free(result.stderr);

    try std.testing.expectEqual(@as(?u8, 0), result.exit_code);
    try std.testing.expect(std.mem.startsWith(u8, result.stdout, "git version "));
    try std.testing.expectEqualStrings("", result.stderr);
}

test "run_git runs git in a repo with the arguments it is given" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    try commit(&directory, "The first commit");
    try commit(&directory, "The second commit");
    const result = try git_interface.run_git(io, std.testing.allocator, &.{
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

test "run_git reports git's error exit code and standard error without failing" {
    var directory: TestDirectory = undefined;
    try make_test_directory(&directory);
    defer delete_test_directory(&directory);

    try init_repo(&directory);
    const result = try git_interface.run_git(io, std.testing.allocator, &.{
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
    const result = try git_interface.run_git(io, allocator, &.{"--version"});
    allocator.free(result.stdout);
    allocator.free(result.stderr);
}

test "run_git frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, run_git_version, .{});
}
