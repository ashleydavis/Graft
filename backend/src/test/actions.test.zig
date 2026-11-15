//
// Tests Graft's actions. It checks Open repo is declared with the shortcut CmdOrCtrl+O, the
// Keyboard Shortcuts action with the shortcut `?` and New window with the shortcut CmdOrCtrl+N. It
// checks every action's shortcut is clear of the web view's own keys. It checks running Keyboard
// Shortcuts, as its shortcut and the frontend do, sends the frontend the action event naming it,
// and that the File menu's New window item and its shortcut send the frontend New window's action
// event. Each running test starts the backend with Ziggy's fake native app and sends the system
// message the native app or the frontend would.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const actions = @import("../lib/actions.zig");

const io = std.testing.io;
const test_environment = @import("test-environment.zig");

//
// What expect_action_event sends and expects. Both are strings, so they are named fields to keep
// a call from swapping them.
//
const ActionEventOptions = struct {
    // The system message the backend is sent, as the native app or the frontend sends it.
    message: []const u8,

    // The name of the action the message runs, which the action event sent to the frontend names.
    action_name: []const u8,
};

//
// Starts Graft's backend with a fake native app, sends it the system message and checks the
// frontend is sent the action event naming the action.
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
    const expected = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"action\",\"data\":{{\"action\":\"{s}\"}}}}",
        .{options.action_name},
    );
    defer std.testing.allocator.free(expected);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected);
}

test "Graft's actions are Open repo, Keyboard Shortcuts and New window, with their shortcuts" {
    try std.testing.expectEqual(@as(usize, 3), actions.actions.len);
    try std.testing.expectEqualStrings("open-repo", actions.actions[0].name);
    try std.testing.expectEqualStrings("Open repo", actions.actions[0].label);
    try std.testing.expectEqualStrings("CmdOrCtrl+O", actions.actions[0].shortcut.?);
    try std.testing.expectEqualStrings("toggle-shortcuts-overlay", actions.actions[1].name);
    try std.testing.expectEqualStrings("Keyboard Shortcuts", actions.actions[1].label);
    try std.testing.expectEqualStrings("?", actions.actions[1].shortcut.?);
    try std.testing.expectEqualStrings("new-window", actions.actions[2].name);
    try std.testing.expectEqualStrings("New window", actions.actions[2].label);
    try std.testing.expectEqualStrings("CmdOrCtrl+N", actions.actions[2].shortcut.?);
}

test "no action's shortcut is one of the web view's own keys" {
    //
    // The keys the web view uses itself: reload, zoom and the developer tools, written in the
    // shortcut syntax of Ziggy's menus.
    //
    const web_view_keys = [_][]const u8{
        "CmdOrCtrl+R",
        "CmdOrCtrl+Shift+R",
        "F5",
        "CmdOrCtrl+Plus",
        "CmdOrCtrl+Minus",
        "CmdOrCtrl+0",
        "CmdOrCtrl+Shift+I",
        "F12",
    };
    for (actions.actions) |action| {
        const shortcut = action.shortcut orelse continue;
        for (web_view_keys) |web_view_key| {
            try std.testing.expect(!std.ascii.eqlIgnoreCase(shortcut, web_view_key));
        }
    }
}

test "Graft's app declares the actions" {
    try std.testing.expectEqual(actions.actions.ptr, app.app.actions.ptr);
}

test "the shortcut of Keyboard Shortcuts sends the frontend the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
        .action_name = "toggle-shortcuts-overlay",
    });
}

test "the frontend running Keyboard Shortcuts sends it the action event naming it" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"run-action\"," ++
            "\"data\":{\"action\":\"toggle-shortcuts-overlay\"}}",
        .action_name = "toggle-shortcuts-overlay",
    });
}

test "the File menu's New window item runs the New window action" {
    const new_window = app.app.menu_targets.get("new-window") orelse return error.MenuItemMissing;
    try std.testing.expect(new_window == .action);
}

test "the File menu's New window item and its shortcut send the frontend New window's event" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"new-window\"}}",
        .action_name = "new-window",
    });
}
