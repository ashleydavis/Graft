//
// The zoom feature's declarations to Ziggy: the Zoom In, Zoom Out and Actual Size actions, their
// View menu items and the zoom message their frontend handlers send. app.zig, actions.zig and
// menu.zig build Graft's lists from them.
//

const ziggy = @import("ziggy");
const zoom = @import("../lib/zoom.zig");

//
// Zoom In, Zoom Out and Actual Size, on the View menu with the usual zoom keys. They are Graft's
// own actions, so their frontend handlers see every zoom and save the zoom level in Graft's state
// file. Ziggy also runs a Plus shortcut on `=`, so Ctrl+= zooms in as well, without Shift.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "zoom-in-step",
        .label = "Zoom In",
        .shortcut = "CmdOrCtrl+Plus",
    },
    .{
        .name = "zoom-out-step",
        .label = "Zoom Out",
        .shortcut = "CmdOrCtrl+Minus",
    },
    .{
        .name = "zoom-actual-size",
        .label = "Actual Size",
        .shortcut = "CmdOrCtrl+0",
    },
};

//
// The View menu's Zoom In, Zoom Out and Actual Size items, which show the actions' labels and
// shortcuts.
//
pub const view_menu_items: []const ziggy.menu.Item = &.{
    .{
        .run = .{
            .action = "zoom-in-step",
        },
    },
    .{
        .run = .{
            .action = "zoom-out-step",
        },
    },
    .{
        .run = .{
            .action = "zoom-actual-size",
        },
    },
};

//
// The zoom message, which the actions' frontend handlers send to have the native app zoom.
//
pub const messages = .{
    .zoom = zoom.zoom_message_handler,
};
