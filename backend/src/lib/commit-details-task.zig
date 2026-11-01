//
// The commit details task: the background task that reads one commit's details with the `log`
// wrapper and the files it changed with the `diff-tree` wrapper, for the commit details pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_diff_tree = @import("git-diff-tree.zig");
const git_interface = @import("git-interface.zig");
const git_log = @import("git-log.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the commit details task with. The field names are camelCase because
// they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const CommitDetailsTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,

    //
    // The hash of the commit to read.
    //
    hash: []const u8,
};

//
// The result of the commit details task: the commit and the files it changed. The field names are
// camelCase because Ziggy turns the struct into the JSON the frontend reads.
//
pub const CommitDetails = struct {
    //
    // The commit's details.
    //
    commit: git_log.Commit,

    //
    // The files the commit changed, in the order git lists them.
    //
    changedFiles: []const git_diff_tree.ChangedFile,
};

//
// The type of a commit details task handler, as Ziggy calls it.
//
pub const CommitDetailsTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: CommitDetailsTaskRequest,
) anyerror!CommitDetails;

//
// Makes the commit details task handler that runs Git with `run_git`. Ziggy passes a task handler
// only its standard arguments, so the Git interface function is chosen when the handler is made,
// as for the commits task.
//
pub fn commit_details_task_handler(
    comptime run_git: git_interface.RunGit,
) CommitDetailsTaskHandler {
    return struct {
        //
        // Reads the commit and its changed files, in the task's arena.
        //
        fn commit_details_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: CommitDetailsTaskRequest,
        ) anyerror!CommitDetails {
            _ = timers;
            assert(context.task_id.len > 0);

            const commit = try git_log.read_commit(io, services.log, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .hash = payload.hash,
            });
            const changed_files = try git_diff_tree.read_changed_files(
                io,
                services.log,
                allocator,
                run_git,
                .{
                    .repo_path = payload.repoPath,
                    .hash = payload.hash,
                },
            );
            assert(commit.hash.len > 0);
            return .{
                .commit = commit,
                .changedFiles = changed_files,
            };
        }
    }.commit_details_task_handler_run;
}
