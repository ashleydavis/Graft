//
// The breadcrumb trail: the steps in the top bar from the repo to the page being shown and its open
// panes, each one plain text or a drop-down of the pages it can switch to, with the steps between
// the first and the last collapsed into one when the trail has too little room.
//

import { faChevronDown, faChevronRight, faEllipsis, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Breadcrumbs, breadcrumbsClasses, IconButton, InputAdornment, MenuItem, MenuList, Popover, TextField, Tooltip } from "@mui/material";
import { JSX, useLayoutEffect, useRef, useState } from "react";
import { clipStepLabel, collapsedStepCount, ITrailOption, ITrailStep, ITrailWidths, PAGE_STEP_DATA_ID, searchMatches } from "../lib/breadcrumb-trail";

//
// What the trail shows and how it opens another page. The layout knows the page being shown and
// owns the router, so the trail is given its steps and asks the layout to open a page.
//
export interface IBreadcrumbTrailProps {
    // The steps, from the repo to the page being shown and, on the repo explorer page, its open
    // panes.
    steps: ITrailStep[];

    // Opens the page at the path.
    onNavigate(path: string): void;
}

//
// What one step needs to draw itself.
//
export interface ITrailStepProps {
    // The step.
    step: ITrailStep;

    // Whether it is the last step, the page being shown or its rightmost pane, which stands out from
    // the steps before it.
    isLast: boolean;

    // Opens the page at the path.
    onNavigate(path: string): void;
}

//
// The collapsed steps the trail worked out for one set of steps, kept with those steps so the
// trail measures itself again when its steps change.
//
export interface ITrailMeasurement {
    // The data-id and text of each step measured, one line per step, which changes whenever a
    // step's width can.
    stepsKey: string;

    // How many steps after the first are collapsed.
    collapsedCount: number;
}

//
// What the collapsed step needs to draw itself and its list.
//
export interface ICollapsedStepsProps {
    // The steps it stands for, in the trail's order.
    steps: ITrailStep[];
}

//
// Shows the steps in order with a chevron between each, so the trail reads from the repo to the
// page being shown, on one line in the room the top bar gives it. The trail is first drawn with
// every step in full and none allowed to shrink, which React does before the window paints, so
// each step can be measured. Then collapsedStepCount works out how many steps after the first to
// collapse into one step that lists them. When every step between the first and last is collapsed
// the steps left may shrink, and a step with less room than its text is cut short with an
// ellipsis. The trail measures itself again when its steps change and when the window changes
// size, which zooming does too, so widening the window brings collapsed steps back.
//
export function BreadcrumbTrail({ steps, onNavigate }: IBreadcrumbTrailProps): JSX.Element {
    const navRef = useRef<HTMLElement>(null);
    const [measurement, setMeasurement] = useState<ITrailMeasurement | undefined>(undefined);
    const stepsKey = steps.map(step => `${step.dataId}:${step.label}`).join("\n");
    let collapsedCount: number | undefined = undefined;
    if (measurement?.stepsKey === stepsKey) {
        collapsedCount = measurement.collapsedCount;
    }

    useLayoutEffect(() => {
        function remeasure(): void {
            setMeasurement(undefined);
        }

        window.addEventListener("resize", remeasure);
        return () => {
            window.removeEventListener("resize", remeasure);
        };
    }, []);

    useLayoutEffect(() => {
        if (collapsedCount === undefined) {
            //
            // React sets the ref before it runs a layout effect, so it holds the trail here.
            //
            const nav = navRef.current!;
            setMeasurement({
                stepsKey,
                collapsedCount: collapsedStepCount(trailWidths(nav), nav.getBoundingClientRect().width),
            });
        }
    }, [collapsedCount, stepsKey]);

    const hiddenCount = collapsedCount ?? 0;
    const items: JSX.Element[] = [];
    if (steps.length > 0) {
        items.push(<TrailStep key={steps[0].dataId} step={steps[0]} isLast={steps.length === 1} onNavigate={onNavigate} />);
    }
    if (hiddenCount > 0) {
        items.push(<CollapsedSteps key="breadcrumb-collapsed" steps={steps.slice(1, 1 + hiddenCount)} />);
    }
    for (let index = 1 + hiddenCount; index < steps.length; index += 1) {
        items.push(<TrailStep key={steps[index].dataId} step={steps[index]} isLast={index === steps.length - 1} onNavigate={onNavigate} />);
    }

    //
    // The collapsed step is an icon button of fixed size, so it never shrinks, while the steps
    // shown in full shrink only once every step between the first and last is collapsed.
    //
    let stepClasses = "shrink-0";
    if (collapsedCount === Math.max(0, steps.length - 2)) {
        stepClasses = "min-w-0 has-[>[data-id=breadcrumb-collapsed]]:shrink-0";
    }
    return (
        <Breadcrumbs
            ref={navRef}
            data-id="breadcrumb-trail"
            aria-label="Breadcrumb trail"
            separator={<FontAwesomeIcon icon={faChevronRight} />}
            maxItems={steps.length + 1}
            className="w-full min-w-0"
            classes={{
                ol: "flex-nowrap",
                li: stepClasses,
                separator: "shrink-0",
            }}
        >
            {items}
        </Breadcrumbs>
    );
}

//
// Measures the trail drawn in full, for collapsedStepCount: the width of each step and the room
// between the first two, which every chevron takes alike.
//
export function trailWidths(nav: HTMLElement): ITrailWidths {
    const stepBounds = Array.from(nav.querySelectorAll<HTMLElement>(`.${breadcrumbsClasses.li}`)).map(step => step.getBoundingClientRect());
    let separatorWidthPx = 0;
    if (stepBounds.length > 1) {
        separatorWidthPx = stepBounds[1].left - stepBounds[0].right;
    }
    return {
        stepWidthsPx: stepBounds.map(bounds => bounds.width),
        separatorWidthPx,
    };
}

//
// Works out the label and tooltip of the collapsed step from how many steps it stands for.
//
export function collapsedStepsLabel(count: number): string {
    if (count === 1) {
        return "Show 1 hidden step";
    }
    return `Show ${count} hidden steps`;
}

//
// Shows the steps collapsed out of the trail as one ellipsis step, the style guide's small icon
// button, whose tooltip gives how many it stands for. A click opens a list under it of those steps
// in the trail's order, each with its full text, as the trail would read without them. The list
// closes on Escape or a click outside it.
//
export function CollapsedSteps({ steps }: ICollapsedStepsProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement | undefined>(undefined);
    const label = collapsedStepsLabel(steps.length);
    return (
        <>
            <Tooltip title={label}>
                <IconButton
                    data-id="breadcrumb-collapsed"
                    aria-label={label}
                    aria-haspopup="dialog"
                    aria-expanded={anchor !== undefined}
                    size="small"
                    onClick={event => setAnchor(event.currentTarget)}
                >
                    <FontAwesomeIcon icon={faEllipsis} />
                </IconButton>
            </Tooltip>
            <Popover
                data-id="breadcrumb-collapsed-menu"
                open={anchor !== undefined}
                anchorEl={anchor}
                onClose={() => setAnchor(undefined)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                slotProps={{
                    paper: {
                        className: "mt-[var(--space-1)]",
                        role: "dialog",
                        "aria-label": "Hidden steps",
                    },
                }}
            >
                <ol className="flex flex-col gap-[var(--space-1)] p-[var(--space-2)]">
                    {steps.map(step => (
                        <li key={step.dataId} data-id={`${step.dataId}-collapsed`} className="whitespace-nowrap px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-md)] text-[var(--color-text)]">
                            {step.label}
                        </li>
                    ))}
                </ol>
            </Popover>
        </>
    );
}

//
// Picks the classes for the size, weight and colour of a step's text, for TrailStep and
// TrailStepMenu. The page's step is the page's title, so it is a size larger and bolder than the
// other steps wherever it is, even with the repo explorer's pane steps after it. Any other last
// step, the rightmost pane or the repo on a page with no step of its own, has the medium weight.
// The other steps are muted.
//
export function stepTextClasses(step: ITrailStep, isLast: boolean): string {
    if (step.dataId === PAGE_STEP_DATA_ID) {
        return "text-[length:var(--text-lg)] font-[var(--weight-bold)] text-[var(--color-text)]";
    }
    else {
        if (isLast) {
            return "text-[length:var(--text-md)] font-[var(--weight-medium)] text-[var(--color-text)]";
        }
        else {
            return "text-[length:var(--text-md)] text-[var(--color-text-muted)]";
        }
    }
}

//
// Shows a step with pages to switch to as a drop-down and any other step as plain text, because a
// step with no sibling has nowhere to go. Its text is cut short when it is long, and with an
// ellipsis when the trail gives it less room than its text, and its tooltip, the style guide's
// MaterialUI tooltip, always holds it in full.
//
export function TrailStep({ step, isLast, onNavigate }: ITrailStepProps): JSX.Element {
    if (step.options.length > 0) {
        return <TrailStepMenu step={step} isLast={isLast} onNavigate={onNavigate} />;
    }
    return (
        <Tooltip title={step.tooltip}>
            <span data-id={step.dataId} className={`block truncate ${stepTextClasses(step, isLast)}`}>
                {clipStepLabel(step.label)}
            </span>
        </Tooltip>
    );
}

//
// Shows a step as a drop-down button in the style guide's look, a bordered button with a down
// chevron after its label, that opens a drop-down of the pages it can switch to, with a search box
// that narrows them by name. The page being shown has the selected colour, as the style guide's
// select list marks its chosen item. The drop-down sits a spacing step below the button. Picking
// the page being shown only closes the drop-down. Picking another page opens it. The search is
// cleared each time the drop-down closes, so it opens on every page again.
//
export function TrailStepMenu({ step, isLast, onNavigate }: ITrailStepProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement | undefined>(undefined);
    const [searchText, setSearchText] = useState("");

    function close(): void {
        setAnchor(undefined);
        setSearchText("");
    }

    function choose(option: ITrailOption): void {
        close();
        if (!option.isSelected) {
            onNavigate(option.path);
        }
    }

    const shownOptions = searchMatches(step.options, searchText);

    //
    // The chevron turns upside down while the drop-down is open.
    //
    let chevronClasses = "shrink-0 text-[length:var(--icon-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)]";
    if (anchor !== undefined) {
        chevronClasses = `${chevronClasses} rotate-180`;
    }

    return (
        <>
            <Tooltip title={step.tooltip}>
                <button
                    type="button"
                    data-id={step.dataId}
                    aria-haspopup="menu"
                    aria-expanded={anchor !== undefined}
                    onClick={event => setAnchor(event.currentTarget)}
                    className={`inline-flex max-w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-1)] leading-[var(--leading-normal)] shadow-[inset_0_0_0_1px_var(--color-border-control)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] hover:shadow-[inset_0_0_0_1px_var(--color-text-muted)] focus-visible:outline-solid focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[var(--color-focus)] ${stepTextClasses(step, isLast)}`}
                >
                    <span className="min-w-0 truncate">{clipStepLabel(step.label)}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={chevronClasses} />
                </button>
            </Tooltip>
            <Popover
                data-id={`${step.dataId}-menu`}
                open={anchor !== undefined}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                slotProps={{
                    paper: {
                        className: "mt-[var(--space-1)]",
                    },
                }}
            >
                <div className="flex w-64 flex-col gap-[var(--space-2)] p-[var(--space-2)]">
                    <TextField
                        size="small"
                        fullWidth={true}
                        autoFocus={true}
                        placeholder="Search pages"
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        slotProps={{
                            htmlInput: {
                                "data-id": `${step.dataId}-search`,
                            },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start" className="text-[length:var(--icon-md)] text-[var(--color-text-muted)]">
                                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    {shownOptions.length === 0 && (
                        <p data-id={`${step.dataId}-no-match`} className="p-[var(--space-3)] text-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                            No page matches "{searchText}".
                        </p>
                    )}
                    <MenuList className="flex flex-col gap-[var(--space-1)] p-0">
                        {shownOptions.map(option => (
                            <MenuItem key={option.dataId} data-id={option.dataId} selected={option.isSelected} onClick={() => choose(option)}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </MenuList>
                </div>
            </Popover>
        </>
    );
}
