//
// The file diff task: the background task that reads the diff of one file in a commit with the
// `diff-tree` wrapper, for the file pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_diff_tree = @import("git-diff-tree.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the file diff task with. The field names are camelCase because they
// are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const FileDiffTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,

    //
    // The hash of the commit that changed the file.
    //
    hash: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,
};

//
// The result of the file diff task, an object so the frontend reads a named field.
//
pub const FileDiff = struct {
    //
    // The file's diff, as git writes it.
    //
    diff: []const u8,
};

//
// The type of a file diff task handler, as Ziggy calls it.
//
pub const FileDiffTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: FileDiffTaskRequest,
) anyerror!FileDiff;

//
// Makes the file diff task handler that runs Git with `run_git`. Ziggy passes a task handler only
// its standard arguments, so the Git interface function is chosen when the handler is made, as for
// the commits task.
//
pub fn file_diff_task_handler(comptime run_git: git_interface.RunGit) FileDiffTaskHandler {
    return struct {
        //
        // Reads the file's diff, in the task's arena.
        //
        fn file_diff_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: FileDiffTaskRequest,
        ) anyerror!FileDiff {
            _ = timers;
            assert(context.task_id.len > 0);

            const diff = try git_diff_tree.read_file_diff(io, services.log, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .hash = payload.hash,
                .path = payload.path,
            });
            assert(payload.path.len > 0);
            return .{
                .diff = diff,
            };
        }
    }.file_diff_task_handler_run;
}
