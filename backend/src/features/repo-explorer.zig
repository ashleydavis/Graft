//
// The repo explorer's declarations to Ziggy: the Repo Explorer action and the tasks the repo
// explorer page queues, one per pane. actions.zig and app.zig build Graft's lists from them.
//

const ziggy = @import("ziggy");
const branches_task = @import("../lib/branches-task.zig");
const commit_details_task = @import("../lib/commit-details-task.zig");
const commits_task = @import("../lib/commits-task.zig");
const file_diff_task = @import("../lib/file-diff-task.zig");
const git_interface = @import("../lib/git-interface.zig");

//
// Repo Explorer opens the repo explorer page from any page. Its shortcut holds Ctrl (Cmd on
// macOS), so it runs even while a text box has the focus.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "open-repo-explorer",
        .label = "Repo Explorer",
        .shortcut = "CmdOrCtrl+1",
    },
};

//
// The repo explorer page's tasks: the branches task for the repo details pane, the commits task
// for the commit pane and the branch pane, the commit details task for the commit details pane and
// the file diff task for the file pane. Each runs the real Git interface function.
//
pub const tasks = .{
    .branches = branches_task.branches_task_handler(git_interface.run_git),
    .commits = commits_task.commits_task_handler(git_interface.run_git),
    .@"commit-details" = commit_details_task.commit_details_task_handler(git_interface.run_git),
    .@"file-diff" = file_diff_task.file_diff_task_handler(git_interface.run_git),
};
