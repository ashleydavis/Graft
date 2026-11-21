//
// Tests how many ref badges the commit list's badge column shows: none for no refs, all of them
// when they fit, as many as fit beside the "…" button when they do not and always the first.
//

import { BADGE_GAP_PX, MORE_BUTTON_WIDTH_PX, shownBadgeCount } from "../../lib/ref-badge-count";

describe("shownBadgeCount", () => {
    test("shows no badges for a commit with no refs", () => {
        expect(shownBadgeCount([], 160)).toBe(0);
    });

    test("shows every badge when they fit with a gap between each", () => {
        expect(shownBadgeCount([50, 50, 52], 152 + BADGE_GAP_PX * 2)).toBe(3);
    });

    test("leaves room for the \"…\" button when the badges do not all fit", () => {
        expect(shownBadgeCount([58, 58, 58, 58, 58], 160)).toBe(2);
        expect(shownBadgeCount([60, 60, 60], MORE_BUTTON_WIDTH_PX + 60 + BADGE_GAP_PX + 60 - 1)).toBe(1);
    });

    test("stops at the first badge that does not fit, even when a later one would", () => {
        expect(shownBadgeCount([40, 200, 10], 160)).toBe(1);
    });

    test("always shows the first badge, even when it alone is too wide", () => {
        expect(shownBadgeCount([300, 20], 160)).toBe(1);
        expect(shownBadgeCount([300], 160)).toBe(1);
    });
});
