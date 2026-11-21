//
// Merges the message handlers or task handlers Graft's features declare, each feature in a struct
// literal of its own, into the one struct literal ziggy.core.App takes as `.messages` or `.tasks`.
// Each feature declares its own in its file under backend/src/features/, so adding a message or a
// task edits that feature's file and app.zig lists features rather than every message and task.
//

const std = @import("std");

const assert = std.debug.assert;

//
// Makes the struct type that holds every field of every struct literal in `parts`, a tuple of
// them, each a comptime field whose value is the one its part gives, in the order of the parts and
// then of their fields. App reads a struct literal's fields by name and value, so the merged
// struct reads to it as one literal listing them all. The build fails, naming the field, when two
// parts declare the same name, so a message or a task name never has two handlers.
//
pub fn MergedFields(comptime parts: anytype) type {
    comptime {
        assert(@typeInfo(@TypeOf(parts)).@"struct".is_tuple);
        var field_count = 0;
        for (@typeInfo(@TypeOf(parts)).@"struct".fields) |part_field| {
            field_count += @typeInfo(part_field.type).@"struct".fields.len;
        }

        var names: [field_count][]const u8 = undefined;
        var types: [field_count]type = undefined;
        var attributes: [field_count]std.builtin.Type.StructField.Attributes = undefined;
        var index = 0;
        for (parts) |part| {
            for (@typeInfo(@TypeOf(part)).@"struct".fields) |field| {
                for (names[0..index]) |name| {
                    if (std.mem.eql(u8, name, field.name)) {
                        @compileError("Two of Graft's features declare \"" ++ field.name ++
                            "\". Give one of them another name.");
                    }
                }
                const value: field.type = @field(part, field.name);
                names[index] = field.name;
                types[index] = field.type;
                attributes[index] = .{
                    .@"comptime" = true,
                    .default_value_ptr = @ptrCast(&value),
                };
                index += 1;
            }
        }
        assert(index == field_count);

        const final_names = names;
        const final_types = types;
        const final_attributes = attributes;
        return @Struct(.auto, null, &final_names, &final_types, &final_attributes);
    }
}

//
// Merges the struct literals in `parts`, a tuple of them, into one holding every field of each, as
// MergedFields describes, so app.zig passes ziggy.core.App every feature's messages or tasks.
//
pub fn merge_fields(comptime parts: anytype) MergedFields(parts) {
    const merged: MergedFields(parts) = .{};
    comptime {
        assert(@typeInfo(@TypeOf(parts)).@"struct".is_tuple);
        var part_field_count = 0;
        for (parts) |part| {
            part_field_count += @typeInfo(@TypeOf(part)).@"struct".fields.len;
        }
        assert(@typeInfo(@TypeOf(merged)).@"struct".fields.len == part_field_count);
    }
    return merged;
}
