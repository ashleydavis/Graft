//
// Graft's actions: named pieces of its functionality, each run by its name alone, whose handlers
// are in the frontend. A menu item, a shortcut, the frontend or the backend runs one by its name.
// See Ziggy's guide "Actions".
//

const ziggy = @import("ziggy");

//
// The actions Graft passes to ziggy.core.App as `.actions`. Open repo is on the File menu. Its
// frontend handler shows the folder picker and opens the folder chosen in the commit explorer. Its
// shortcut is CmdOrCtrl+O, the usual key for opening in desktop apps, kept clear of the web view's
// own keys (reload and the developer tools), as actions.test.zig checks. Keyboard Shortcuts
// shows the keyboard shortcuts overlay, or closes it when it is open. Its shortcut is `?`, which
// Ziggy runs in the frontend and leaves to a focused text box, so typing a `?` in a text box types
// it. Zoom In, Zoom Out and Actual Size are on the View menu with the usual zoom keys. They are
// Graft's own actions, so their frontend handlers see every zoom and save the zoom level in
// Graft's state file. Ziggy also runs a Plus shortcut on `=`, so Ctrl+= zooms in as well, without
// Shift.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "open-repo",
        .label = "Open repo",
        .shortcut = "CmdOrCtrl+O",
    },
    .{
        .name = "toggle-shortcuts-overlay",
        .label = "Keyboard Shortcuts",
        .shortcut = "?",
    },
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
