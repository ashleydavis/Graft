//
// The `add` and `restore --staged` wrappers: stage and unstage one whole file through the Git
// interface function, for the changes pane's stage and unstage buttons.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const repo_file_path = @import("repo-file-path.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// Which file to stage or unstage: the repo and the file's path, in a struct because both are text
// and could be mixed up.
//
pub const StageRequest = struct {
    //
    // The path of the repo the file is in.
    //
    repo_path: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,
};

//
// Stages the whole file by running `git add -- <path>` through `run_git`. git stages a new file,
// a modified file and a deleted file alike. The path follows `--`, so git reads it as a path even
// when it starts with a dash. When git fails, what it wrote goes to the task's log and the
// function returns error.GitAddFailed.
//
pub fn stage_file(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: StageRequest,
) !void {
    try check_stage_request(services, request);
    assert(request.path.len > 0);

    const args: []const []const u8 = &.{
        "add",
        "--",
        request.path,
    };
    const result = try run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = args,
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git add exited with an error, so the file was not staged.");
        services.fail_with("Running git add failed, so the file was not staged. Check that " ++
            "the file still has changes. Git's output is in Graft's log.");
        return error.GitAddFailed;
    }
    assert(result.exit_code.? == 0);
}

//
// Unstages the whole file by running `git restore --staged -- <path>` through `run_git`, the
// command `git status` prints for it. It takes the file's staged changes out of the index and
// leaves them in the working tree. When git fails, what it wrote goes to the task's log and the
// function returns error.GitRestoreFailed.
//
pub fn unstage_file(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: StageRequest,
) !void {
    try check_stage_request(services, request);
    assert(request.path.len > 0);

    const args: []const []const u8 = &.{
        "restore",
        "--staged",
        "--",
        request.path,
    };
    const result = try run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = args,
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git restore exited with an error, so the file was not unstaged.");
        services.fail_with("Running git restore failed, so the file was not unstaged. Check " ++
            "that the file still has staged changes. Git's output is in Graft's log.");
        return error.GitRestoreFailed;
    }
    assert(result.exit_code.? == 0);
}

//
// Refuses a request whose path is empty or outside the repo, so git stages and unstages files
// inside the open repo only, and sets the text the frontend is sent.
//
pub fn check_stage_request(services: TaskServices, request: StageRequest) !void {
    assert(request.repo_path.len > 0);
    if (!repo_file_path.is_repo_file_path(request.path)) {
        services.fail_with("The stage or unstage task got a path that is empty or outside the " ++
            "repo, so no file was staged or unstaged. Give the path of a changed file from the " ++
            "repo's root.");
        return error.InvalidFilePath;
    }
    assert(request.path.len > 0);
}
