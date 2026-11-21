//
// The breadcrumb trail: the steps in the top bar from the repo to the page being shown, each one
// plain text or a drop-down of the pages it can switch to.
//

import { faChevronDown, faChevronRight, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Breadcrumbs, InputAdornment, MenuItem, MenuList, Popover, TextField, Tooltip } from "@mui/material";
import { JSX, useState } from "react";
import { clipStepLabel, ITrailOption, ITrailStep, PAGE_STEP_DATA_ID, searchMatches } from "../lib/breadcrumb-trail";

//
// What the trail shows and how it opens another page. The layout knows the page being shown and
// owns the router, so the trail is given its steps and asks the layout to open a page.
//
export interface IBreadcrumbTrailProps {
    // The steps, from the repo to the page being shown.
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

    // Whether it is the last step, the page being shown, which stands out from the steps before it.
    isLast: boolean;

    // Opens the page at the path.
    onNavigate(path: string): void;
}

//
// Shows the steps in order with a chevron between each, so the trail reads from the repo to the
// page being shown.
//
export function BreadcrumbTrail({ steps, onNavigate }: IBreadcrumbTrailProps): JSX.Element {
    return (
        <Breadcrumbs
            data-id="breadcrumb-trail"
            aria-label="Breadcrumb trail"
            separator={<FontAwesomeIcon icon={faChevronRight} />}
            className="min-w-0"
        >
            {steps.map((step, index) => (
                <TrailStep key={step.dataId} step={step} isLast={index === steps.length - 1} onNavigate={onNavigate} />
            ))}
        </Breadcrumbs>
    );
}

//
// Picks the classes for the size, weight and colour of a step's text, for TrailStep and
// TrailStepMenu. The page being shown is the page's title, so it is a size larger and bolder than
// the other steps. Any other last step, the repo on a page with no step of its own, has the medium
// weight. The steps before the last are muted.
//
export function stepTextClasses(step: ITrailStep, isLast: boolean): string {
    if (isLast) {
        if (step.dataId === PAGE_STEP_DATA_ID) {
            return "text-[length:var(--text-lg)] font-[var(--weight-bold)] text-[var(--color-text)]";
        }
        else {
            return "text-[length:var(--text-md)] font-[var(--weight-medium)] text-[var(--color-text)]";
        }
    }
    else {
        return "text-[length:var(--text-md)] text-[var(--color-text-muted)]";
    }
}

//
// Shows a step with pages to switch to as a drop-down and any other step as plain text, because a
// step with no sibling has nowhere to go. Its text is cut short when it is long and its tooltip,
// the style guide's MaterialUI tooltip, always holds it in full.
//
export function TrailStep({ step, isLast, onNavigate }: ITrailStepProps): JSX.Element {
    if (step.options.length > 0) {
        return <TrailStepMenu step={step} isLast={isLast} onNavigate={onNavigate} />;
    }
    return (
        <Tooltip title={step.tooltip}>
            <span data-id={step.dataId} className={stepTextClasses(step, isLast)}>
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

    return (
        <>
            <Tooltip title={step.tooltip}>
                <button
                    type="button"
                    data-id={step.dataId}
                    aria-haspopup="menu"
                    aria-expanded={anchor !== undefined}
                    onClick={event => setAnchor(event.currentTarget)}
                    className={`inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-1)] leading-[var(--leading-normal)] shadow-[inset_0_0_0_1px_var(--color-border-control)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] hover:shadow-[inset_0_0_0_1px_var(--color-text-muted)] focus-visible:outline-solid focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[var(--color-focus)] ${stepTextClasses(step, isLast)}`}
                >
                    {clipStepLabel(step.label)}
                    <FontAwesomeIcon icon={faChevronDown} className={`text-[length:var(--icon-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${anchor !== undefined ? "rotate-180" : ""}`} />
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
