//
// Graft's actions: named pieces of its functionality, each run by its name alone, whose handlers
// are in the frontend. A shortcut, the frontend or the backend runs one by its name. See Ziggy's
// guide "Actions".
//

const ziggy = @import("ziggy");

//
// The actions Graft passes to ziggy.core.App as `.actions`. Keyboard Shortcuts shows the keyboard
// shortcuts overlay, or closes it when it is open. Its shortcut is `?`, which Ziggy runs in the
// frontend and leaves to a focused text box, so typing a `?` in a text box types it. Commit
// Explorer opens the commit explorer, the commits page, from any page. Its shortcut holds Ctrl (Cmd
// on macOS), so it runs even while a text box has the focus.
//
pub const actions: []const ziggy.action.Action = &.{
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
