//
// Tests Graft's actions: that the Keyboard Shortcuts action is declared with the shortcut `?` and
// the Commit Explorer action with the shortcut `CmdOrCtrl+1`, and that running each, as its
// shortcut and the frontend do, sends the frontend the action event naming it. Each running test
// starts the backend with Ziggy's fake native app and sends the system message the native app or
// the frontend would.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const actions = @import("../lib/actions.zig");

const io = std.testing.io;
const test_environment = @import("test-environment.zig");

//
// What expect_action_event sends and expects. Both are JSON strings, so they are named fields to
// keep a call from swapping them.
//
const ActionEventOptions = struct {
    // The system message the backend is sent, as the native app or the frontend sends it.
    message: []const u8,

    // The action event the frontend is expected to be sent, naming the action the message ran.
    event: []const u8,
};

//
// Starts Graft's backend with a fake native app, sends it the system message and checks the
// frontend is sent the event, the action event naming the action the message ran.
//
fn expect_action_event(options: ActionEventOptions) !void {
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

    try native_app.send(io, std.testing.allocator, options.message);
    try native_app.expectMessageContaining(io, std.testing.allocator, options.event);
}

//
// The action event that names the Keyboard Shortcuts action, which the frontend is sent when the
// action runs.
//
const shortcuts_overlay_event = "{\"kind\":\"system\",\"name\":\"action\"," ++
    "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}";

//
// The action event that names the Commit Explorer action, which the frontend is sent when the
// action runs.
//
const commit_explorer_event = "{\"kind\":\"system\",\"name\":\"action\"," ++
    "\"data\":{\"action\":\"open-commit-explorer\"}}";

test "Graft's actions are Keyboard Shortcuts, with ?, and Commit Explorer" {
    try std.testing.expectEqual(@as(usize, 2), actions.actions.len);
    try std.testing.expectEqualStrings("toggle-shortcuts-overlay", actions.actions[0].name);
    try std.testing.expectEqualStrings("Keyboard Shortcuts", actions.actions[0].label);
    try std.testing.expectEqualStrings("?", actions.actions[0].shortcut.?);
}

test "Commit Explorer is an action with the shortcut CmdOrCtrl+1" {
    try std.testing.expectEqualStrings("open-commit-explorer", actions.actions[1].name);
    try std.testing.expectEqualStrings("Commit Explorer", actions.actions[1].label);
    try std.testing.expectEqualStrings("CmdOrCtrl+1", actions.actions[1].shortcut.?);
}

test "Graft's app declares the actions" {
    try std.testing.expectEqual(actions.actions.ptr, app.app.actions.ptr);
}

test "the shortcut of Keyboard Shortcuts sends the frontend the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
        .event = shortcuts_overlay_event,
    });
}

test "the frontend running Keyboard Shortcuts sends it the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"run-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
        .event = shortcuts_overlay_event,
    });
}

test "the shortcut of Commit Explorer sends the frontend the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"open-commit-explorer\"}}",
        .event = commit_explorer_event,
    });
}

test "the frontend running Commit Explorer sends it the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"run-action\"," ++
            "\"data\":{\"action\":\"open-commit-explorer\"}}",
        .event = commit_explorer_event,
    });
}
