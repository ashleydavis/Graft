//
// Works out the widths of the repo explorer's panes that the resize handles set: each pane's
// limits, the width a drag or a key press moves a pane to, the key path each width is saved at in
// Graft's state file and the width read back from it.
//

import type { CSSProperties } from "react";
import type { IJsonValue } from "ziggy";

//
// The panes a resize handle resizes: every pane that can have a pane to its right. The file pane
// is always the last pane, so it has no handle.
//
export type ResizablePane = "repoDetails" | "commits" | "commitDetails" | "changes";

//
// How narrow and how wide a pane may go, in pixels.
//
export interface IPaneLimits {
    // The narrowest the pane may go.
    min: number;

    // The widest the pane may go.
    max: number;
}

//
// Each pane's limits. The commit pane's and the commit details pane's are the style guide's for its
// commit list and commit details panes. The style guide gives none for the repo details pane or the
// changes pane, so they take the commit details pane's, the other narrow pane beside a wide one.
//
export const PANE_LIMITS: Record<ResizablePane, IPaneLimits> = {
    repoDetails: {
        min: 300,
        max: 800,
    },
    commits: {
        min: 320,
        max: 1000,
    },
    commitDetails: {
        min: 300,
        max: 800,
    },
    changes: {
        min: 300,
        max: 800,
    },
};

//
// How far one press of Left or Right moves a pane's right edge, in pixels. 16 is the step the
// style guide's resize handle takes, so Graft's handles step the same way.
//
export const RESIZE_KEY_STEP = 16;

//
// Rounds the width to a whole pixel and keeps it inside the limits.
//
export function clampPaneWidth(width: number, limits: IPaneLimits): number {
    return Math.round(Math.min(Math.max(width, limits.min), limits.max));
}

//
// Works out the pane's width after a drag that started at startX with the pane startWidth wide has
// reached pointerX, so the pane's right edge follows the pointer, inside the limits.
//
export function draggedPaneWidth(startWidth: number, startX: number, pointerX: number, limits: IPaneLimits): number {
    return clampPaneWidth(startWidth + pointerX - startX, limits);
}

//
// Works out the pane's width after the key is pressed on its resize handle: a step narrower for
// Left and a step wider for Right, inside the limits. Any other key leaves the width undefined,
// because the handle leaves it alone.
//
export function steppedPaneWidth(width: number, key: string, limits: IPaneLimits): number | undefined {
    if (key === "ArrowLeft") {
        return clampPaneWidth(width - RESIZE_KEY_STEP, limits);
    }
    if (key === "ArrowRight") {
        return clampPaneWidth(width + RESIZE_KEY_STEP, limits);
    }
    return undefined;
}

//
// Builds the key path in Graft's state file of the pane's width, such as paneWidths.commits, so
// usePaneWidth reads and saves each pane's width at a key of its own.
//
export function paneWidthStateKey(pane: ResizablePane): string {
    return `paneWidths.${pane}`;
}

//
// Works out the pane's width from the value read from Graft's state file: a number is kept inside
// the pane's limits, in case the file was edited outside Graft, and anything else, a missing value
// among them, is undefined, so the pane takes its usual width.
//
export function savedPaneWidth(value: IJsonValue | undefined, limits: IPaneLimits): number | undefined {
    if (typeof value !== "number") {
        return undefined;
    }
    return clampPaneWidth(value, limits);
}

//
// Makes the style that gives a pane the width, or none for undefined, so the pane keeps the usual
// width its own classes give it.
//
export function paneWidthStyle(width: number | undefined): CSSProperties | undefined {
    if (width === undefined) {
        return undefined;
    }
    return {
        width: `${width}px`,
    };
}
