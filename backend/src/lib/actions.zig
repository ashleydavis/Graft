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
// own keys (reload, zoom and the developer tools), as actions.test.zig checks. Keyboard Shortcuts
// shows the keyboard shortcuts overlay, or closes it when it is open. Its shortcut is `?`, which
// Ziggy runs in the frontend and leaves to a focused text box, so typing a `?` in a text box types
// it. Commit Explorer opens the commit explorer, the commits page, from any page. Its shortcut
// holds Ctrl (Cmd on macOS), so it runs even while a text box has the focus.
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
        .name = "open-commit-explorer",
        .label = "Commit Explorer",
        .shortcut = "CmdOrCtrl+1",
    },
};
