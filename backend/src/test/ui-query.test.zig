//
// Tests the query the backend gives the frontend's address: what it holds outside test mode, in
// test mode and when a smoke test gives the path of its own test repo.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const ui_query = @import("../lib/ui-query.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// Starts Graft's backend with the test mode switch as given and returns the query its native app
// would add to the frontend's address, which the caller frees.
//
fn read_app_query(test_mode: bool) ![:0]u8 {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
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

test "ui_query_text gives the test repo's path, percent-encoded, in test mode" {
    const query = try ui_query.ui_query_text(std.testing.allocator, true, "/tmp/a repo&more");
    defer std.testing.allocator.free(query);

    try std.testing.expectEqualStrings("testMode=1&repo=%2Ftmp%2Fa%20repo%26more", query);
}

test "ui_query_text gives only the test mode switch when there is no test repo" {
    const query = try ui_query.ui_query_text(std.testing.allocator, true, null);
    defer std.testing.allocator.free(query);

    try std.testing.expectEqualStrings("testMode=1", query);
}

test "ui_query_text is empty outside test mode" {
    const query = try ui_query.ui_query_text(std.testing.allocator, false, null);
    defer std.testing.allocator.free(query);

    try std.testing.expectEqualStrings("", query);
}

//
// Makes the query for a test repo with the allocator and frees it, for the allocation failure
// test.
//
fn make_test_repo_query(allocator: std.mem.Allocator) !void {
    const query = try ui_query.ui_query_text(allocator, true, "/tmp/graft/test-repo");
    allocator.free(query);
}

test "ui_query_text frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, make_test_repo_query, .{});
}
