//
// Graft's declaration to Ziggy: the messages its frontend sends and the tasks it queues, each with
// the Zig function that handles it, its menu, its actions and its built frontend. Ziggy's build
// serves the app declared here.
//

const ziggy = @import("ziggy");
const actions = @import("lib/actions.zig");
const commit_details_task = @import("lib/commit-details-task.zig");
const commits_task = @import("lib/commits-task.zig");
const file_diff_task = @import("lib/file-diff-task.zig");
const git_interface = @import("lib/git-interface.zig");
const menu = @import("lib/menu.zig");
const pick_repo_folder = @import("lib/pick-repo-folder.zig");
const ui_query = @import("lib/ui-query.zig");
const zoom = @import("lib/zoom.zig");
const ui = @import("ui-files");

//
// Graft, registered with Ziggy's core: each message name with its handler and each task type with
// its task. Every task runs the real Git interface function.
//
pub const app = ziggy.core.App(.{
    .messages = .{
        .@"pick-repo-folder" = pick_repo_folder.pick_repo_folder_message_handler,
        .zoom = zoom.zoom_message_handler,
    },
    .tasks = .{
        .commits = commits_task.commits_task_handler(git_interface.run_git),
        .@"commit-details" = commit_details_task.commit_details_task_handler(git_interface.run_git),
        .@"file-diff" = file_diff_task.file_diff_task_handler(git_interface.run_git),
        .@"pick-repo-folder" = pick_repo_folder.pick_repo_folder_task_handler,
    },
    .menu = menu.menu,
    .actions = actions.actions,
    // The window's colour before the page draws: the style guide's --color-bg in each theme (--gray-50 in light and
    // --gray-950 in dark, in frontend/src/graft.css). main.css and index.html draw the page in the same colours.
    .backgrounds = .{
        .light = 0xFAFAFA,
        .dark = 0x09090B,
    },
    .ui_files = &ui.files,
    .ui_query = ui_query.ui_query,
});
