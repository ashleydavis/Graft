//
// Tests the `for-each-ref` wrapper with the mock of the Git interface function in place of `git`:
// the arguments it starts git with for the tag names and for one tag, how it parses git's output
// for a lightweight tag and for an annotated tag, and every way the request or git's output can be
// refused.
//

const std = @import("std");
const git_for_each_ref = @import("../lib/git-for-each-ref.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;

//
// The format argument the details command must pass, spelled out here so a change to it fails the
// tests.
//
const tag_format_arg = "--format=%(refname:strip=2)%1f%(objecttype)%1f%(objectname)%1f" ++
    "%(*objectname)%1f%(subject)%1f%(*subject)%1f" ++
    "%(taggername)%1f%(taggeremail:trim)%1f%(taggerdate:iso-strict)%1f" ++
    "%(contents:body)%00";

//
// The hash of the commit the tags point at and of the annotated tag's own tag object.
//
const commit_hash = "1111111111111111111111111111111111111111";
const tag_object_hash = "2222222222222222222222222222222222222222";

//
// The arguments of the tag names command for the repo at "repo".
//
const names_args: []const []const u8 = &.{
    "-C",
    "repo",
    "for-each-ref",
    "--sort=refname",
    "--format=%(refname:strip=2)",
    "refs/tags",
};

//
// The arguments the help panel is given to show for the tag names command, which has no hex coded
// separators, so it shows in full.
//
const names_shown_args: []const []const u8 = &.{
    "for-each-ref",
    "--sort=refname",
    "--format=%(refname:strip=2)",
    "refs/tags",
};

//
// A mock that returns, for the tag names command, what git returns when it exits with the code
// and output.
//
fn mock_names(comptime exit_code: ?u8, comptime output: []const u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = names_args,
        .expected_shown_args = names_shown_args,
        .exit_code = exit_code,
        .stdout = output,
        .stderr = "fatal: something went wrong\n",
        .start_error = null,
    });
}

//
// A mock that returns, for the details command for the tag named v1.0, what git returns when
// it exits with the code and output.
//
fn mock_tag(comptime exit_code: ?u8, comptime output: []const u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "repo",
            "for-each-ref",
            tag_format_arg,
            "refs/tags/v1.0",
        },
        .expected_shown_args = &.{
            "for-each-ref",
            "refs/tags/v1.0",
        },
        .exit_code = exit_code,
        .stdout = output,
        .stderr = "fatal: something went wrong\n",
        .start_error = null,
    });
}

//
// What the details command writes for the lightweight tag v1.0, whose ref points at the commit.
//
const lightweight_output = "v1.0\x1fcommit\x1f" ++ commit_hash ++ "\x1f\x1fAdd the notes\x1f" ++
    "\x1f\x1f\x1f\x1fThe commit's body.\n\x00\n";

//
// What the details command writes for the annotated tag v1.0, whose ref points at a tag object
// that points at the commit, with a message of a title and a body of two lines.
//
const annotated_output = "v1.0\x1ftag\x1f" ++ tag_object_hash ++ "\x1f" ++ commit_hash ++
    "\x1fRelease one\x1fAdd the notes\x1fTia Tagger\x1ftia@example.com\x1f" ++
    "2026-01-02T03:04:05+10:00\x1fThe first line.\nThe second line.\n\x00\n";

//
// The request for the tag v1.0 of the repo at "repo".
//
const tag_request: git_for_each_ref.TagRequest = .{
    .repo_path = "repo",
    .name = "v1.0",
};

test "read_tag_names lists the tag names git writes, sorted by name, from refs/tags" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const names = try git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_names(0, "v1.0\nv2.0\nrelease/one\n"),
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 3), names.len);
    try std.testing.expectEqualStrings("v1.0", names[0]);
    try std.testing.expectEqualStrings("v2.0", names[1]);
    try std.testing.expectEqualStrings("release/one", names[2]);
}

test "read_tag_names gives no names for a repo with no tags" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const names = try git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_names(0, ""),
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 0), names.len);
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "read_tag_names refuses an empty repo path without starting git" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .expected_shown_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try std.testing.expectError(error.InvalidRepoPath, git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "",
    ));
    try std.testing.expectEqualStrings(
        "The repo path is empty. Give the path of the repo to read.",
        task.failure.?,
    );
}

test "read_tag_names fails with a description of the error when git fails" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.GitTagsFailed, git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_names(128, ""),
        "repo",
    ));
    try std.testing.expectEqualStrings(
        "Running git for-each-ref failed, so the repo's tags could not be read. Check that the " ++
            "repo exists. What git wrote is in Graft's log.",
        task.failure.?,
    );
}

test "read_tag_names refuses output it cannot read" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.UnexpectedGitTagOutput, git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_names(0, "v1.0"),
        "repo",
    ));
    try std.testing.expectEqualStrings(
        "Git for-each-ref wrote output Graft could not read, so the tags could not be read. " ++
            "Check that the git on PATH is a standard git.",
        task.failure.?,
    );
}

test "read_tag_names passes on the error when git cannot be started" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = names_args,
        .expected_shown_args = names_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "repo",
    ));
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

//
// Reads two tag names with the allocator, for the allocation failure test. The names are
// allocated in an arena over the allocator, as a task's are.
//
fn read_two_names(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const names = try git_for_each_ref.read_tag_names(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_names(0, "v1.0\nv2.0\n"),
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 2), names.len);
}

test "read_tag_names frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_two_names, .{});
}

test "parse_tag_names refuses an empty line" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_names(arena.allocator(), "v1.0\n\nv2.0\n"),
    );
}

test "is_listed_tag finds only a name that is listed in full" {
    const names: []const []const u8 = &.{
        "v1.0",
        "v2.0",
    };
    try std.testing.expect(git_for_each_ref.is_listed_tag(names, "v1.0"));
    try std.testing.expect(git_for_each_ref.is_listed_tag(names, "v2.0"));
    try std.testing.expect(!git_for_each_ref.is_listed_tag(names, "v1"));
    try std.testing.expect(!git_for_each_ref.is_listed_tag(names, "--all"));
    try std.testing.expect(!git_for_each_ref.is_listed_tag(names, ""));
    try std.testing.expect(!git_for_each_ref.is_listed_tag(&.{}, "v1.0"));
}

test "read_tag reads a lightweight tag as its commit with no annotation" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const tag = try git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(0, lightweight_output),
        tag_request,
    );
    try std.testing.expectEqualStrings("v1.0", tag.name);
    try std.testing.expectEqualStrings(commit_hash, tag.commitHash);
    try std.testing.expectEqualStrings("Add the notes", tag.commitTitle);
    try std.testing.expectEqual(@as(?git_for_each_ref.TagAnnotation, null), tag.annotation);
}

test "read_tag reads an annotated tag's commit, tagger, date and message" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const tag = try git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(0, annotated_output),
        tag_request,
    );
    try std.testing.expectEqualStrings("v1.0", tag.name);
    try std.testing.expectEqualStrings(commit_hash, tag.commitHash);
    try std.testing.expectEqualStrings("Add the notes", tag.commitTitle);
    const annotation = tag.annotation.?;
    try std.testing.expectEqualStrings("Tia Tagger", annotation.taggerName);
    try std.testing.expectEqualStrings("tia@example.com", annotation.taggerEmail);
    try std.testing.expectEqualStrings("2026-01-02T03:04:05+10:00", annotation.taggerDate);
    try std.testing.expectEqualStrings("Release one", annotation.title);
    try std.testing.expectEqualStrings("The first line.\nThe second line.", annotation.description);
}

test "read_tag fails with a description of the error when git fails" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.GitTagFailed, git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(1, ""),
        tag_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git for-each-ref failed, so the tag's details could not be read. Check that " ++
            "the repo still has the tag. What git wrote is in Graft's log.",
        task.failure.?,
    );
}

test "read_tag refuses output it cannot read" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.UnexpectedGitTagOutput, git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(0, ""),
        tag_request,
    ));
    try std.testing.expectEqualStrings(
        "Git for-each-ref wrote output Graft could not read, so the tags could not be read. " ++
            "Check that the git on PATH is a standard git.",
        task.failure.?,
    );
}

test "read_tag refuses output for a tag of another name" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const other_output = "v2.0\x1fcommit\x1f" ++ commit_hash ++ "\x1f\x1fAdd the notes\x1f" ++
        "\x1f\x1f\x1f\x1f\x00\n";
    try std.testing.expectError(error.UnexpectedGitTagOutput, git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(0, other_output),
        tag_request,
    ));
    try std.testing.expect(task.failure != null);
}

//
// Reads the annotated tag with the allocator, for the allocation failure test of the ref name and
// the arguments `read_tag_command` allocates.
//
fn read_annotated_tag(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const tag = try git_for_each_ref.read_tag(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock_tag(0, annotated_output),
        tag_request,
    );
    try std.testing.expect(tag.annotation != null);
}

test "read_tag frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_annotated_tag, .{});
}

test "parse_tag_output refuses a record that does not end with the NUL and newline" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output(lightweight_output[0 .. lightweight_output.len - 1]),
    );
}

test "parse_tag_output refuses more than one record" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output(lightweight_output ++ lightweight_output),
    );
}

test "parse_tag_output refuses a record with too few fields" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output("v1.0\x1fcommit\x1f" ++ commit_hash ++ "\x00\n"),
    );
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output("v1.0\x1fcommit\x1f" ++ commit_hash ++
            "\x1f\x1f\x1f\x1f\x1f\x1f\x00\n"),
    );
}

test "parse_tag_output refuses a record with no name" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output("\x1fcommit\x1f" ++ commit_hash ++
            "\x1f\x1f\x1f\x1f\x1f\x1f\x1f\x00\n"),
    );
}

test "parse_tag_output refuses a lightweight tag whose object hash is not hexadecimal" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output("v1.0\x1fcommit\x1fnot-a-hash\x1f\x1f\x1f" ++
            "\x1f\x1f\x1f\x1f\x00\n"),
    );
}

test "parse_tag_output refuses an annotated tag whose commit hash is not hexadecimal" {
    try std.testing.expectError(
        error.UnexpectedGitTagOutput,
        git_for_each_ref.parse_tag_output("v1.0\x1ftag\x1f" ++ tag_object_hash ++
            "\x1f\x1fRelease one\x1f\x1fTia\x1ftia@example.com\x1f2026\x1f\x00\n"),
    );
}

test "parse_tag_output keeps a separator in an annotated tag's body" {
    const output = "v1.0\x1ftag\x1f" ++ tag_object_hash ++ "\x1f" ++ commit_hash ++
        "\x1fRelease one\x1fAdd the notes\x1fTia\x1ftia@example.com\x1f2026\x1fa\x1fb\n\x00\n";
    const tag = try git_for_each_ref.parse_tag_output(output);
    try std.testing.expectEqualStrings("a\x1fb", tag.annotation.?.description);
}
