//
// Tests Graft's version: checks it is "dev".
//

import { version } from "../../lib/version";

describe("version", () => {
    test("is dev", () => {
        expect(version).toBe("dev");
    });
});
