//
// The new-window feature's declarations to Ziggy: the New window action and its File menu item,
// which actions.zig and menu.zig put in Graft's lists.
//

const ziggy = @import("ziggy");

//
// New window, on the File menu. Its frontend handler has Ziggy start another window of Graft as a
// process of its own, with its own backend and task queue. Its shortcut is CmdOrCtrl+N, the usual
// key for a new window in desktop apps.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "new-window",
        .label = "New window",
        .shortcut = "CmdOrCtrl+N",
    },
};

//
// The File menu's New window item, which shows the action's label and shortcut.
//
pub const file_menu_items: []const ziggy.menu.Item = &.{
    .{
        .run = .{
            .action = "new-window",
        },
    },
};
