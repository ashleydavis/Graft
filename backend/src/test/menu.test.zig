//
// Tests Graft's menu: each feature's items are in the menu they belong to and run their actions.
// It checks the File menu holds the items of New window and Open repo and the View menu the items
// of Zoom In, Zoom Out and Actual Size, each item found by the action it runs, so a feature that
// adds an item leaves these tests as they are.
//

const std = @import("std");
const ziggy = @import("ziggy");
const app = @import("graft-backend");
const menu = @import("../lib/menu.zig");

//
// What has_action_item looks for. Both are strings, so they are named fields to keep a call from
// swapping them.
//
const ActionItemOptions = struct {
    // The label of the menu in the menu bar.
    menu_label: []const u8,

    // The name of the action the item runs.
    action: []const u8,
};

//
// Returns true when the menu of the label has an item that runs the action.
//
fn has_action_item(options: ActionItemOptions) bool {
    for (menu.menu) |bar_menu| {
        if (std.mem.eql(u8, bar_menu.label, options.menu_label)) {
            for (bar_menu.items) |item| {
                const run = item.run orelse continue;
                if (run == .action) {
                    if (std.mem.eql(u8, run.action, options.action)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

//
// Checks the menu of the label has an item that runs the action, and that Graft's app runs the
// action for it.
//
fn expect_action_item(options: ActionItemOptions) !void {
    try std.testing.expect(has_action_item(options));
    const target = app.app.menu_targets.get(options.action) orelse return error.MenuItemMissing;
    try std.testing.expect(target == .action);
}

test "the File menu has the New window and Open repo items" {
    try expect_action_item(.{
        .menu_label = "File",
        .action = "new-window",
    });
    try expect_action_item(.{
        .menu_label = "File",
        .action = "open-repo",
    });
}

test "the View menu has the Zoom In, Zoom Out and Actual Size items" {
    try expect_action_item(.{
        .menu_label = "View",
        .action = "zoom-in-step",
    });
    try expect_action_item(.{
        .menu_label = "View",
        .action = "zoom-out-step",
    });
    try expect_action_item(.{
        .menu_label = "View",
        .action = "zoom-actual-size",
    });
}
