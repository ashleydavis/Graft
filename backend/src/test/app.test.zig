//
// Tests Graft's declaration to Ziggy: the app registers every feature's messages and tasks. It
// checks the pick-repo-folder and zoom messages and the repo explorer's, the changes pane's and
// open-repo's tasks are registered, each found by its name, so a feature that adds a message or a
// task leaves these tests as they are.
//

const std = @import("std");
const app = @import("graft-backend");

//
// Returns true when the app registers a message handler of the name.
//
fn has_message(name: []const u8) bool {
    for (app.app.messages) |entry| {
        if (std.mem.eql(u8, entry.name, name)) {
            return true;
        }
    }
    return false;
}

//
// Returns true when the app registers a task type of the name.
//
fn has_task(name: []const u8) bool {
    for (app.app.tasks) |entry| {
        if (std.mem.eql(u8, entry.name, name)) {
            return true;
        }
    }
    return false;
}

test "the app registers the open-repo and zoom messages" {
    try std.testing.expect(has_message("pick-repo-folder"));
    try std.testing.expect(has_message("zoom"));
}

test "the app registers the repo explorer's and open-repo's tasks" {
    try std.testing.expect(has_task("commits"));
    try std.testing.expect(has_task("commit-details"));
    try std.testing.expect(has_task("file-diff"));
    try std.testing.expect(has_task("tags"));
    try std.testing.expect(has_task("tag-details"));
    try std.testing.expect(has_task("pick-repo-folder"));
}

test "the app registers the changes pane's tasks" {
    try std.testing.expect(has_task("working-changes"));
    try std.testing.expect(has_task("working-file-diff"));
    try std.testing.expect(has_task("stage-file"));
    try std.testing.expect(has_task("unstage-file"));
    try std.testing.expect(has_task("commit"));
}
