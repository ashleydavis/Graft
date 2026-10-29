//
// The text the frontend is given for an error a task or message handler of Graft's returned, in
// place of the error's bare name.
//

const std = @import("std");

const assert = std.debug.assert;

//
// Describes an error of Graft's own: what went wrong and what to do. Ziggy calls it for every
// error a handler returns. It returns null for an error Graft has no description of, and Ziggy
// then uses the error's name.
//
pub fn describe_error(err: anyerror) ?[]const u8 {
    assert(@errorName(err).len > 0);
    if (err == error.GitLogFailed) {
        return "Running git log failed, so the commits could not be read. Check that the repo" ++
            " exists and has at least one commit. What git said is in Graft's log.";
    }
    if (err == error.UnexpectedGitLogOutput) {
        return "Git log wrote output Graft could not read, so the commits could not be read. " ++
            "Check that the git on PATH is a standard git.";
    }
    if (err == error.InvalidPageSize) {
        return "The commits were asked for with a page size of 0. Ask for at least one commit.";
    }
    if (err == error.InvalidCommitHash) {
        return "A commit was asked for by a hash that is not hexadecimal. Give the hash of a" ++
            " commit.";
    }
    if (err == error.CommitReadFailed) {
        return "Running git log failed, so the commit's details could not be read. Check that" ++
            " the repo has the commit. What git said is in Graft's log.";
    }
    if (err == error.GitDiffTreeFailed) {
        return "Running git diff-tree failed, so the commit's changes could not be read. Check" ++
            " that the repo has the commit. What git said is in Graft's log.";
    }
    if (err == error.UnexpectedGitDiffTreeOutput) {
        return "Git diff-tree wrote output Graft could not read, so the commit's changed files" ++
            " could not be read. Check that the git on PATH is a standard git.";
    }
    if (err == error.InvalidFilePath) {
        return "A file's diff was asked for with an empty path. Give the path of a file the" ++
            " commit changed.";
    }
    return null;
}
