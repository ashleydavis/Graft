//
// The `diff-tree` wrapper: reads what one commit changed through the Git interface function, as
// the list of files it changed or as the diff of one of those files.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_log = @import("git-log.zig");

const assert = std.debug.assert;
const ILog = ziggy.task_queue.utils.log.ILog;

//
// One file a commit changed. The field names are camelCase because the struct is turned into the
// JSON the frontend reads and the frontend's names are camelCase.
//
pub const ChangedFile = struct {
    //
    // How the commit changed the file, as git's one letter status: A (added), D (deleted),
    // M (modified) or T (its type changed).
    //
    status: []const u8,

    //
    // The file's path from the root of the repo.
    //
    path: []const u8,
};

//
// Which commit to read the changes of: the repo and the commit's hash, in a struct because both
// are text and could be mixed up.
//
pub const ChangedFilesRequest = struct {
    //
    // The path of the repo to read.
    //
    repo_path: []const u8,

    //
    // The full or shortened hash of the commit.
    //
    hash: []const u8,
};

//
// Which file's diff to read: the repo, the commit's hash and the file's path, in a struct because
// all three are text and could be mixed up.
//
pub const FileDiffRequest = struct {
    //
    // The path of the repo to read.
    //
    repo_path: []const u8,

    //
    // The full or shortened hash of the commit.
    //
    hash: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,
};

//
// Reads the files the commit changed by running `git diff-tree -r -z --name-status` through
// `run_git`, compared with its first parent, or with an empty tree for the first commit (`--root`).
// git lists no files for a merge commit, as `git log` shows none. The list and its strings are
// allocated with the allocator, so the caller passes an arena. When git fails, what it wrote goes
// to the log and the function returns error.GitDiffTreeFailed.
//
pub fn read_changed_files(
    io: std.Io,
    log: ILog,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: ChangedFilesRequest,
) ![]const ChangedFile {
    if (!git_log.is_commit_hash(request.hash)) {
        return error.InvalidCommitHash;
    }
    assert(request.repo_path.len > 0);

    const result = try run_git(io, allocator, &.{
        "-C",
        request.repo_path,
        "diff-tree",
        "-r",
        "-z",
        "--root",
        "--no-commit-id",
        "--name-status",
        request.hash,
    });
    if (result.exit_code != 0) {
        log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        log.@"error"("git diff-tree exited with an error, so the changed files could not be read.");
        return error.GitDiffTreeFailed;
    }
    const files = try parse_name_status_output(allocator, result.stdout);
    assert(files.len <= result.stdout.len);
    return files;
}

//
// Reads the diff of one file in the commit by running `git diff-tree -r -p` through `run_git`,
// limited to the file's path, compared as `read_changed_files` compares. The diff is git's text,
// allocated with the allocator. When git fails, what it wrote goes to the log and the function
// returns error.GitDiffTreeFailed.
//
pub fn read_file_diff(
    io: std.Io,
    log: ILog,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: FileDiffRequest,
) ![]const u8 {
    if (!git_log.is_commit_hash(request.hash)) {
        return error.InvalidCommitHash;
    }
    if (request.path.len == 0) {
        return error.InvalidFilePath;
    }
    assert(request.repo_path.len > 0);
    assert(request.path.len > 0);

    //
    // The path follows `--`, so git reads it as a path even when it starts with a dash.
    //
    const result = try run_git(io, allocator, &.{
        "-C",
        request.repo_path,
        "diff-tree",
        "-r",
        "-p",
        "--root",
        "--no-commit-id",
        request.hash,
        "--",
        request.path,
    });
    if (result.exit_code != 0) {
        log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        log.@"error"("git diff-tree exited with an error, so the file's diff could not be read.");
        return error.GitDiffTreeFailed;
    }
    return result.stdout;
}

//
// Parses the output of `git diff-tree -z --name-status` into changed files. Without rename or copy
// detection git writes each file as its status then its path, each ended by a NUL, so the output
// is pairs of fields and ends with a NUL.
//
pub fn parse_name_status_output(
    allocator: std.mem.Allocator,
    output: []const u8,
) ![]const ChangedFile {
    const field_count = std.mem.count(u8, output, &.{0});
    if (field_count % 2 != 0) {
        return error.UnexpectedGitDiffTreeOutput;
    }
    if (output.len > 0) {
        if (output[output.len - 1] != 0) {
            return error.UnexpectedGitDiffTreeOutput;
        }
    }

    const files = try allocator.alloc(ChangedFile, @divExact(field_count, 2));
    var fields = std.mem.splitScalar(u8, output, 0);
    for (files) |*file| {
        const status = fields.next().?;
        const path = fields.next().?;
        if (status.len != 1) {
            return error.UnexpectedGitDiffTreeOutput;
        }
        if (path.len == 0) {
            return error.UnexpectedGitDiffTreeOutput;
        }
        file.* = .{
            .status = status,
            .path = path,
        };
    }
    assert(fields.rest().len == 0);
    assert(files.len * 2 == field_count);
    return files;
}
