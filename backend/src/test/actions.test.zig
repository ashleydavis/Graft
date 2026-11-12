//
// Tests Graft's actions: that the Keyboard Shortcuts action is declared with the shortcut `?`, and
// that running it, as its shortcut and the frontend do, sends the frontend the action event naming
// it. Each running test starts the backend with Ziggy's fake native app and sends the system
// message the native app or the frontend would.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const actions = @import("../lib/actions.zig");

const io = std.testing.io;
const test_environment = @import("test-environment.zig");

//
// Starts Graft's backend with a fake native app, sends it the system message and checks the
// frontend is sent the action event naming the Keyboard Shortcuts action.
//
fn expect_shortcuts_overlay_event(message: []const u8) !void {
    var native_app: ziggy.fake_native_app.FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), app.app);
    defer native_app.stop(io, std.testing.allocator);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(
        io,
        std.testing.allocator,
        "{\"kind\":\"system\",\"name\":\"action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
    );
}

test "Keyboard Shortcuts is Graft's one action, with the shortcut ?" {
    try std.testing.expectEqual(@as(usize, 1), actions.actions.len);
    try std.testing.expectEqualStrings("toggle-shortcuts-overlay", actions.actions[0].name);
    try std.testing.expectEqualStrings("Keyboard Shortcuts", actions.actions[0].label);
    try std.testing.expectEqualStrings("?", actions.actions[0].shortcut.?);
}

test "Graft's app declares the actions" {
    try std.testing.expectEqual(actions.actions.ptr, app.app.actions.ptr);
}

test "the shortcut of Keyboard Shortcuts sends the frontend the action event naming it" {
    try expect_shortcuts_overlay_event(
        "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
    );
}

test "the frontend running Keyboard Shortcuts sends it the action event naming it" {
    try expect_shortcuts_overlay_event(
        "{\"kind\":\"system\",\"id\":1,\"name\":\"run-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
    );
}
