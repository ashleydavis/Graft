//
// A resize handle: the strip in the gap to the right of one of the repo explorer's panes, which a
// drag or the Left and Right keys move to make the pane narrower or wider, as the style guide's
// commit explorer has.
//

import Tooltip from "@mui/material/Tooltip";
import { JSX, KeyboardEvent, PointerEvent, useRef } from "react";
import { draggedPaneWidth, IPaneLimits, steppedPaneWidth } from "../../../lib/pane-widths";

//
// What the handle resizes and what it reports.
//
export interface IResizeHandleProps {
    // The name of the pane it resizes, as in "commit pane", which its tooltip and its label for
    // assistive technology show.
    label: string;

    // The handle's data-id, which the smoke tests find it by.
    dataId: string;

    // How narrow and how wide the pane may go.
    limits: IPaneLimits;

    // Called with the pane's new width after a drag moves or a key press.
    onWidth(width: number): void;

    // Called when the handle is double-clicked, to put the pane back to its usual width.
    onReset(): void;
}

//
// Where a drag started: the pointer's distance from the window's left edge and the pane's width.
//
interface IDragStart {
    // The pointer's distance from the window's left edge as the drag started, in pixels.
    pointerX: number;

    // The pane's width as the drag started, in pixels.
    width: number;
}

//
// Reads the width on screen of the pane the handle resizes. The handle sits in the column that
// holds the pane, placed outside it in the gap, so the column is as wide as the pane. A handle in
// no column is a fault in the page that renders it, so it throws rather than return a width that
// would jump the pane to its limit.
//
export function resizedPaneWidth(handle: HTMLElement): number {
    const column = handle.parentElement;
    if (!column) {
        throw new Error("A resize handle was rendered outside a pane's column, so there is no pane width to read. Render the handle inside the column that holds its pane.");
    }
    return column.getBoundingClientRect().width;
}

//
// Draws the handle as a strip as wide as the gap to the right of the pane, with a line down its
// middle that shows in the accent colour under the pointer, while dragging and while the handle has
// the keyboard focus. Dragging moves the pane's right edge with the pointer, Left and Right move it
// a step and a double-click puts the pane back to its usual width, each inside the pane's limits.
// It holds the pointer during a drag, so the drag goes on when the pointer leaves the strip. It is
// a vertical separator for assistive technology, with the pane's limits.
//
export function ResizeHandle({ label, dataId, limits, onWidth, onReset }: IResizeHandleProps): JSX.Element {
    const dragStart = useRef<IDragStart | undefined>(undefined);

    function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStart.current = {
            pointerX: event.clientX,
            width: resizedPaneWidth(event.currentTarget),
        };
    }

    function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
        if (!dragStart.current) {
            return;
        }
        onWidth(draggedPaneWidth(dragStart.current.width, dragStart.current.pointerX, event.clientX, limits));
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
        dragStart.current = undefined;
        event.currentTarget.releasePointerCapture(event.pointerId);
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const width = steppedPaneWidth(resizedPaneWidth(event.currentTarget), event.key, limits);
        if (width === undefined) {
            return;
        }
        event.preventDefault();
        onWidth(width);
    }

    return (
        <Tooltip
            title={(
                <span className="flex flex-col gap-[2px] py-[2px]">
                    <span className="font-[var(--weight-bold)]">{`Resize the ${label}`}</span>
                    <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">Drag, or use Left and Right. Double-click to reset.</span>
                </span>
            )}
            placement="top"
            followCursor
        >
            <div
                data-id={dataId}
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize the ${label}`}
                aria-valuemin={limits.min}
                aria-valuemax={limits.max}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={onKeyDown}
                onDoubleClick={onReset}
                className="group absolute top-0 bottom-0 left-full flex w-[var(--space-3)] cursor-col-resize touch-none justify-center outline-none"
            >
                <span aria-hidden="true" className="h-full w-[2px] rounded-[var(--radius-full)] transition-colors group-hover:bg-[var(--color-select-pane)] group-focus-visible:bg-[var(--color-select-pane)] group-active:bg-[var(--color-select-pane)]" />
            </div>
        </Tooltip>
    );
}
