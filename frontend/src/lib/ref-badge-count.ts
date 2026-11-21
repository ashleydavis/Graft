//
// Works out how many of a commit's ref badges fit in the commit list's badge column, so the column
// can show those and a "…" button for the rest.
//

//
// The gap between two badges, in pixels: the style guide's --space-1.
//
export const BADGE_GAP_PX = 4;

//
// The room the "…" button takes with the gap before it, in pixels: the style guide's icon button
// is a square of --icon-lg (18px) plus --space-3 (12px), and the gap is --space-2 (8px), the
// least room the style guide's UX rules give beside a control.
//
export const MORE_BUTTON_WIDTH_PX = 18 + 12 + 8;

//
// Returns how many of the badges, measured in order as badgeWidthsPx, the column shows in
// columnWidthPx: all of them when they fit with a gap between each, or else as many as fit with
// room left for the "…" button. The first badge always shows, cut short by the column when it
// alone is too wide, so a commit with refs always shows at least one badge.
//
export function shownBadgeCount(badgeWidthsPx: number[], columnWidthPx: number): number {
    if (badgeWidthsPx.length === 0) {
        return 0;
    }
    let allWidthPx = BADGE_GAP_PX * (badgeWidthsPx.length - 1);
    for (const badgeWidthPx of badgeWidthsPx) {
        allWidthPx += badgeWidthPx;
    }
    if (allWidthPx <= columnWidthPx) {
        return badgeWidthsPx.length;
    }
    let usedWidthPx = MORE_BUTTON_WIDTH_PX;
    let count = 0;
    for (const badgeWidthPx of badgeWidthsPx) {
        let nextWidthPx = usedWidthPx + badgeWidthPx;
        if (count > 0) {
            nextWidthPx += BADGE_GAP_PX;
        }
        if (columnWidthPx < nextWidthPx) {
            break;
        }
        usedWidthPx = nextWidthPx;
        count += 1;
    }
    if (count === 0) {
        return 1;
    }
    return count;
}
