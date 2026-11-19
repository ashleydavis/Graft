//
// The `log` wrapper: reads a repo's commits through the Git interface function and parses them,
// one page at a time or one commit by its hash.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// The separator git writes between the fields of a commit, from `%x1f` in the format. The unit
// separator is a control character, which names, emails, dates, refs and hashes leave out, so each
// one marks the end of a field.
//
const field_separator: u8 = 0x1f;

//
// The fields the format asks git for, in the order git writes them: the hash, the parent hashes,
// the refs, the author's name, email and date, the committer's name, email and date, the title and
// the description. The description is last because it is the one field that can hold any text,
// so the record's last field is whatever is left.
//
const log_format = "--format=%H%x1f%P%x1f%D%x1f" ++
    "%an%x1f%ae%x1f%aI%x1f" ++
    "%cn%x1f%ce%x1f%cI%x1f" ++
    "%s%x1f%b";

//
// The text the frontend is sent when a commit is asked for by a hash that is not hexadecimal. It
// is public because the diff-tree wrapper checks the hashes it is given in the same way.
//
pub const invalid_commit_hash_text = "A commit was asked for by a hash that is not hexadecimal. " ++
    "Give the hash of a commit.";

//
// The text the frontend is sent when git log writes output Graft cannot read, which both the
// commits page and the commit details can meet.
//
const unexpected_log_output_text = "Git log wrote output Graft could not read, so the commits " ++
    "could not be read. Check that the git on PATH is a standard git.";

//
// The number of fields in one commit's record, which is one for each field in `log_format`.
//
const field_count = 11;

comptime {
    assert(std.mem.count(u8, log_format, "%x1f") == field_count - 1);
}

//
// One commit, as the commits page receives it. The field names are camelCase because the struct is
// turned into the JSON the frontend reads, and the frontend's names are camelCase.
//
pub const Commit = struct {
    //
    // The commit's full hash.
    //
    hash: []const u8,

    //
    // The full hashes of its parents: empty for the first commit, two or more for a merge.
    //
    parentHashes: []const []const u8,

    //
    // The branches, tags and HEAD that point at it, as git names them ("HEAD -> main",
    // "tag: v1").
    //
    refs: []const []const u8,

    //
    // The name of who wrote the change.
    //
    authorName: []const u8,

    //
    // The email of who wrote the change.
    //
    authorEmail: []const u8,

    //
    // When the change was written, in strict ISO 8601 with the author's time zone.
    //
    authorDate: []const u8,

    //
    // The name of who made the commit.
    //
    committerName: []const u8,

    //
    // The email of who made the commit.
    //
    committerEmail: []const u8,

    //
    // When the commit was made, in strict ISO 8601 with the committer's time zone.
    //
    committerDate: []const u8,

    //
    // The first line of the commit message.
    //
    title: []const u8,

    //
    // The rest of the commit message after the title, with its trailing newlines trimmed. Empty
    // when the message is only a title.
    //
    description: []const u8,
};

//
// One page of commits, newest first.
//
pub const LogPage = struct {
    //
    // The commits on the page. Fewer than the page size means the page ends at the first commit
    // of the history.
    //
    commits: []const Commit,
};

//
// Which page of commits to read.
//
pub const LogPageRequest = struct {
    //
    // The path of the repo to read.
    //
    repo_path: []const u8,

    //
    // The most commits to read. Passed to `--max-count`.
    //
    page_size: u32,

    //
    // The hash of the last commit of the previous page, or null for the first page. The page
    // starts from that commit and skips it, so a commit made on top of the history after the
    // previous page was read does not shift the pages.
    //
    after_hash: ?[]const u8,
};

//
// Reads one page of commits from the repo by running `git log -z` through `run_git`, and parses
// git's output. Everything the page holds is allocated with the allocator and its strings point
// into git's output, so the caller passes an arena and frees the page by freeing the arena. When
// git fails, what it wrote goes to the task's log and the function returns error.GitLogFailed.
//
pub fn read_log_page(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: LogPageRequest,
) !LogPage {
    if (request.page_size == 0) {
        services.fail_with("The commits were asked for with a page size of 0. Ask for at least " ++
            "one commit.");
        return error.InvalidPageSize;
    }
    if (request.after_hash) |hash| {
        if (!is_commit_hash(hash)) {
            services.fail_with(invalid_commit_hash_text);
            return error.InvalidCommitHash;
        }
    }
    assert(request.page_size > 0);

    const max_count = try std.fmt.allocPrint(allocator, "--max-count={d}", .{request.page_size});
    const command = try read_log_page_command(allocator, request, max_count);
    const result = try run_git(io, services, allocator, command);
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git log exited with an error, so the commits could not be read.");
        services.fail_with("Running git log failed, so the commits could not be read. Check " ++
            "that the repo exists and has at least one commit. What git said is in Graft's log.");
        return error.GitLogFailed;
    }
    const commits = parse_log_output(allocator, result.stdout, request.page_size) catch |err| {
        if (err == error.UnexpectedGitLogOutput) {
            services.fail_with(unexpected_log_output_text);
        }
        return err;
    };
    assert(commits.len <= request.page_size);
    return .{
        .commits = commits,
    };
}

//
// Reads the one commit the hash names from the repo by running `git log -z --max-count=1` through
// `run_git`, for the commit details pane. Its strings point into git's output, allocated with the
// allocator, so the caller passes an arena. When git fails, what it wrote goes to the task's log
// and the function returns error.CommitReadFailed. The help panel shows the command without `-z`
// and the format, as `git log --max-count=1 <hash>`.
//
pub fn read_commit(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: CommitRequest,
) !Commit {
    if (!is_commit_hash(request.hash)) {
        services.fail_with(invalid_commit_hash_text);
        return error.InvalidCommitHash;
    }
    assert(request.repo_path.len > 0);

    const result = try run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = &.{
            "log",
            "-z",
            "--max-count=1",
            log_format,
            request.hash,
        },
        .shown_args = &.{
            "log",
            "--max-count=1",
            request.hash,
        },
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git log exited with an error, so the commit could not be read.");
        services.fail_with("Running git log failed, so the commit's details could not be " ++
            "read. Check that the repo has the commit. What git said is in Graft's log.");
        return error.CommitReadFailed;
    }
    const commits = parse_log_output(allocator, result.stdout, 1) catch |err| {
        if (err == error.UnexpectedGitLogOutput) {
            services.fail_with(unexpected_log_output_text);
        }
        return err;
    };
    if (commits.len != 1) {
        services.fail_with(unexpected_log_output_text);
        return error.UnexpectedGitLogOutput;
    }
    assert(commits.len == 1);
    return commits[0];
}

//
// Which commit to read: the repo and the commit's hash, in a struct because both are text and
// could be mixed up.
//
pub const CommitRequest = struct {
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
// The command `read_log_page` runs: the first page starts from HEAD, and a later page starts from
// the last commit of the previous page and skips it. The help panel shows it without `-z` and the
// format, as `git log --max-count=<page size>`, which lists the same commits in git's own layout.
//
pub fn read_log_page_command(
    allocator: std.mem.Allocator,
    request: LogPageRequest,
    max_count: []const u8,
) !git_interface.GitCommand {
    assert(request.repo_path.len > 0);
    assert(std.mem.startsWith(u8, max_count, "--max-count="));

    const first_page_args = [_][]const u8{
        "log",
        "-z",
        max_count,
        log_format,
    };
    const first_page_shown_args = [_][]const u8{
        "log",
        max_count,
    };
    if (request.after_hash) |hash| {
        const later_page_args = [_][]const u8{
            "--skip=1",
            hash,
        };
        return .{
            .repo_path = request.repo_path,
            .args = try allocator.dupe([]const u8, &(first_page_args ++ later_page_args)),
            .shown_args = try allocator.dupe(
                []const u8,
                &(first_page_shown_args ++ later_page_args),
            ),
        };
    } else {
        return .{
            .repo_path = request.repo_path,
            .args = try allocator.dupe([]const u8, &first_page_args),
            .shown_args = try allocator.dupe([]const u8, &first_page_shown_args),
        };
    }
}

//
// Whether the text is a full or shortened commit hash: hexadecimal digits only. Checked before the
// hash is passed to git, so git reads text from the frontend only as a commit.
//
pub fn is_commit_hash(text: []const u8) bool {
    if (text.len == 0) {
        return false;
    }
    for (text) |character| {
        if (!std.ascii.isHex(character)) {
            return false;
        }
    }
    assert(text.len > 0);
    assert(text[0] != '-');
    return true;
}

//
// Parses the output of `git log -z` in `log_format` into commits. Git ends every commit's record
// with a NUL, so the output is the records one after another, ending with the last record's NUL.
//
pub fn parse_log_output(
    allocator: std.mem.Allocator,
    output: []const u8,
    page_size: u32,
) ![]const Commit {
    const record_count = std.mem.count(u8, output, &.{0});
    if (record_count > page_size) {
        return error.UnexpectedGitLogOutput;
    }
    if (output.len > 0) {
        if (output[output.len - 1] != 0) {
            return error.UnexpectedGitLogOutput;
        }
    }

    const commits = try allocator.alloc(Commit, record_count);
    var records = std.mem.splitScalar(u8, output, 0);
    for (commits) |*commit| {
        commit.* = try parse_commit(allocator, records.next().?);
    }
    assert(records.rest().len == 0);
    assert(commits.len == record_count);
    return commits;
}

//
// Parses one commit's record: its fields split by the unit separator, in the order of
// `log_format`.
//
pub fn parse_commit(allocator: std.mem.Allocator, record: []const u8) !Commit {
    var fields: [field_count][]const u8 = undefined;
    var parts = std.mem.splitScalar(u8, record, field_separator);
    for (fields[0 .. field_count - 1]) |*field| {
        field.* = parts.next() orelse return error.UnexpectedGitLogOutput;
    }
    if (parts.index == null) {
        return error.UnexpectedGitLogOutput;
    }
    fields[field_count - 1] = parts.rest();
    if (!is_commit_hash(fields[0])) {
        return error.UnexpectedGitLogOutput;
    }
    assert(fields[0].len > 0);

    const description = std.mem.trimEnd(u8, fields[10], "\n");
    assert(!std.mem.endsWith(u8, description, "\n"));
    return .{
        .hash = fields[0],
        .parentHashes = try split_list(allocator, .{
            .text = fields[1],
            .separator = " ",
        }),
        .refs = try split_list(allocator, .{
            .text = fields[2],
            .separator = ", ",
        }),
        .authorName = fields[3],
        .authorEmail = fields[4],
        .authorDate = fields[5],
        .committerName = fields[6],
        .committerEmail = fields[7],
        .committerDate = fields[8],
        .title = fields[9],
        .description = description,
    };
}

//
// What `split_list` splits and where, in a struct because both are text and could be mixed up.
//
pub const SplitListOptions = struct {
    //
    // The line git wrote.
    //
    text: []const u8,

    //
    // What git writes between the items.
    //
    separator: []const u8,
};

//
// Splits a list git writes on one line, such as the parent hashes or the refs, into its items. An
// empty line is an empty list.
//
pub fn split_list(allocator: std.mem.Allocator, options: SplitListOptions) ![]const []const u8 {
    assert(options.separator.len > 0);
    if (options.text.len == 0) {
        return &.{};
    }

    const item_count = std.mem.count(u8, options.text, options.separator) + 1;
    const items = try allocator.alloc([]const u8, item_count);
    var parts = std.mem.splitSequence(u8, options.text, options.separator);
    for (items) |*item| {
        item.* = parts.next().?;
    }
    assert(parts.next() == null);
    return items;
}
