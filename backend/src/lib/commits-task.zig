//
// The commits task: the background task that reads a page of a repo's commits with the `log`
// wrapper for the repo explorer's commit pane and branch pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_branch = @import("git-branch.zig");
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

    //
    // The name of the local branch whose commits the branch pane reads, on every page. The frontend
    // sends null or leaves it out for the commit pane, so it defaults to null.
    //
    branch: ?[]const u8 = null,
};

//
// Where a later page starts, as the frontend sends it: how many commits the commit pane has read
// so far. The field names are camelCase for the same reason as `CommitsTaskRequest`'s.
//
pub const CommitsTaskStart = struct {
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
        // Reads the page of commits the payload names, in the task's arena. A branch's name
        // comes from the frontend, so the handler first reads the repo's branches and passes the
        // name to git only when git listed it.
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
                    .skip_count = payload_start.skipCount,
                };
            }
            if (payload.branch) |branch| {
                const branches = try git_branch.read_branches(
                    io,
                    services,
                    allocator,
                    run_git,
                    payload.repoPath,
                );
                if (!git_branch.is_listed_branch(branches, branch)) {
                    services.fail_with("The commits of a branch the repo does not have " ++
                        "were asked for. The branch may have been deleted or renamed, so close " ++
                        "the branch's pane and open the repo explorer again.");
                    return error.UnlistedBranch;
                }
                assert(branch.len > 0);
            }
            const page = try git_log.read_log_page(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .page_size = payload.pageSize,
                .start = start,
                .branch = payload.branch,
            });
            assert(page.commits.len <= payload.pageSize);
            return page;
        }
    }.commits_task_handler_run;
}
