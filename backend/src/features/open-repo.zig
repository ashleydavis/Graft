//
// The open-repo feature's declarations to Ziggy: the Open repo action, its File menu item and the
// pick-repo-folder message and task the action's frontend handler uses to show the folder picker.
// app.zig, actions.zig and menu.zig build Graft's lists from them.
//

const ziggy = @import("ziggy");
const pick_repo_folder = @import("../lib/pick-repo-folder.zig");

//
// Open repo, on the File menu. Its frontend handler shows the folder picker and opens the folder
// chosen in the repo explorer. Its shortcut is CmdOrCtrl+O, the usual key for opening in desktop
// apps, kept clear of the web view's own keys (reload and the developer tools), as
// actions.test.zig checks.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "open-repo",
        .label = "Open repo",
        .shortcut = "CmdOrCtrl+O",
    },
};

//
// The File menu's Open repo item, which shows the action's label and shortcut.
//
pub const file_menu_items: []const ziggy.menu.Item = &.{
    .{
        .run = .{
            .action = "open-repo",
        },
    },
};

//
// The pick-repo-folder message, which the action's frontend handler sends to show the folder
// picker.
//
pub const messages = .{
    .@"pick-repo-folder" = pick_repo_folder.pick_repo_folder_message_handler,
};

//
// The pick-repo-folder task, which shows the folder picker and gives the message its response,
// because the picker waits for the user.
//
pub const tasks = .{
    .@"pick-repo-folder" = pick_repo_folder.pick_repo_folder_task_handler,
};
