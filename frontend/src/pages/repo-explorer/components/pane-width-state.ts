//
// Keeps the width of one of the repo explorer's panes that its resize handle sets, saves it in
// Graft's state file as it changes and reads it back as the repo explorer opens.
//

import { useEffect, useRef, useState } from "react";
import { PANE_LIMITS, paneWidthStateKey, ResizablePane, savedPaneWidth } from "../../../lib/pane-widths";

//
// The pane's width and the calls that change it, for the repo explorer page to give the pane and
// its resize handle.
//
export interface IPaneWidth {
    // The pane's width in pixels, or undefined while the pane takes its usual width.
    width: number | undefined;

    // Sets the pane's width and saves it, for a drag or a key press on the handle.
    changeWidth(width: number): void;

    // Puts the pane back to its usual width and removes the saved width, for a double-click on the
    // handle.
    resetWidth(): void;
}

//
// Writes the pane's width at its key path in Graft's state file, or removes the key for undefined,
// so the next run of Graft opens the pane at that width. A failed write is logged with what to
// expect, and the pane keeps the width on screen.
//
export function savePaneWidth(pane: ResizablePane, width: number | undefined): void {
    const stateKey = paneWidthStateKey(pane);
    window.ziggy.setState(stateKey, width).catch(error => {
        console.error(`Graft could not save the width of the ${pane} pane in its state file at ${stateKey}: ${String(error)}. The pane keeps its width until Graft closes, and the next run opens it at the width the file holds.`);
    });
}

//
// Reads the pane's width saved in Graft's state file when the component that calls it is first
// shown, and returns the width with the calls that change it. A width the user sets before the read
// ends is kept, because it is newer than the saved one. A failed read is logged with what to
// expect, and the pane takes its usual width.
//
export function usePaneWidth(pane: ResizablePane): IPaneWidth {
    const [width, setWidth] = useState<number | undefined>(undefined);
    const isChanged = useRef(false);

    useEffect(() => {
        let isRemoved = false;
        const stateKey = paneWidthStateKey(pane);
        window.ziggy.getState(stateKey)
            .then(value => {
                if (isRemoved) {
                    return;
                }
                if (isChanged.current) {
                    return;
                }
                setWidth(savedPaneWidth(value, PANE_LIMITS[pane]));
            })
            .catch(error => {
                console.error(`Graft could not read the width of the ${pane} pane saved in its state file at ${stateKey}: ${String(error)}. The pane opens at its usual width, and the resize handle beside it still sets and saves its width.`);
            });
        return () => {
            isRemoved = true;
        };
    }, [pane]);

    function changeWidth(nextWidth: number): void {
        isChanged.current = true;
        setWidth(nextWidth);
        savePaneWidth(pane, nextWidth);
    }

    function resetWidth(): void {
        isChanged.current = true;
        setWidth(undefined);
        savePaneWidth(pane, undefined);
    }

    return {
        width,
        changeWidth,
        resetWidth,
    };
}
