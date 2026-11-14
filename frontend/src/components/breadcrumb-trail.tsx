//
// The breadcrumb trail: the steps in the top bar from the repo to the page being shown, each one
// plain text or a drop-down of the pages it can switch to.
//

import { faCaretDown, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Breadcrumbs, MenuItem, MenuList, Popover, TextField } from "@mui/material";
import { JSX, useState } from "react";
import { clipStepLabel, ITrailOption, ITrailStep, searchMatches } from "../lib/breadcrumb-trail";

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
// Shows a step with pages to switch to as a drop-down and any other step as plain text, because a
// step with no sibling has nowhere to go. Its text is cut short when it is long and its tooltip
// always holds it in full.
//
export function TrailStep({ step, isLast, onNavigate }: ITrailStepProps): JSX.Element {
    if (step.options.length > 0) {
        return <TrailStepMenu step={step} isLast={isLast} onNavigate={onNavigate} />;
    }
    return (
        <span data-id={step.dataId} title={step.tooltip} className={isLast ? "text-[length:var(--text-md)] font-[var(--weight-bold)] text-[var(--color-text)]" : "text-[length:var(--text-md)] text-[var(--color-text-muted)]"}>
            {clipStepLabel(step.label)}
        </span>
    );
}

//
// Shows a step as a button that opens a drop-down of the pages it can switch to, with a search box
// that narrows them by name. The page being shown is ticked. Picking it only closes the
// drop-down. Picking another page opens it. The search is cleared each time the drop-down closes,
// so it opens on every page again.
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
            <button
                type="button"
                data-id={step.dataId}
                title={step.tooltip}
                onClick={event => setAnchor(event.currentTarget)}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-0.5 text-[length:var(--text-md)] shadow-[inset_0_0_0_1px_var(--color-border)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] ${isLast ? "font-[var(--weight-bold)] text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}
            >
                {clipStepLabel(step.label)}
                <FontAwesomeIcon icon={faCaretDown} className={`text-[length:var(--icon-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${anchor !== undefined ? "rotate-180" : ""}`} />
            </button>
            <Popover
                data-id={`${step.dataId}-menu`}
                open={anchor !== undefined}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <div className="flex w-64 flex-col gap-2 p-2">
                    <TextField
                        size="small"
                        fullWidth={true}
                        autoFocus={true}
                        placeholder="Search"
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                    />
                    {shownOptions.length === 0 && (
                        <p data-id={`${step.dataId}-no-match`} className="p-3 text-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                            No page matches "{searchText}".
                        </p>
                    )}
                    <MenuList className="flex flex-col gap-0.5 p-0">
                        {shownOptions.map(option => (
                            <MenuItem key={option.dataId} data-id={option.dataId} selected={option.isSelected} onClick={() => choose(option)} className="gap-2">
                                <span className="flex w-5 justify-center text-[length:var(--icon-sm)] text-[var(--color-accent)]">
                                    {option.isSelected && <FontAwesomeIcon icon={faCheck} />}
                                </span>
                                {option.label}
                            </MenuItem>
                        ))}
                    </MenuList>
                </div>
            </Popover>
        </>
    );
}
