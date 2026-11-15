//
// Tests the zoom message and the zoom actions: each test starts Graft's backend with Ziggy's fake
// native app and sends it what the frontend or the native app would, then checks the zoom action
// the native app was called to run or the action event the frontend was sent.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;
const test_environment = @import("test-environment.zig");

//
// Starts Graft's backend, sends it the message, waits for the reply holding the expected text and
// checks the native app was called to run exactly the expected actions, one per line.
//
fn expect_chosen_actions(
    message: []const u8,
    expected_reply: []const u8,
    expected_actions: []const u8,
) !void {
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

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_reply);

    const chosen = try native_app.chosenActions(io, std.testing.allocator);
    defer std.testing.allocator.free(chosen);
    try std.testing.expectEqualStrings(expected_actions, chosen);
}

test "the zoom message with zoom-in has the native app zoom in" {
    try expect_chosen_actions(
        "{\"kind\":\"app\",\"id\":1,\"name\":\"zoom\",\"data\":{\"action\":\"zoom-in\"}}",
        "{\"id\":1,\"ok\":true,\"data\":null}",
        "zoom-in\n",
    );
}

test "the zoom message with zoom-out has the native app zoom out" {
    try expect_chosen_actions(
        "{\"kind\":\"app\",\"id\":1,\"name\":\"zoom\",\"data\":{\"action\":\"zoom-out\"}}",
        "{\"id\":1,\"ok\":true,\"data\":null}",
        "zoom-out\n",
    );
}

test "the zoom message with zoom-reset has the native app put the zoom back" {
    try expect_chosen_actions(
        "{\"kind\":\"app\",\"id\":1,\"name\":\"zoom\",\"data\":{\"action\":\"zoom-reset\"}}",
        "{\"id\":1,\"ok\":true,\"data\":null}",
        "zoom-reset\n",
    );
}

test "the zoom message refuses any other native action and runs none" {
    try expect_chosen_actions(
        "{\"kind\":\"app\",\"id\":1,\"name\":\"zoom\",\"data\":{\"action\":\"quit\"}}",
        "InvalidMessageData",
        "",
    );
}

//
// Starts Graft's backend, sends it the menu-action system message the native app sends for the
// action's menu item or shortcut and checks the frontend is sent the action event naming it.
//
fn expect_action_event(comptime action: []const u8) !void {
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

    try native_app.send(
        io,
        std.testing.allocator,
        "{\"kind\":\"system\",\"id\":1,\"name\":\"menu-action\",\"data\":{\"action\":\"" ++
            action ++ "\"}}",
    );
    try native_app.expectMessageContaining(
        io,
        std.testing.allocator,
        "{\"kind\":\"system\",\"name\":\"action\",\"data\":{\"action\":\"" ++ action ++ "\"}}",
    );
}

test "the View menu's Zoom In item sends the frontend the zoom-in-step action" {
    try expect_action_event("zoom-in-step");
}

test "the View menu's Zoom Out item sends the frontend the zoom-out-step action" {
    try expect_action_event("zoom-out-step");
}

test "the View menu's Actual Size item sends the frontend the zoom-actual-size action" {
    try expect_action_event("zoom-actual-size");
}
