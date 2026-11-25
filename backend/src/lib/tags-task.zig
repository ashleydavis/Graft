//
// The tags task: the background task that reads the names of a repo's tags with the
// `for-each-ref` wrapper, for the Tags list of the repo details pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_for_each_ref = @import("git-for-each-ref.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the tags task with. The field name is camelCase because it is the
// JSON the frontend sends and the frontend's names are camelCase.
//
pub const TagsTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,
};

//
// The result of the tags task, which Ziggy turns into the JSON the frontend reads.
//
pub const TagNames = struct {
    //
    // The names of the repo's tags, sorted by name.
    //
    names: []const []const u8,
};

//
// The type of a tags task handler, as Ziggy calls it.
//
pub const TagsTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: TagsTaskRequest,
) anyerror!TagNames;

//
// Makes the tags task handler that runs Git with `run_git`. Ziggy passes a task handler only its
// standard arguments, so the Git interface function is chosen when the handler is made, as for the
// commits task.
//
pub fn tags_task_handler(comptime run_git: git_interface.RunGit) TagsTaskHandler {
    return struct {
        //
        // Reads the names of the repo's tags, in the task's arena.
        //
        fn tags_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: TagsTaskRequest,
        ) anyerror!TagNames {
            _ = timers;
            assert(context.task_id.len > 0);

            const names = try git_for_each_ref.read_tag_names(
                io,
                services,
                allocator,
                run_git,
                payload.repoPath,
            );
            assert(payload.repoPath.len > 0);
            return .{
                .names = names,
            };
        }
    }.tags_task_handler_run;
}
