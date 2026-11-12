//
// The zoom message: has the native app zoom the frontend in or out a step, or put it back to its
// normal size, for Graft's Zoom In, Zoom Out and Actual Size actions, whose handlers are in the
// frontend and keep the zoom level in Graft's state file.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;
const HandlerServices = ziggy.core.HandlerServices;
const Timers = ziggy.timers.Timers;

//
// The native app's zoom actions the zoom message may run, each spelled as Ziggy's standard action
// of that name. The message accepts only these, so the frontend reaches only the native app's zoom
// actions through it, and Ziggy refuses any other action, such as quit, as invalid data.
//
pub const ZoomAction = enum {
    @"zoom-in",
    @"zoom-out",
    @"zoom-reset",
};

//
// Checks at build time that every zoom action is one of Ziggy's standard actions, so the native app
// runs each name the message passes it.
//
comptime {
    for (std.meta.fieldNames(ZoomAction)) |name| {
        assert(@hasField(ziggy.menu.StandardAction, name));
    }
}

//
// The data of the zoom message, which the frontend sends as {"action": "zoom-in"}.
//
pub const ZoomRequest = struct {
    // The zoom action the native app runs.
    action: ZoomAction,
};

//
// Handles the frontend's zoom message by having the native app run the zoom action it names, as the
// View menu's standard zoom items do. Ziggy's handler services reach the native app's own actions
// by name whether or not the menu has an item for them, which is why the zoom goes through the
// backend. In dev mode the backend runs without a native app, and Ziggy drops the call.
//
pub fn zoom_message_handler(
    services: HandlerServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    payload: ZoomRequest,
) !void {
    _ = timers;
    const action = @tagName(payload.action);
    assert(std.mem.startsWith(u8, action, "zoom-"));

    services.menuAction(io, allocator, action);
}
