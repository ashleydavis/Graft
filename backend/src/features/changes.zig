//
// The changes feature's declarations to Ziggy: the tasks the repo explorer's changes pane queues
// to read the working tree's staged and unstaged files, read one file's diff and stage or unstage
// a file. app.zig builds Graft's list of tasks from them.
//

const git_interface = @import("../lib/git-interface.zig");
const stage_file_task = @import("../lib/stage-file-task.zig");
const working_changes_task = @import("../lib/working-changes-task.zig");
const working_file_diff_task = @import("../lib/working-file-diff-task.zig");

//
// The changes pane's tasks, each run with the real Git interface function.
//
pub const tasks = .{
    .@"working-changes" = working_changes_task.working_changes_task_handler(git_interface.run_git),
    .@"working-file-diff" = working_file_diff_task.working_file_diff_task_handler(
        git_interface.run_git,
    ),
    .@"stage-file" = stage_file_task.stage_file_task_handler(git_interface.run_git),
    .@"unstage-file" = stage_file_task.unstage_file_task_handler(git_interface.run_git),
};
