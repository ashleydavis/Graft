//
// The commits task: the background task that reads a page of a repo's commits with the `log`
// wrapper for the repo explorer's commit pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_log = @import("git-log.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the commits task with. The field names are camelCase because they
// are the JSON the frontend sends, and the frontend's names are camelCase.
//
pub const CommitsTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,

    //
    // The most commits to read.
    //
    pageSize: u32,

    //
    // Where a later page starts. The frontend sends null or leaves it out for the first page, so
    // it defaults to null.
    //
    start: ?CommitsTaskStart = null,
};

//
// Where a later page starts, as the frontend sends it: the start commit's hash and how many
// commits the commit pane has read so far. The field names are camelCase for the same reason as
// `CommitsTaskRequest`'s.
//
pub const CommitsTaskStart = struct {
    //
    // The hash of the first page's first commit.
    //
    hash: []const u8,

    //
    // How many commits the commit pane has read so far.
    //
    skipCount: u32,
};

//
// The type of a commits task handler, as Ziggy calls it: its result is the page, which Ziggy turns
// into the JSON of the task's result.
//
pub const CommitsTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: CommitsTaskRequest,
) anyerror!git_log.LogPage;

//
// Makes the commits task handler that runs Git with `run_git`. Ziggy passes a task handler only
// its standard arguments, so the Git interface function is chosen when the handler is made: the
// app registers the one made with the real Git interface function and a unit test registers one
// made with a mock.
//
pub fn commits_task_handler(comptime run_git: git_interface.RunGit) CommitsTaskHandler {
    return struct {
        //
        // Reads the page of commits the payload asks for, in the task's arena.
        //
        fn commits_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: CommitsTaskRequest,
        ) anyerror!git_log.LogPage {
            _ = timers;
            assert(context.task_id.len > 0);

            var start: ?git_log.LogPageStart = null;
            if (payload.start) |payload_start| {
                start = .{
                    .hash = payload_start.hash,
                    .skip_count = payload_start.skipCount,
                };
            }
            const page = try git_log.read_log_page(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .page_size = payload.pageSize,
                .start = start,
            });
            assert(page.commits.len <= payload.pageSize);
            return page;
        }
    }.commits_task_handler_run;
}
