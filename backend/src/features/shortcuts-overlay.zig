//
// The keyboard shortcuts overlay's declaration to Ziggy: the Keyboard Shortcuts action, which
// actions.zig puts in Graft's action list.
//

const ziggy = @import("ziggy");

//
// Keyboard Shortcuts shows the keyboard shortcuts overlay, or closes it when it is open. Its
// shortcut is `?`, which Ziggy runs in the frontend and leaves to a focused text box, so typing a
// `?` in a text box types it.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "toggle-shortcuts-overlay",
        .label = "Keyboard Shortcuts",
        .shortcut = "?",
    },
};
