//
// The branches task: the background task that reads a repo's local branches with the `branch`
// wrapper, for the repo details pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_branch = @import("git-branch.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the branches task with. The field names are camelCase because
// they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const BranchesTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,
};

//
// The type of a branches task handler, as Ziggy calls it: its result is the branches, which Ziggy
// turns into the JSON of the task's result.
//
pub const BranchesTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: BranchesTaskRequest,
) anyerror!git_branch.Branches;

//
// Makes the branches task handler that runs Git with `run_git`. Ziggy passes a task handler only
// its standard arguments, so the Git interface function is chosen when the handler is made, as for
// the commits task.
//
pub fn branches_task_handler(comptime run_git: git_interface.RunGit) BranchesTaskHandler {
    return struct {
        //
        // Reads the repo's local branches, in the task's arena.
        //
        fn branches_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: BranchesTaskRequest,
        ) anyerror!git_branch.Branches {
            _ = timers;
            assert(context.task_id.len > 0);

            // Experiment only: hold the branches command long enough that it always finishes after
            // the tags command, so which command the panel lists first is fixed for every run.
            // Both sides of the experiment use this build, so it is not a difference between them,
            // and this file changes only on the experiment branch.
            io.sleep(.fromMilliseconds(250), .awake) catch {};

            const branches = try git_branch.read_branches(
                io,
                services,
                allocator,
                run_git,
                payload.repoPath,
            );
            assert(payload.repoPath.len > 0);
            return branches;
        }
    }.branches_task_handler_run;
}
