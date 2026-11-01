//
// The commits task: the background task that reads a page of a repo's commits with the `log`
// wrapper for the commits page.
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
    // The hash of the last commit of the previous page. The frontend leaves it out for the first
    // page, so it defaults to null.
    //
    afterHash: ?[]const u8 = null,
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

            const page = try git_log.read_log_page(io, services.log, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .page_size = payload.pageSize,
                .after_hash = payload.afterHash,
            });
            assert(page.commits.len <= payload.pageSize);
            return page;
        }
    }.commits_task_handler_run;
}
