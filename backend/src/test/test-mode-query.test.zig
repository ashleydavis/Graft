//
// Tests the query the backend gives the frontend's address: `testMode=1` in test mode and empty
// outside it, read from Graft's backend as its native app reads it.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const test_mode_query = @import("../lib/test-mode-query.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// Starts Graft's backend with the test mode switch as given and returns the query its native app
// would add to the frontend's address, which the caller frees.
//
fn read_app_query(test_mode: bool) ![:0]u8 {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    var config = native_app.config(2, 2);
    config.test_mode = test_mode;
    try native_app.start(io, std.testing.allocator, config, app.app);
    defer native_app.stop(io, std.testing.allocator);

    return try native_app.uiQuery(std.testing.allocator);
}

test "Graft's query is empty outside test mode" {
    const query = try read_app_query(false);
    defer std.testing.allocator.free(query);

    try std.testing.expectEqualStrings("", query);
}

test "Graft's query switches test mode on in test mode" {
    const query = try read_app_query(true);
    defer std.testing.allocator.free(query);

    try std.testing.expectEqualStrings("testMode=1", query);
}

//
// Makes the query with the allocator and frees it, for the allocation failure test. The query
// reads none of the handler services or timers, so they are left undefined.
//
fn make_query(allocator: std.mem.Allocator, test_mode: bool) !void {
    const query = try test_mode_query.test_mode_query(
        undefined,
        undefined,
        io,
        allocator,
        test_mode,
    );
    allocator.free(query);
}

test "test_mode_query frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, make_query, .{true});
    try std.testing.checkAllAllocationFailures(std.testing.allocator, make_query, .{false});
}
