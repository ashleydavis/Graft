//
// Draws one pane of the repo explorer in a column of its own that animates as the pane opens and
// closes, keeps a closing pane drawn until its closing animation ends and hides or widens the
// column while a pane is maximised.
//

import { AnimationEvent, JSX, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { closingPaneId, paneAnimationClass, REDUCED_MOTION_QUERY } from "../../../lib/pane-animation";

//
// What a pane's column is given: which pane is open and the pane itself.
//
export interface IAnimatedPaneProps {
    // Names the open pane, or is undefined while the pane is closed. A pane with a new name is
    // drawn afresh and fades in again, as when another commit's details open.
    openId: string | undefined;

    // Whether another pane is maximised, which hides this pane's column. The pane stays drawn,
    // hidden, so it shows again as it was when the panes are restored.
    isHidden: boolean;

    // Whether this pane is maximised, so its column grows to fill the repo explorer.
    isMaximised: boolean;

    // The open pane, drawn while openId names it.
    children: ReactNode;
}

//
// Draws the open pane in a column that fades in, and when the pane closes keeps drawing it, as it
// last was, in a column that fades and narrows to nothing, then stops drawing it once that
// animation ends. The closing column is inert, so clicks and the focus pass to the other panes and
// the keys act on them while it animates. It moves the focus out of a closing pane, so a key
// pressed then reaches the page instead of a button that is going away. The closing animation
// narrows from the column's width, measured as the animation starts, because a pane's width depends
// on the window. The opening animation's class comes off the column once the animation ends, so
// a column hidden while another pane is maximised shows again at once when the panes are restored.
// The open column is the box a pane's resize handle is placed against, in the gap to its right.
// Under reduced motion the column has an empty animation class and a closed pane goes at once,
// because the end of the closing animation is what removes a closed pane, and that animation is
// off.
//
export function AnimatedPane({ openId, isHidden, isMaximised, children }: IAnimatedPaneProps): JSX.Element | undefined {
    const isReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const [previousOpenId, setPreviousOpenId] = useState(openId);
    const [closingId, setClosingId] = useState<string | undefined>(undefined);
    const [openedId, setOpenedId] = useState<string | undefined>(undefined);
    const lastPane = useRef<ReactNode>(undefined);

    if (previousOpenId !== openId) {
        setPreviousOpenId(openId);
        setClosingId(closingPaneId(previousOpenId, openId, isReducedMotion));
        setOpenedId(undefined);
    }

    useLayoutEffect(() => {
        if (openId !== undefined) {
            lastPane.current = children;
        }
    });

    if (openId !== undefined) {
        let animationClass = paneAnimationClass(false, isReducedMotion);
        if (openedId === openId) {
            animationClass = "";
        }

        //
        // Takes the opening animation's class off the column once its own animation ends. An
        // animation of an element inside the pane ends too and reaches the column, so only the
        // column's own is taken.
        //
        function onOpenAnimationEnd(event: AnimationEvent<HTMLDivElement>): void {
            if (event.target !== event.currentTarget) {
                return;
            }
            setOpenedId(openId);
        }

        return (
            <div key={openId} className={`relative ${openColumnClass(isHidden, isMaximised)} ${animationClass}`} onAnimationEnd={onOpenAnimationEnd}>
                {children}
            </div>
        );
    }
    if (closingId === undefined) {
        return undefined;
    }

    //
    // Sets the width the closing animation narrows from to the column's width as the animation
    // starts, and moves the focus out of the pane. An animation of an element inside the pane
    // starts too and reaches the column, so only the column's own is taken.
    //
    function onAnimationStart(event: AnimationEvent<HTMLDivElement>): void {
        if (event.target !== event.currentTarget) {
            return;
        }
        event.currentTarget.style.setProperty("--pane-width", `${event.currentTarget.offsetWidth}px`);
        const focused = event.currentTarget.querySelector<HTMLElement>(":focus");
        if (focused) {
            focused.blur();
        }
    }

    //
    // Stops drawing the closed pane once its own closing animation ends. An animation of an element
    // inside the pane ends too and reaches the column, so only the column's own is taken.
    //
    function onAnimationEnd(event: AnimationEvent<HTMLDivElement>): void {
        if (event.target !== event.currentTarget) {
            return;
        }
        lastPane.current = undefined;
        setClosingId(undefined);
    }

    return (
        <div key={closingId} inert className={`flex flex-none ${paneAnimationClass(true, isReducedMotion)}`} onAnimationStart={onAnimationStart} onAnimationEnd={onAnimationEnd}>
            {lastPane.current}
        </div>
    );
}

//
// Picks the Tailwind classes of an open pane's column: hidden while another pane is maximised,
// growing to fill the repo explorer while its own pane is maximised and as wide as its pane
// otherwise.
//
export function openColumnClass(isHidden: boolean, isMaximised: boolean): string {
    if (isHidden) {
        return "hidden";
    }
    if (isMaximised) {
        return "flex min-w-0 flex-1";
    }
    return "flex flex-none";
}
