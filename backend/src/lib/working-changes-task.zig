//
// The working changes task: the background task that reads the working tree's staged and unstaged
// files with the `status` wrapper, for the changes pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_status = @import("git-status.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the working changes task with. The field names are camelCase
// because they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const WorkingChangesTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,
};

//
// The type of a working changes task handler, as Ziggy calls it: its result is the two lists,
// which Ziggy turns into the JSON of the task's result.
//
pub const WorkingChangesTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: WorkingChangesTaskRequest,
) anyerror!git_status.WorkingChanges;

//
// Makes the working changes task handler that runs Git with `run_git`. Ziggy passes a task
// handler only its standard arguments, so the Git interface function is chosen when the handler
// is made, as for the commits task.
//
pub fn working_changes_task_handler(
    comptime run_git: git_interface.RunGit,
) WorkingChangesTaskHandler {
    return struct {
        //
        // Reads the repo's staged and unstaged files, in the task's arena.
        //
        fn working_changes_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: WorkingChangesTaskRequest,
        ) anyerror!git_status.WorkingChanges {
            _ = timers;
            assert(context.task_id.len > 0);

            const changes = try git_status.read_working_changes(
                io,
                services,
                allocator,
                run_git,
                payload.repoPath,
            );
            assert(payload.repoPath.len > 0);
            return changes;
        }
    }.working_changes_task_handler_run;
}
