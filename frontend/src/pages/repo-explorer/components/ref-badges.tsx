//
// A commit's ref badges: one badge per ref, and the commit list's narrow column of them that shows
// the badges that fit and a "…" button whose drop-down lists every badge.
//

import { faCloud, faCodeBranch, faEllipsis, faTag, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Chip, IconButton, Popover, Tooltip } from "@mui/material";
import { JSX, useLayoutEffect, useRef, useState } from "react";
import { shownBadgeCount } from "../../../lib/ref-badge-count";

//
// The kinds of ref a badge marks, one Chip variant each.
//
export type RefBadgeKind = "current" | "branch" | "remote" | "tag";

//
// The kind of a ref and the name its badge shows.
//
export interface IRefBadge {
    // The kind of ref, which picks the badge's look and icon.
    kind: RefBadgeKind;

    // The name the badge shows, as in "main" or "v1.0".
    name: string;
}

//
// The icon of each kind of ref, as the style guide's badges have them.
//
export const refIcons: Record<RefBadgeKind, IconDefinition> = {
    current: faCodeBranch,
    branch: faCodeBranch,
    remote: faCloud,
    tag: faTag,
};

//
// Works out the kind and name of a ref as git log's %D names it: "HEAD -> main" is the checked-out
// branch, shown as "main", "tag: v1" a tag shown without its prefix, a name under origin/ a remote
// branch and any other name a local branch, as the style guide's commit list reads them.
//
export function refBadge(gitRef: string): IRefBadge {
    if (gitRef.startsWith("HEAD -> ")) {
        return {
            kind: "current",
            name: gitRef.slice("HEAD -> ".length),
        };
    }
    if (gitRef.startsWith("tag: ")) {
        return {
            kind: "tag",
            name: gitRef.slice("tag: ".length),
        };
    }
    if (gitRef.startsWith("origin/")) {
        return {
            kind: "remote",
            name: gitRef,
        };
    }
    return {
        kind: "branch",
        name: gitRef,
    };
}

//
// What a ref badge shows: one ref as git names it.
//
export interface IRefBadgeProps {
    // The ref as git log's %D names it: "HEAD -> main", "tag: v1.0" or a branch such as "main".
    gitRef: string;
}

//
// Shows one ref as a badge in the style guide's ref badge look (graft-theme.ts's Chip variants):
// the checked-out branch filled in the accent colour, every other ref outlined in the colour of its
// kind, each with its kind's icon before its name.
//
export function RefBadge({ gitRef }: IRefBadgeProps): JSX.Element {
    const badge = refBadge(gitRef);
    return <Chip variant={badge.kind} icon={<FontAwesomeIcon icon={refIcons[badge.kind]} />} label={badge.name} />;
}

//
// What the badge column shows: one commit's refs.
//
export interface IRefBadgesProps {
    // The commit's hash, which names the column's data-ids.
    hash: string;

    // The commit's refs as git log's %D names them, in git's order.
    refs: string[];
}

//
// Shows a commit's refs in a column of fixed width, as the style guide's commit list does, so the
// commit's title before it always keeps its room. The badges are measured in a hidden copy and the
// column shows the ones that fit its measured width. A shown badge may shrink, so a first badge
// too wide for the column on its own is cut short with an ellipsis. When some are left out it
// shows a "…" button after them, whose tooltip shows how many, and a click on it opens a drop-down
// under it listing every badge. The drop-down closes on Escape or a click outside it. Clicks on
// the button and in the drop-down stop at the column, so the row's selected and open commits stay
// as they were.
//
export function RefBadges({ hash, refs }: IRefBadgesProps): JSX.Element {
    const columnRef = useRef<HTMLSpanElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const [shownCount, setShownCount] = useState(refs.length);
    const [anchor, setAnchor] = useState<HTMLElement | undefined>(undefined);

    useLayoutEffect(() => {
        //
        // React sets both refs before it runs a layout effect, so neither is null here.
        //
        const column = columnRef.current!;
        const measure = measureRef.current!;
        const badgeWidthsPx: number[] = [];
        for (const child of measure.children) {
            badgeWidthsPx.push(child.getBoundingClientRect().width);
        }
        setShownCount(shownBadgeCount(badgeWidthsPx, column.clientWidth));
    }, [refs]);

    const hiddenCount = refs.length - shownCount;

    //
    // The drop-down's invisible backdrop covers the rest of the window, so a click outside the
    // drop-down lands on it, and its data-id lets a smoke test click outside. MaterialUI's type for
    // the backdrop's props lists only its own props, while MaterialUI passes data attributes on to
    // the element, so they go in an object of their own, which TypeScript checks less strictly
    // than an object written in place.
    //
    const backdropProps = {
        "data-id": `commit-refs-backdrop-${hash}`,
    };
    return (
        <span ref={columnRef} data-id={`commit-refs-${hash}`} className="relative flex w-[calc(var(--space-8)*5)] flex-none items-center gap-[var(--space-1)] overflow-hidden">
            <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute flex gap-[var(--space-1)] whitespace-nowrap">
                {refs.map(gitRef => (
                    <span key={gitRef} className="flex-none">
                        <RefBadge gitRef={gitRef} />
                    </span>
                ))}
            </span>
            {refs.slice(0, shownCount).map(gitRef => (
                <span key={gitRef} className="flex min-w-0 [&_.MuiChip-root]:max-w-full">
                    <RefBadge gitRef={gitRef} />
                </span>
            ))}
            {hiddenCount > 0 && (
                <>
                    <Tooltip title={`${hiddenCount} more`}>
                        <IconButton
                            data-id={`commit-refs-more-${hash}`}
                            className="ml-[var(--space-1)]"
                            size="small"
                            aria-label={`Show all ${refs.length} refs`}
                            aria-haspopup="dialog"
                            aria-expanded={anchor !== undefined}
                            onMouseDown={event => event.stopPropagation()}
                            onClick={event => {
                                event.stopPropagation();
                                setAnchor(event.currentTarget);
                            }}
                        >
                            <FontAwesomeIcon icon={faEllipsis} />
                        </IconButton>
                    </Tooltip>
                    <Popover
                        data-id={`commit-refs-menu-${hash}`}
                        open={anchor !== undefined}
                        anchorEl={anchor}
                        onClose={() => setAnchor(undefined)}
                        onClick={event => event.stopPropagation()}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                        slotProps={{
                            paper: {
                                className: "mt-[var(--space-1)]",
                                role: "dialog",
                                "aria-label": "Refs",
                            },
                            backdrop: backdropProps,
                        }}
                    >
                        <div className="flex flex-col items-start gap-[var(--space-2)] p-[var(--space-3)]">
                            {refs.map(gitRef => <RefBadge key={gitRef} gitRef={gitRef} />)}
                        </div>
                    </Popover>
                </>
            )}
        </span>
    );
}
