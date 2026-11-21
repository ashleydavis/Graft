//
// The query of the frontend's address: whether the app runs in test mode, the one thing the
// backend passes to the frontend at start-up.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;

//
// Returns `testMode=1` when the app was started with --remote-control and an empty query
// otherwise. The frontend listens for the smoke tests' commands only when the query holds
// `testMode=1`, and Ziggy passes test mode to the frontend only through this query.
//
pub fn test_mode_query(
    services: ziggy.core.HandlerServices,
    timers: ziggy.timers.Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    test_mode: bool,
) anyerror![]const u8 {
    _ = services;
    _ = timers;
    _ = io;
    if (test_mode) {
        const query = try allocator.dupe(u8, "testMode=1");
        assert(query.len > 0);
        return query;
    }
    const query = try allocator.dupe(u8, "");
    assert(query.len == 0);
    return query;
}
