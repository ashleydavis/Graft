//
// The working file diff task: the background task that reads the staged or unstaged diff of one
// changed file in the working tree with the `diff` wrapper, for the changes pane's file diff.
//

const std = @import("std");
const ziggy = @import("ziggy");
const file_diff_task = @import("file-diff-task.zig");
const git_diff = @import("git-diff.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the working file diff task with. The field names are camelCase
// because they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const WorkingFileDiffTaskRequest = struct {
    //
    // The path of the repo the file is in.
    //
    repoPath: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,

    //
    // Whether the file is in the staged list, so its staged changes are read, or in the unstaged
    // list, so its unstaged changes are read.
    //
    isStaged: bool,

    //
    // The file's one letter status in its list, which marks an untracked file ("?").
    //
    status: []const u8,
};

//
// The type of a working file diff task handler, as Ziggy calls it. Its result is laid out as the
// file diff task's, so the frontend reads both diffs the same way.
//
pub const WorkingFileDiffTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: WorkingFileDiffTaskRequest,
) anyerror!file_diff_task.FileDiff;

//
// Makes the working file diff task handler that runs Git with `run_git`. Ziggy passes a task
// handler only its standard arguments, so the Git interface function is chosen when the handler
// is made, as for the commits task.
//
pub fn working_file_diff_task_handler(
    comptime run_git: git_interface.RunGit,
) WorkingFileDiffTaskHandler {
    return struct {
        //
        // Reads the file's diff, in the task's arena.
        //
        fn working_file_diff_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: WorkingFileDiffTaskRequest,
        ) anyerror!file_diff_task.FileDiff {
            _ = timers;
            assert(context.task_id.len > 0);

            const diff = try git_diff.read_working_file_diff(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .path = payload.path,
                .side = git_diff.change_side(payload.isStaged, payload.status),
            });
            assert(payload.path.len > 0);
            return .{
                .diff = diff,
            };
        }
    }.working_file_diff_task_handler_run;
}
