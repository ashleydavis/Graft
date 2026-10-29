//
// Tests the makers of a Result: a success holds its value and a failure its error, each marked so
// a caller can tell them apart.
//

import { err, ok } from "../../lib/result";

describe("ok", () => {
    test("makes a success holding the value", () => {
        expect(ok(5)).toEqual({
            ok: true,
            value: 5,
        });
    });
});

describe("err", () => {
    test("makes a failure holding the error", () => {
        expect(err("broken")).toEqual({
            ok: false,
            error: "broken",
        });
    });
});
