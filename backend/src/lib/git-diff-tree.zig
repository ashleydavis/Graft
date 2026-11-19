//
// The `diff-tree` wrapper: reads what one commit changed through the Git interface function, as
// the list of files it changed or as the diff of one of those files.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_log = @import("git-log.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// The text the frontend is sent when git diff-tree writes output Graft cannot read, which both
// parts of the changed files list can meet.
//
const unexpected_diff_tree_output_text = "Git diff-tree wrote output Graft could not read, so " ++
    "the commit's changed files could not be read. Check that the git on PATH is a standard git.";

//
// The text the frontend is sent when git diff-tree fails, so the commit's changes could not be
// read, for the changed files list and for a file's diff.
//
const diff_tree_failed_text = "Running git diff-tree failed, so the commit's changes could not " ++
    "be read. Check that the repo has the commit. What git said is in Graft's log.";

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

    //
    // How many lines the commit added to the file, as `git diff-tree --numstat` counts them, so
    // the commit details pane can show the size of each change. Zero for a binary file.
    //
    linesAdded: u32,

    //
    // How many lines the commit deleted from the file, counted as `linesAdded` is. Zero for a
    // binary file.
    //
    linesDeleted: u32,

    //
    // Whether git found the file binary and so counted no lines of it, so the pane shows that in
    // place of the line counts.
    //
    isBinary: bool,
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
// Reads the files the commit changed and the lines it added to and deleted from each, compared
// with its first parent, or with an empty tree for the first commit (`--root`). It runs
// `git diff-tree -r -z` through `run_git` twice: with `--name-status` for each file's status and
// with `--numstat` for its line counts, because git writes only one of the two when given both.
// git lists no files for a merge commit, as `git log` shows none. The list and its strings are
// allocated with the allocator, so the caller passes an arena. When git fails, what it wrote goes
// to the task's log and the function returns error.GitDiffTreeFailed. The help panel shows the
// command without `-z`, so git lists one file to a line.
//
pub fn read_changed_files(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: ChangedFilesRequest,
) ![]const ChangedFile {
    if (!git_log.is_commit_hash(request.hash)) {
        services.fail_with(git_log.invalid_commit_hash_text);
        return error.InvalidCommitHash;
    }
    assert(request.repo_path.len > 0);

    const name_status = try read_changed_files_git(io, services, allocator, run_git, .{
        .repo_path = request.repo_path,
        .args = &.{
            "diff-tree",
            "-r",
            "-z",
            "--root",
            "--no-commit-id",
            "--name-status",
            request.hash,
        },
        .shown_args = &.{
            "diff-tree",
            "-r",
            "--root",
            "--no-commit-id",
            "--name-status",
            request.hash,
        },
    });
    const files = parse_name_status_output(allocator, name_status) catch |err| {
        if (err == error.UnexpectedGitDiffTreeOutput) {
            services.fail_with(unexpected_diff_tree_output_text);
        }
        return err;
    };
    const numstat = try read_changed_files_git(io, services, allocator, run_git, .{
        .repo_path = request.repo_path,
        .args = &.{
            "diff-tree",
            "-r",
            "-z",
            "--root",
            "--no-commit-id",
            "--numstat",
            request.hash,
        },
        .shown_args = &.{
            "diff-tree",
            "-r",
            "--root",
            "--no-commit-id",
            "--numstat",
            request.hash,
        },
    });
    parse_numstat_output(files, numstat) catch |err| {
        if (err == error.UnexpectedGitDiffTreeOutput) {
            services.fail_with(unexpected_diff_tree_output_text);
        }
        return err;
    };
    assert(files.len <= name_status.len);
    assert(files.len <= numstat.len);
    return files;
}

//
// Runs one `git diff-tree` for `read_changed_files` and returns what git wrote to its standard
// output. When git fails, what it wrote goes to the task's log and the function returns
// error.GitDiffTreeFailed.
//
fn read_changed_files_git(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    command: git_interface.GitCommand,
) ![]const u8 {
    assert(command.args.len > 0);

    const result = try run_git(io, services, allocator, command);
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err(
            "git diff-tree exited with an error, so the changed files could not be read.",
        );
        services.fail_with(diff_tree_failed_text);
        return error.GitDiffTreeFailed;
    }
    assert(result.exit_code.? == 0);
    return result.stdout;
}

//
// Reads the diff of one file in the commit by running `git diff-tree -r -p` through `run_git`,
// limited to the file's path, compared as `read_changed_files` compares. The diff is git's text,
// allocated with the allocator. When git fails, what it wrote goes to the task's log and the
// function returns error.GitDiffTreeFailed. The help panel shows the same command, because Graft
// reads git's own output.
//
pub fn read_file_diff(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: FileDiffRequest,
) ![]const u8 {
    if (!git_log.is_commit_hash(request.hash)) {
        services.fail_with(git_log.invalid_commit_hash_text);
        return error.InvalidCommitHash;
    }
    if (request.path.len == 0) {
        services.fail_with("A file's diff was asked for with an empty path. Give the path of a " ++
            "file the commit changed.");
        return error.InvalidFilePath;
    }
    assert(request.repo_path.len > 0);
    assert(request.path.len > 0);

    //
    // The path follows `--`, so git reads it as a path even when it starts with a dash.
    //
    const args: []const []const u8 = &.{
        "diff-tree",
        "-r",
        "-p",
        "--root",
        "--no-commit-id",
        request.hash,
        "--",
        request.path,
    };
    const result = try run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = args,
        .shown_args = args,
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err(
            "git diff-tree exited with an error, so the file's diff could not be read.",
        );
        services.fail_with(diff_tree_failed_text);
        return error.GitDiffTreeFailed;
    }
    return result.stdout;
}

//
// Parses the output of `git diff-tree -z --name-status` into changed files. Without rename or copy
// detection git writes each file as its status then its path, each ended by a NUL, so the output
// is pairs of fields and ends with a NUL. Each file's line counts start at zero, for
// `parse_numstat_output` to fill in.
//
pub fn parse_name_status_output(
    allocator: std.mem.Allocator,
    output: []const u8,
) ![]ChangedFile {
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
            .linesAdded = 0,
            .linesDeleted = 0,
            .isBinary = false,
        };
    }
    assert(fields.rest().len == 0);
    assert(files.len * 2 == field_count);
    return files;
}

//
// Parses the output of `git diff-tree -z --numstat` into the line counts of the files
// `parse_name_status_output` read from the same commit. Without rename or copy detection git
// writes each file as the lines added, a tab, the lines deleted, a tab and its path, ended by a
// NUL, in the same order as `--name-status` lists them. A binary file's counts are each "-". The
// output must list the same files in the same order, or the counts would go to the wrong file.
//
pub fn parse_numstat_output(files: []ChangedFile, output: []const u8) !void {
    if (std.mem.count(u8, output, &.{0}) != files.len) {
        return error.UnexpectedGitDiffTreeOutput;
    }
    if (output.len > 0) {
        if (output[output.len - 1] != 0) {
            return error.UnexpectedGitDiffTreeOutput;
        }
    }

    var entries = std.mem.splitScalar(u8, output, 0);
    for (files) |*file| {
        var fields = std.mem.splitScalar(u8, entries.next().?, '\t');
        const added = fields.next().?;
        const deleted = fields.next() orelse return error.UnexpectedGitDiffTreeOutput;
        const path = fields.rest();
        if (!std.mem.eql(u8, path, file.path)) {
            return error.UnexpectedGitDiffTreeOutput;
        }
        if (std.mem.eql(u8, added, "-")) {
            if (!std.mem.eql(u8, deleted, "-")) {
                return error.UnexpectedGitDiffTreeOutput;
            }
            file.isBinary = true;
        } else {
            file.linesAdded = std.fmt.parseInt(u32, added, 10) catch {
                return error.UnexpectedGitDiffTreeOutput;
            };
            file.linesDeleted = std.fmt.parseInt(u32, deleted, 10) catch {
                return error.UnexpectedGitDiffTreeOutput;
            };
        }
        if (file.isBinary) assert(file.linesAdded == 0);
    }
    assert(entries.rest().len == 0);
}
