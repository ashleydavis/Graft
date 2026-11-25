//
// The command palette's declaration to Ziggy: the Command Palette action, which actions.zig puts
// in Graft's action list.
//

const ziggy = @import("ziggy");

//
// Command Palette shows the command palette over the page. Its shortcut is CmdOrCtrl+Shift+P, the
// usual key for a command palette in desktop editors. It holds Ctrl (Cmd on macOS), so Ziggy runs
// it even while a text box has the focus, and it is kept clear of the web view's own keys, as
// actions.test.zig checks.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "show-command-palette",
        .label = "Command Palette",
        .shortcut = "CmdOrCtrl+Shift+P",
    },
};
