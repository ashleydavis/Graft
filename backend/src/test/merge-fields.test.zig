//
// Tests merge_fields, which joins the struct literals Graft's features declare their messages and
// tasks in. It checks the merged struct holds every field of every part with the part's value, in
// the order of the parts, and that merging no parts or empty parts gives a struct with no fields.
//

const std = @import("std");
const merge_fields = @import("../lib/merge-fields.zig");

test "the merged struct holds every field of every part with its value, in order" {
    const merged = merge_fields.merge_fields(.{
        .{
            .first = 1,
            .second = "two",
        },
        .{
            .third = true,
        },
    });
    const fields = @typeInfo(@TypeOf(merged)).@"struct".fields;
    try std.testing.expectEqual(3, fields.len);
    try std.testing.expectEqualStrings("first", fields[0].name);
    try std.testing.expectEqualStrings("second", fields[1].name);
    try std.testing.expectEqualStrings("third", fields[2].name);
    try std.testing.expectEqual(1, merged.first);
    try std.testing.expectEqualStrings("two", merged.second);
    try std.testing.expect(merged.third);
}

test "merging a part holding a function keeps the function" {
    const functions = struct {
        //
        // Returns twice the number, so the test can call the function the merged struct holds.
        //
        fn double(number: u32) u32 {
            return number * 2;
        }
    };
    const merged = merge_fields.merge_fields(.{
        .{
            .double = functions.double,
        },
    });
    try std.testing.expectEqual(@as(u32, 6), merged.double(3));
}

test "merging no parts or empty parts gives a struct with no fields" {
    const no_parts = merge_fields.merge_fields(.{});
    try std.testing.expectEqual(0, @typeInfo(@TypeOf(no_parts)).@"struct".fields.len);
    const empty_parts = merge_fields.merge_fields(.{
        .{},
        .{},
    });
    try std.testing.expectEqual(0, @typeInfo(@TypeOf(empty_parts)).@"struct".fields.len);
}
