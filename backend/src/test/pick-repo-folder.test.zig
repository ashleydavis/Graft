//
// Tests the pick-repo-folder message and task and the open-repo action: each test starts Graft's
// backend with Ziggy's fake native app, whose folder picker returns what the test sets, and sends
// it what the frontend or the native app would.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const pick_repo_folder = @import("../lib/pick-repo-folder.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// Starts Graft's backend, has the fake folder picker return the JSON text of the paths, sends the
// message and waits for a message containing the expected text.
//
fn expect_reply(picked_json: []const u8, message: []const u8, expected_text: []const u8) !void {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), app.app);
    defer native_app.stop(io, std.testing.allocator);

    native_app.setResult(io, std.testing.allocator, "pick-paths", true, picked_json);
    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

//
// The pick-repo-folder message as window.ziggy.invoke sends it, with null as its data.
//
const pick_message = "{\"kind\":\"app\",\"id\":1,\"name\":\"pick-repo-folder\",\"data\":null}";

test "pick-repo-folder replies with the folder the user chose" {
    try expect_reply(
        "[\"/repos/graft\"]",
        pick_message,
        "{\"id\":1,\"ok\":true,\"data\":\"/repos/graft\"}",
    );
}

test "pick-repo-folder replies with null when the user cancelled the folder picker" {
    try expect_reply("[]", pick_message, "{\"id\":1,\"ok\":true,\"data\":null}");
}

test "pick-repo-folder shows a folder picker titled Open repo" {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), app.app);
    defer native_app.stop(io, std.testing.allocator);

    native_app.setResult(io, std.testing.allocator, "pick-paths", true, "[\"/repos/graft\"]");
    try native_app.send(io, std.testing.allocator, pick_message);
    try native_app.expectMessageContaining(io, std.testing.allocator, "\"ok\":true");

    const call = (try native_app.lastCall(io, std.testing.allocator, "pick-paths")).?;
    defer std.testing.allocator.free(call);
    try std.testing.expect(std.mem.indexOf(u8, call, "\"kind\":2") != null);
    try std.testing.expect(std.mem.indexOf(u8, call, "\"title\":\"Open repo\"") != null);
}

test "pick-repo-folder fails when the native app could not show the folder picker" {
    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), app.app);
    defer native_app.stop(io, std.testing.allocator);

    native_app.setResult(io, std.testing.allocator, "pick-paths", false, "No dialog.");
    try native_app.send(io, std.testing.allocator, pick_message);
    try native_app.expectMessageContaining(io, std.testing.allocator, "{\"id\":1,\"ok\":false");
}

//
// The action event the backend sends the frontend when the open-repo action runs, from the menu or
// from a run-action message.
//
const open_repo_action_event =
    "{\"kind\":\"system\",\"name\":\"action\",\"data\":{\"action\":\"open-repo\"}}";

test "running the open-repo action sends the frontend its action event" {
    try expect_reply(
        "[]",
        "{\"kind\":\"system\",\"id\":1,\"name\":\"run-action\"," ++
            "\"data\":{\"action\":\"open-repo\"}}",
        open_repo_action_event,
    );
}

test "choosing Open repo on the menu sends the frontend the open-repo action event" {
    try expect_reply(
        "[]",
        "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"open-repo\"}}",
        open_repo_action_event,
    );
}

test "first_picked_path reads the first path the dialog returned" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const path = try pick_repo_folder.first_picked_path(
        arena.allocator(),
        "[\"/repos/a repo\",\"/repos/other\"]",
    );
    try std.testing.expectEqualStrings("/repos/a repo", path.?);
}

test "first_picked_path is null when the dialog returned no path" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const path = try pick_repo_folder.first_picked_path(arena.allocator(), "[]");
    try std.testing.expect(path == null);
}

test "first_picked_path fails on text that is not an array of paths" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedToken,
        pick_repo_folder.first_picked_path(arena.allocator(), "{\"path\":1}"),
    );
}

//
// Reads the first path in an arena of the allocator and frees it, for the allocation failure test.
//
fn read_first_path(allocator: std.mem.Allocator) !void {
    var arena: std.heap.ArenaAllocator = .init(allocator);
    defer arena.deinit();

    _ = try pick_repo_folder.first_picked_path(arena.allocator(), "[\"/repos/graft\"]");
}

test "first_picked_path frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_first_path, .{});
}
