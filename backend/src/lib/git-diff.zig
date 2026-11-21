//
// The `diff` wrapper: reads the diff of one changed file in the working tree through the Git
// interface function, as its staged changes or its unstaged changes, for the changes pane's file
// diff.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const repo_file_path = @import("repo-file-path.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// Which changes of the file to read: what is staged, what is not staged in a file git tracks, or
// the whole of an untracked file, which git has no earlier version of.
//
pub const ChangeSide = enum {
    staged,
    unstaged,
    untracked,
};

//
// Which file's diff to read: the repo, the file's path and which of its changes, in a struct
// because the repo and the path are both text and could be mixed up.
//
pub const WorkingFileDiffRequest = struct {
    //
    // The path of the repo the file is in.
    //
    repo_path: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,

    //
    // Which of the file's changes to read.
    //
    side: ChangeSide,
};

//
// Picks which changes of a file to read from the list it is in and git's status letter there: a
// file in the staged list shows its staged changes, an untracked file (status "?") its whole text
// and any other file in the unstaged list its unstaged changes.
//
pub fn change_side(is_staged: bool, status: []const u8) ChangeSide {
    if (is_staged) {
        return .staged;
    }
    if (std.mem.eql(u8, status, "?")) {
        return .untracked;
    }
    return .unstaged;
}

//
// Reads the file's diff through `run_git`: `git diff --cached -- <path>` for its staged changes,
// `git diff -- <path>` for its unstaged changes and `git diff --no-index -- /dev/null <path>` for
// an untracked file, which shows every line of it as added. git diff --no-index exits with 1 when
// the files differ, so 1 is a success there as 0 is. The path follows `--`, so git reads it as a
// path even when it starts with a dash. The diff is git's text, allocated with the allocator. When
// git fails, what it wrote goes to the task's log and the function returns error.GitDiffFailed.
// The help panel shows the same command, because Graft reads git's own output.
//
pub fn read_working_file_diff(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: WorkingFileDiffRequest,
) ![]const u8 {
    assert(request.repo_path.len > 0);
    if (!repo_file_path.is_repo_file_path(request.path)) {
        services.fail_with("The working file diff task got a path that is empty or outside the " ++
            "repo, so no diff was read. Give the path of a changed file from the repo's root.");
        return error.InvalidFilePath;
    }
    assert(request.path.len > 0);

    const args: []const []const u8 = switch (request.side) {
        .staged => &.{
            "diff",
            "--cached",
            "--",
            request.path,
        },
        .unstaged => &.{
            "diff",
            "--",
            request.path,
        },
        .untracked => &.{
            "diff",
            "--no-index",
            "--",
            "/dev/null",
            request.path,
        },
    };
    const result = try run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = args,
        .shown_args = args,
    });
    if (!is_diff_success(request.side, result.exit_code)) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git diff exited with an error, so the file's diff could not be read.");
        services.fail_with("Running git diff failed, so the file's changes could not be read. " ++
            "Check that the file still has changes. Git's output is in Graft's log.");
        return error.GitDiffFailed;
    }
    return result.stdout;
}

//
// Whether git diff's exit code means it wrote the diff: 0 always, and 1 for an untracked file's
// `git diff --no-index`, which exits with 1 when the files differ. A null exit code, for a git that
// ended without exiting, is never a success.
//
pub fn is_diff_success(side: ChangeSide, exit_code: ?u8) bool {
    const code = exit_code orelse return false;
    if (code == 0) {
        return true;
    }
    if (side == .untracked) {
        return code == 1;
    }
    return false;
}
