//
// The commit task: the background task that commits the staged files with the user's message
// through the `commit` wrapper, for the changes pane's Commit button.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_commit = @import("git-commit.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the commit task with. The field names are camelCase because they
// are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const CommitTaskRequest = struct {
    //
    // The path of the repo whose staged files are committed.
    //
    repoPath: []const u8,

    //
    // The commit message as the user wrote it.
    //
    message: []const u8,
};

//
// The result of the commit task: the message of the commit it made, an object so the frontend
// reads a named field, as the stage file task's result is.
//
pub const CommitTaskResult = struct {
    //
    // The message the commit was made with.
    //
    message: []const u8,
};

//
// The type of the commit task handler, as Ziggy calls it.
//
pub const CommitTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: CommitTaskRequest,
) anyerror!CommitTaskResult;

//
// Makes the commit task handler that runs Git with `run_git`. Ziggy passes a task handler only its
// standard arguments, so the Git interface function is chosen when the handler is made, as for the
// stage file task.
//
pub fn commit_task_handler(comptime run_git: git_interface.RunGit) CommitTaskHandler {
    return struct {
        //
        // Commits the staged files of the payload's repo with its message.
        //
        fn commit_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: CommitTaskRequest,
        ) anyerror!CommitTaskResult {
            _ = timers;
            assert(context.task_id.len > 0);

            try git_commit.commit(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .message = payload.message,
            });
            assert(payload.message.len > 0);
            return .{
                .message = payload.message,
            };
        }
    }.commit_task_handler_run;
}
