//
// Graft's tooltips, one kind for each the style guide's tooltip page shows: a label, a label with
// its shortcut, a title with a quieter detail line, the full text of a cut-off value, a list of
// fields each with a copy button and a pinnable tooltip that P or its pin button keeps open so its
// fields can be copied. Every kind is built on MaterialUI's Tooltip, which Graft's theme styles as
// the style guide's theme does, so every tooltip in Graft looks and waits the same way.
//

import { faCheck, faCopy, faThumbtack, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Tooltip } from "@mui/material";
import { JSX, ReactElement, ReactNode, useEffect, useState } from "react";
import { COPIED_DURATION_MS, copyText } from "../lib/clipboard";
import { isTypingTarget, tooltipKeyAction } from "../lib/tooltip-keys";

//
// Where a label tooltip opens: below its element, as most do, or to its right, as the left
// sidebar's do, so the tooltip never covers the sidebar's other links.
//
export type LabelTooltipPlacement = "bottom" | "right";

//
// What a label tooltip shows and wraps.
//
export interface ILabelTooltipProps {
    // The words the tooltip shows, such as "Close".
    label: string;

    // Where the tooltip opens.
    placement: LabelTooltipPlacement;

    // The element the tooltip is for, which takes the tooltip's events and ref.
    children: ReactElement;
}

//
// Shows a short label, such as an icon button's name, when the pointer rests on the element or the
// keyboard reaches it.
//
export function LabelTooltip({ label, placement, children }: ILabelTooltipProps): JSX.Element {
    return (
        <Tooltip title={label} placement={placement}>
            {children}
        </Tooltip>
    );
}

//
// What a tooltip with a shortcut shows and wraps.
//
export interface IShortcutTooltipProps {
    // What the element does, such as "Show keyboard shortcuts".
    label: string;

    // The keys that do the same, such as "Ctrl+/".
    shortcut: string;

    // The data-id of the tooltip's content, so a test can read it.
    dataId: string;

    // The element the tooltip is for.
    children: ReactElement;
}

//
// Shows what the element does with the keys that do the same after it, in the code font and
// fainter, as the style guide's tooltip with a shortcut does. The two sit on the same baseline,
// because the code font draws its letters higher in the line than the interface font.
//
export function ShortcutTooltip({ label, shortcut, dataId, children }: IShortcutTooltipProps): JSX.Element {
    return (
        <Tooltip
            title={
                <span data-id={dataId} className="inline-flex items-baseline gap-[var(--space-2)]">
                    {label}
                    <span className="font-[family-name:var(--font-mono)] opacity-70">{shortcut}</span>
                </span>
            }
        >
            {children}
        </Tooltip>
    );
}

//
// What a tooltip with a title and a detail shows and wraps.
//
export interface IDetailTooltipProps {
    // What the element is or does, in bold.
    title: string;

    // What that means, under it.
    detail: string;

    // The element the tooltip is for.
    children: ReactElement;
}

//
// Shows what the element is or does in bold, then a quieter line explaining it, as the style
// guide's Tip does, so a reader takes in the name first and the explanation after.
//
export function DetailTooltip({ title, detail, children }: IDetailTooltipProps): JSX.Element {
    return (
        <Tooltip title={<DetailTip title={title} detail={detail} />}>
            {children}
        </Tooltip>
    );
}

//
// What the content of a tooltip with a title and a detail shows.
//
export interface IDetailTipProps {
    // The bold line.
    title: string;

    // The quieter line under it.
    detail: string;
}

//
// Renders the title in bold and the detail under it, a little smaller and softer, as the style
// guide's Tip lays them out.
//
export function DetailTip({ title, detail }: IDetailTipProps): JSX.Element {
    return (
        <span className="flex flex-col gap-[2px] py-[2px]">
            <span className="font-[var(--weight-bold)]">{title}</span>
            <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">{detail}</span>
        </span>
    );
}

//
// What a full text tooltip shows and wraps.
//
export interface IFullTextTooltipProps {
    // The whole of the value the element shows cut short.
    text: string;

    // The data-id of the tooltip's content, so a test can read it.
    dataId: string;

    // The element that shows the value, cut short with an ellipsis when it does not fit.
    children: ReactElement;
}

//
// Shows the whole of a value that its element may cut short, such as a long path, as the style
// guide's tooltip for cut-off text does. A path breaks anywhere, so it wraps inside the tooltip.
//
export function FullTextTooltip({ text, dataId, children }: IFullTextTooltipProps): JSX.Element {
    return (
        <Tooltip title={<span data-id={dataId} className="[overflow-wrap:anywhere]">{text}</span>}>
            {children}
        </Tooltip>
    );
}

//
// One field a tooltip shows, with a button that copies it.
//
export interface ICopyField {
    // The field's name, shown small above its value.
    label: string;

    // The field's value, shown and copied as it is.
    value: string;

    // Whether the value shows in the code font, as a hash, an email or a path does.
    isCode: boolean;

    // Whether the value keeps its line breaks, as a commit's description does.
    isMultiline: boolean;
}

//
// Returns a field shown in the interface font on one line, such as a name.
//
export function textField(label: string, value: string): ICopyField {
    return {
        label,
        value,
        isCode: false,
        isMultiline: false,
    };
}

//
// Returns a field shown in the code font, such as a hash or a path.
//
export function codeField(label: string, value: string): ICopyField {
    return {
        label,
        value,
        isCode: true,
        isMultiline: false,
    };
}

//
// Returns a field that keeps its line breaks, such as a commit's description.
//
export function multilineField(label: string, value: string): ICopyField {
    return {
        label,
        value,
        isCode: false,
        isMultiline: true,
    };
}

//
// The Tailwind classes of the small square buttons inside a tooltip, its copy buttons and its pin
// button: the style guide's tooltip button fill, a little darker under the pointer, with the icon
// in the text colour, a little taller than a line of text.
//
export const tipButtonClasses = "h-[calc(var(--space-4)+var(--space-1))] w-[calc(var(--space-4)+var(--space-1))] flex-none p-0 text-[length:var(--icon-sm)] text-[var(--color-text)] shadow-none hover:bg-[var(--color-tooltip-button-hover)] hover:text-[var(--color-text)]";

//
// Picks the Tailwind class of a tooltip button's fill: the hover fill while the button is pressed
// in (as a pinned tooltip's button is) and the tooltip button fill otherwise.
//
export function tipButtonFillClass(isPressed: boolean): string {
    if (isPressed) {
        return "bg-[var(--color-tooltip-button-hover)]";
    }
    return "bg-[var(--color-tooltip-button)]";
}

//
// Picks the Tailwind classes that set how a field's value shows: the code font for a code field
// and kept line breaks for a multiline one.
//
export function fieldValueClasses(field: ICopyField): string {
    let classes = "";
    if (field.isCode) {
        classes += " font-[family-name:var(--font-mono)]";
    }
    if (field.isMultiline) {
        classes += " whitespace-pre-wrap";
    }
    return classes;
}

//
// What one field of a tooltip shows.
//
export interface ICopyFieldRowProps {
    // The field.
    field: ICopyField;

    // What shows at the end of the field's name, such as the pin button, or undefined.
    action: ReactNode | undefined;
}

//
// Renders one field as the style guide's CopyTip does: its name small and muted above, with the
// action at its end, then a light dotted line joining the value to its copy button, then the value
// with the button beside it. A click on the button copies the value and shows a tick for
// COPIED_DURATION_MS. The click stops at the button, so it never reaches the row the tooltip is on.
//
export function CopyFieldRow({ field, action }: ICopyFieldRowProps): JSX.Element {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) {
            return undefined;
        }
        const timer = setTimeout(() => setIsCopied(false), COPIED_DURATION_MS);
        return () => clearTimeout(timer);
    }, [isCopied]);

    let buttonLabel = `Copy ${field.label.toLowerCase()}`;
    let buttonIcon = faCopy;
    if (isCopied) {
        buttonLabel = "Copied";
        buttonIcon = faCheck;
    }

    return (
        <span className="flex flex-col gap-px">
            <span className="flex items-center gap-[var(--space-2)]">
                <span className="min-w-0 flex-1 text-[length:var(--text-xs)] font-[var(--weight-normal)] text-[var(--color-tooltip-muted)]">{field.label}</span>
                {action}
            </span>
            <span className="flex items-start gap-[var(--space-2)] border-t border-dotted border-[var(--color-tooltip-border)] pt-[calc(var(--space-1)*1.5+1px)]">
                <span className={`min-w-0 flex-1 [overflow-wrap:anywhere]${fieldValueClasses(field)}`}>{field.value}</span>
                <IconButton
                    size="small"
                    aria-label={buttonLabel}
                    onClick={event => {
                        event.stopPropagation();
                        copyText(field.value, () => setIsCopied(true));
                    }}
                    className={`-mt-[calc(var(--space-1)/2)] ${tipButtonClasses} ${tipButtonFillClass(false)}`}
                >
                    <FontAwesomeIcon icon={buttonIcon} />
                </IconButton>
            </span>
        </span>
    );
}

//
// Picks what shows at the end of a field's name: the action for the first field and nothing for
// the rest, so the pin button sits on the tooltip's first line.
//
export function firstFieldAction(index: number, action: ReactNode | undefined): ReactNode | undefined {
    if (index === 0) {
        return action;
    }
    return undefined;
}

//
// What a tooltip of fields shows.
//
export interface ICopyTipProps {
    // The fields, in the order they show.
    fields: ICopyField[];

    // What shows at the end of the first field's name, such as the pin button, or undefined.
    action: ReactNode | undefined;
}

//
// Renders the fields one under another with a copy button on each and the action at the end of
// the first field's name, above the copy buttons, as the style guide's CopyTip does.
//
export function CopyTip({ fields, action }: ICopyTipProps): JSX.Element {
    return (
        <span className="flex flex-col gap-[var(--space-2)] py-[var(--space-1)]">
            {fields.map((field, index) => (
                <CopyFieldRow key={field.label} field={field} action={firstFieldAction(index, action)} />
            ))}
        </span>
    );
}

//
// What a pinnable tooltip shows and wraps.
//
export interface IPinnableTooltipProps {
    // Returns the tooltip's body, such as its fields with their copy buttons, given the pin
    // button, which the body puts at the end of its first line so it takes no width of its own.
    tip(pinButton: ReactNode): ReactNode;

    // The data-id of the tooltip's body, so a test can read it. The pin button's is this with
    // "-pin" after it.
    dataId: string;

    // How long the pointer rests on the element before the tooltip opens, in milliseconds.
    enterDelayMs: number;

    // The widest the tooltip goes, as a CSS length.
    maxWidth: string;

    // The element the tooltip is for, which takes the tooltip's events and ref.
    children: ReactElement;
}

//
// Renders the tooltip to the right of its element, flipping to the left where there is no room,
// with its pin button at the end of its body's first line, as the style guide's pinnable tooltip
// does. The pin button keeps the tooltip open after the pointer leaves and turns into a close
// button. While the tooltip is open or pinned it listens for keys on the window, in the capture
// phase, which comes before the repo explorer's own listener on the document. P pins an open
// tooltip and closes a pinned one. Escape closes either. A key it acts on goes no further, so
// P and Escape leave the explorer's panes as they were. A click on the pin button stops there, so
// it never reaches the row the tooltip is on.
//
export function PinnableTooltip({ tip, dataId, enterDelayMs, maxWidth, children }: IPinnableTooltipProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    function close(): void {
        setIsPinned(false);
        setIsOpen(false);
    }

    const isShown = isOpen || isPinned;

    useEffect(() => {
        if (!isShown) {
            return undefined;
        }
        function onKeyDown(event: KeyboardEvent): void {
            const action = tooltipKeyAction({
                key: event.key,
                hasModifier: event.ctrlKey || event.altKey || event.metaKey,
                isTyping: isTypingTarget(event.target),
            }, isPinned);
            if (action === "none") {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (action === "pin") {
                setIsPinned(true);
            }
            else {
                close();
            }
        }
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [isShown, isPinned]);

    let pinLabel = "Pin the tooltip (P)";
    let pinIcon = faThumbtack;
    if (isPinned) {
        pinLabel = "Close the tooltip (P or Escape)";
        pinIcon = faXmark;
    }
    const pinButton = (
        <IconButton
            data-id={`${dataId}-pin`}
            size="small"
            aria-label={pinLabel}
            aria-pressed={isPinned}
            onClick={event => {
                event.stopPropagation();
                if (isPinned) {
                    close();
                }
                else {
                    setIsPinned(true);
                }
            }}
            className={`mb-[var(--space-1)] ${tipButtonClasses} ${tipButtonFillClass(isPinned)}`}
        >
            <FontAwesomeIcon icon={pinIcon} />
        </IconButton>
    );

    return (
        <Tooltip
            open={isShown}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            enterDelay={enterDelayMs}
            placement="right"
            slotProps={{
                tooltip: {
                    sx: {
                        maxWidth,
                    },
                },
                popper: {
                    disablePortal: false,
                },
            }}
            title={<span data-id={dataId} className="block">{tip(pinButton)}</span>}
        >
            {children}
        </Tooltip>
    );
}
