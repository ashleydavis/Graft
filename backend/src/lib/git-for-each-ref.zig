//
// The `for-each-ref` wrapper: reads a repo's tags through the Git interface function and parses
// them, as the list of their names for the repo details pane and as one tag's details for the tag
// pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_log = @import("git-log.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// The separator git writes between the fields of a tag, from `%1f` in the format, which is how
// for-each-ref writes a byte by its hex code. The unit separator is a control character, which
// ref names, hashes, names, emails and dates leave out, so each one marks the end of a field.
//
const field_separator: u8 = 0x1f;

//
// The fields the details format reads from git, in the order git writes them: the tag's name, the
// type of the object its ref points at ("tag" for an annotated tag, "commit" for a lightweight
// one), that object's hash, the hash of the object an annotated tag points at, the subject of the
// object the ref points at, the subject of the object an annotated tag points at, the tagger's
// name, email and date, then the body of the tag's message. The body is last because it is the
// one field that can hold any text, so the record's last field is whatever is left. `%00` ends
// the record with a NUL, so the parser finds the record's end even when the body ends in
// newlines.
//
const tag_format = "--format=%(refname:strip=2)%1f%(objecttype)%1f%(objectname)%1f" ++
    "%(*objectname)%1f%(subject)%1f%(*subject)%1f" ++
    "%(taggername)%1f%(taggeremail:trim)%1f%(taggerdate:iso-strict)%1f" ++
    "%(contents:body)%00";

//
// The number of fields in one tag's record, which is one for each field in `tag_format`.
//
const field_count = 10;

comptime {
    assert(std.mem.count(u8, tag_format, "%1f") == field_count - 1);
}

//
// The text the frontend is sent when git for-each-ref writes output Graft cannot read, which the
// repo details pane and the tag pane can both meet.
//
const unexpected_output_text = "Git for-each-ref wrote output Graft could not read, so the " ++
    "tags could not be read. Check that the git on PATH is a standard git.";

//
// What an annotated tag holds beyond the commit it points at: who made it, when and its message.
// The field names are camelCase because the struct is turned into the JSON the frontend reads.
//
pub const TagAnnotation = struct {
    //
    // The name of who made the tag.
    //
    taggerName: []const u8,

    //
    // The email of who made the tag.
    //
    taggerEmail: []const u8,

    //
    // When the tag was made, in strict ISO 8601 with the tagger's time zone.
    //
    taggerDate: []const u8,

    //
    // The first line of the tag's message.
    //
    title: []const u8,

    //
    // The rest of the tag's message after the title, with its trailing newlines trimmed. Empty
    // when the message is only a title.
    //
    description: []const u8,
};

//
// One tag, as the tag pane receives it. The field names are camelCase for the same reason as
// `TagAnnotation`'s.
//
pub const Tag = struct {
    //
    // The tag's name, as in "v1.0".
    //
    name: []const u8,

    //
    // The full hash of the commit the tag points at.
    //
    commitHash: []const u8,

    //
    // The first line of that commit's message.
    //
    commitTitle: []const u8,

    //
    // The tagger, date and message of an annotated tag, or null for a lightweight tag, which has
    // none of them. Ziggy leaves a null field out of the JSON the frontend reads.
    //
    annotation: ?TagAnnotation,
};

//
// Which tag to read: the repo and the tag's name, in a struct because both are text and could be
// mixed up.
//
pub const TagRequest = struct {
    //
    // The path of the repo to read.
    //
    repo_path: []const u8,

    //
    // The tag's name, which the caller has checked is one `read_tag_names` listed.
    //
    name: []const u8,
};

//
// Reads the names of the repo's tags by running `git for-each-ref --sort=refname
// --format=%(refname:strip=2) refs/tags` through `run_git`, one name a line, sorted by name. The
// names point into git's output, allocated with the allocator, so the caller passes an arena. When
// git fails, what it wrote goes to the task's log and the function returns error.GitTagsFailed.
//
pub fn read_tag_names(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    repo_path: []const u8,
) ![]const []const u8 {
    if (repo_path.len == 0) {
        services.fail_with(git_log.empty_repo_path_text);
        return error.InvalidRepoPath;
    }
    assert(repo_path.len > 0);

    const args: []const []const u8 = &.{
        "for-each-ref",
        "--sort=refname",
        "--format=%(refname:strip=2)",
        "refs/tags",
    };
    const result = try run_git(io, services, allocator, .{
        .repo_path = repo_path,
        .args = args,
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git for-each-ref exited with an error, so the tags could not be read.");
        services.fail_with("Running git for-each-ref failed, so the repo's tags could not be " ++
            "read. Check that the repo exists. What git wrote is in Graft's log.");
        return error.GitTagsFailed;
    }
    const names = parse_tag_names(allocator, result.stdout) catch |err| {
        if (err == error.UnexpectedGitTagOutput) {
            services.fail_with(unexpected_output_text);
        }
        return err;
    };
    assert(names.len <= result.stdout.len);
    return names;
}

//
// Parses the output of `read_tag_names`'s command into the names: git ends every name with a
// newline, so the output is the names one after another, each with its newline. A repo with no
// tags writes nothing, which is no names.
//
pub fn parse_tag_names(allocator: std.mem.Allocator, output: []const u8) ![]const []const u8 {
    if (output.len == 0) {
        return &.{};
    }
    if (output[output.len - 1] != '\n') {
        return error.UnexpectedGitTagOutput;
    }
    const lines = output[0 .. output.len - 1];
    const name_count = std.mem.count(u8, lines, "\n") + 1;
    const names = try allocator.alloc([]const u8, name_count);
    var parts = std.mem.splitScalar(u8, lines, '\n');
    for (names) |*name| {
        name.* = parts.next().?;
        if (name.len == 0) {
            return error.UnexpectedGitTagOutput;
        }
    }
    assert(parts.next() == null);
    assert(names.len == name_count);
    return names;
}

//
// Checks whether the name is one of the names `read_tag_names` listed. A task checks the name the
// frontend sends with it before passing the name to git, so git reads only a tag it listed.
//
pub fn is_listed_tag(names: []const []const u8, name: []const u8) bool {
    for (names) |listed_name| {
        if (std.mem.eql(u8, listed_name, name)) {
            assert(name.len > 0);
            return true;
        }
    }
    return false;
}

//
// Reads one tag's details by running the command `read_tag_command` builds through `run_git`, for
// the tag pane. Its strings point into git's output, allocated with the allocator, so the caller
// passes an arena. When git fails, what it wrote goes to the task's log and the function returns
// error.GitTagFailed.
//
pub fn read_tag(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: TagRequest,
) !Tag {
    assert(request.repo_path.len > 0);
    assert(request.name.len > 0);

    const command = try read_tag_command(allocator, request);
    const result = try run_git(io, services, allocator, command);
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git for-each-ref exited with an error, so the tag could not be read.");
        services.fail_with("Running git for-each-ref failed, so the tag's details could not " ++
            "be read. Check that the repo still has the tag. What git wrote is in Graft's log.");
        return error.GitTagFailed;
    }
    const tag = parse_tag_output(result.stdout) catch |err| {
        services.fail_with(unexpected_output_text);
        return err;
    };
    if (!std.mem.eql(u8, tag.name, request.name)) {
        services.fail_with(unexpected_output_text);
        return error.UnexpectedGitTagOutput;
    }
    assert(tag.commitHash.len > 0);
    return tag;
}

//
// Builds the command `read_tag` runs: `git for-each-ref` with the details format and the tag's
// full ref name, `refs/tags/<name>`, which git matches only to that tag. The ref name starts with
// `refs/`, so git never reads it as an option. The help panel shows it without the format, as
// `git for-each-ref refs/tags/<name>`, which lists the tag in git's own layout. The arguments are
// allocated with the allocator.
//
pub fn read_tag_command(
    allocator: std.mem.Allocator,
    request: TagRequest,
) !git_interface.GitCommand {
    assert(request.repo_path.len > 0);
    assert(request.name.len > 0);

    const ref_name = try std.fmt.allocPrint(allocator, "refs/tags/{s}", .{request.name});
    const args = [_][]const u8{
        "for-each-ref",
        tag_format,
        ref_name,
    };
    assert(std.mem.startsWith(u8, ref_name, "refs/tags/"));
    return .{
        .repo_path = request.repo_path,
        .args = try allocator.dupe([]const u8, &args),
    };
}

//
// Parses the output of `read_tag`'s command into the tag: one record in `tag_format`, which git
// ends with the format's NUL and its own newline. An annotated tag's ref points at a tag object,
// so its commit is the object that object points at. A lightweight tag's ref points at the commit
// itself and its annotation is null. The tag's strings point into the output.
//
pub fn parse_tag_output(output: []const u8) !Tag {
    if (!std.mem.endsWith(u8, output, "\x00\n")) {
        return error.UnexpectedGitTagOutput;
    }
    const record = output[0 .. output.len - 2];
    if (std.mem.indexOfScalar(u8, record, 0) != null) {
        return error.UnexpectedGitTagOutput;
    }

    var fields: [field_count][]const u8 = undefined;
    var parts = std.mem.splitScalar(u8, record, field_separator);
    for (fields[0 .. field_count - 1]) |*field| {
        field.* = parts.next() orelse return error.UnexpectedGitTagOutput;
    }
    if (parts.index == null) {
        return error.UnexpectedGitTagOutput;
    }
    fields[field_count - 1] = parts.rest();
    if (fields[0].len == 0) {
        return error.UnexpectedGitTagOutput;
    }

    if (std.mem.eql(u8, fields[1], "tag")) {
        if (!git_log.is_commit_hash(fields[3])) {
            return error.UnexpectedGitTagOutput;
        }
        const description = std.mem.trimEnd(u8, fields[9], "\n");
        assert(!std.mem.endsWith(u8, description, "\n"));
        return .{
            .name = fields[0],
            .commitHash = fields[3],
            .commitTitle = fields[5],
            .annotation = .{
                .taggerName = fields[6],
                .taggerEmail = fields[7],
                .taggerDate = fields[8],
                .title = fields[4],
                .description = description,
            },
        };
    }
    if (!git_log.is_commit_hash(fields[2])) {
        return error.UnexpectedGitTagOutput;
    }
    assert(fields[2].len > 0);
    return .{
        .name = fields[0],
        .commitHash = fields[2],
        .commitTitle = fields[4],
        .annotation = null,
    };
}
