//
// Tests Graft's actions, each found by its name. It checks Open repo is declared with the shortcut
// CmdOrCtrl+O, the Keyboard Shortcuts action with the shortcut `?`, the Commit Explorer action with
// the shortcut `CmdOrCtrl+1`, Zoom In, Zoom Out and Actual Size with the usual zoom keys and New
// window with the shortcut CmdOrCtrl+N. It checks every action's shortcut is clear of the web
// view's own keys. It checks running Keyboard Shortcuts and Commit Explorer, as their shortcuts and
// the frontend do, sends the frontend the action event naming each, and that the File menu's New
// window item and its shortcut send the frontend New window's action event. Each running test
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

//
// The action event that names the New window action, which the frontend is sent when the action
// runs.
//
const new_window_event = "{\"kind\":\"system\",\"name\":\"action\"," ++
    "\"data\":{\"action\":\"new-window\"}}";

//
// Searches Graft's actions for the one with the name, and returns it, or null when no action has
// that name. The tests read each action by its name, so a feature that adds an action leaves them
// as they are.
//
fn find_action(name: []const u8) ?ziggy.action.Action {
    for (actions.actions) |action| {
        if (std.mem.eql(u8, action.name, name)) {
            return action;
        }
    }
    return null;
}

//
// What expect_action expects of one action. All three are strings, so they are named fields to
// keep a call from swapping them.
//
const ExpectedAction = struct {
    // The action's name.
    name: []const u8,

    // The label its menu item and the keyboard shortcuts overlay show.
    label: []const u8,

    // Its keyboard shortcut.
    shortcut: []const u8,
};

//
// Checks Graft declares an action of the name, with the label and the shortcut.
//
fn expect_action(expected: ExpectedAction) !void {
    const action = find_action(expected.name) orelse return error.ActionMissing;
    try std.testing.expectEqualStrings(expected.label, action.label);
    try std.testing.expectEqualStrings(expected.shortcut, action.shortcut.?);
}

test "Open repo is an action with the shortcut CmdOrCtrl+O" {
    try expect_action(.{
        .name = "open-repo",
        .label = "Open repo",
        .shortcut = "CmdOrCtrl+O",
    });
}

test "Keyboard Shortcuts is an action with the shortcut ?" {
    try expect_action(.{
        .name = "toggle-shortcuts-overlay",
        .label = "Keyboard Shortcuts",
        .shortcut = "?",
    });
}

test "Zoom In, Zoom Out and Actual Size are actions with the usual zoom keys" {
    try expect_action(.{
        .name = "zoom-in-step",
        .label = "Zoom In",
        .shortcut = "CmdOrCtrl+Plus",
    });
    try expect_action(.{
        .name = "zoom-out-step",
        .label = "Zoom Out",
        .shortcut = "CmdOrCtrl+Minus",
    });
    try expect_action(.{
        .name = "zoom-actual-size",
        .label = "Actual Size",
        .shortcut = "CmdOrCtrl+0",
    });
}

test "New window is an action with the shortcut CmdOrCtrl+N" {
    try expect_action(.{
        .name = "new-window",
        .label = "New window",
        .shortcut = "CmdOrCtrl+N",
    });
}

test "no action's shortcut is one of the web view's own keys" {
    //
    // The keys the web view uses itself: reload and the developer tools, written in the shortcut
    // syntax of Ziggy's menus. The zoom keys belong to Graft's own zoom actions.
    //
    const web_view_keys = [_][]const u8{
        "CmdOrCtrl+R",
        "CmdOrCtrl+Shift+R",
        "F5",
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

test "Commit Explorer is an action with the shortcut CmdOrCtrl+1" {
    try expect_action(.{
        .name = "open-commit-explorer",
        .label = "Commit Explorer",
        .shortcut = "CmdOrCtrl+1",
    });
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

test "the File menu's New window item runs the New window action" {
    const new_window = app.app.menu_targets.get("new-window") orelse return error.MenuItemMissing;
    try std.testing.expect(new_window == .action);
}

test "the File menu's New window item and its shortcut send the frontend New window's event" {
    try expect_action_event(.{
        .message = "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\"," ++
            "\"data\":{\"action\":\"new-window\"}}",
        .event = new_window_event,
    });
}
