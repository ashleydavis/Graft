//
// The query of the frontend's address: what the backend tells the frontend at start-up.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;

//
// Gives the frontend whether the test mode switch is on and, in test mode, the path of the test
// repo a smoke test set in GRAFT_TEST_REPO. The environment is read here, where the app starts,
// and only in test mode, so a release build always reads the repo the frontend defaults to.
//
pub fn ui_query(
    services: ziggy.core.HandlerServices,
    timers: ziggy.timers.Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    test_mode: bool,
) anyerror![]const u8 {
    _ = services;
    _ = timers;
    _ = io;
    const test_repo = if (test_mode) std.c.getenv("GRAFT_TEST_REPO") else null;
    const test_repo_path: ?[]const u8 = if (test_repo) |path| std.mem.span(path) else null;
    if (!test_mode) assert(test_repo_path == null);
    return try ui_query_text(allocator, test_mode, test_repo_path);
}

//
// The query text: empty outside test mode, `testMode=1` in test mode and
// `testMode=1&repo=<path>` when a smoke test gave the path of its test repo. The path is
// percent-encoded, so any character a path can hold reaches the frontend unchanged.
//
pub fn ui_query_text(
    allocator: std.mem.Allocator,
    test_mode: bool,
    test_repo_path: ?[]const u8,
) ![]const u8 {
    if (!test_mode) {
        assert(test_repo_path == null);
        return try allocator.dupe(u8, "");
    }
    const path = test_repo_path orelse return try allocator.dupe(u8, "testMode=1");

    var query: std.Io.Writer.Allocating = .init(allocator);
    defer query.deinit();

    //
    // The writer of an allocating writer fails only when it cannot allocate, so its WriteFailed
    // is reported as the OutOfMemory it is.
    //
    query.writer.writeAll("testMode=1&repo=") catch return error.OutOfMemory;
    const component: std.Uri.Component = .{
        .raw = path,
    };
    component.formatEscaped(&query.writer) catch return error.OutOfMemory;
    assert(query.written().len >= "testMode=1&repo=".len + path.len);
    return try query.toOwnedSlice();
}
