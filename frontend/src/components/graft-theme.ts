//
// The style guide's look for MaterialUI's components: every colour, size, radius, shadow and timing
// is a CSS variable from graft.css, so the components follow the dark class AppTheme sets on the
// page.
//

import type { Components, Theme, TypographyVariantsOptions } from "@mui/material/styles";

//
// Adds the style guide's Paper variants: "dialog", the surface of a dialog, and "overlay", the
// surface of a menu or list that floats over the page.
//
declare module "@mui/material/Paper" {
    interface PaperPropsVariantOverrides {
        dialog: true;
        overlay: true;
    }
}

//
// Adds the style guide's Chip variants: "count", a number beside a label, and one variant per kind
// of Git ref, each marked with its own colour.
//
declare module "@mui/material/Chip" {
    interface ChipPropsVariantOverrides {
        count: true;
        current: true;
        branch: true;
        remote: true;
        tag: true;
    }
}

//
// A kind of Git ref that its chip outlines in the ref's own colour.
//
export type RefChipKind = "branch" | "remote" | "tag";

//
// The kinds of Git ref whose chips are outlined, one Chip variant each.
//
export const refChipKinds: RefChipKind[] = ["branch", "remote", "tag"];

//
// The colour token that marks each kind of Git ref on its chip's outline, as the style guide's
// badges page has them.
//
export const refChipColours: Record<RefChipKind, string> = {
    branch: "var(--color-accent)",
    remote: "var(--color-info)",
    tag: "var(--color-warning)",
};

//
// The typography AppTheme gives MaterialUI: the style guide's sans font, so every component's text
// is in Mona Sans.
//
export const graftTypography: TypographyVariantsOptions = {
    fontFamily: "var(--font-sans)",
};

//
// The focus ring every control shows while it has the keyboard focus, from the style guide's
// focus tokens.
//
const focusRing = {
    outline: "var(--focus-ring-width) solid var(--color-focus)",
    outlineOffset: "var(--focus-ring-offset)",
};

//
// The style guide's look for each MaterialUI component Graft uses, which AppTheme puts in its
// MaterialUI theme. Styles go in styleOverrides and variants instead of the palette, because
// MaterialUI parses palette values to work out hover and contrast colours and that parsing accepts
// only literal colours, not CSS variables.
//
export const graftComponents: Components<Omit<Theme, "components">> = {
    MuiButton: {
        defaultProps: {
            disableElevation: true,
        },
        variants: [
            //
            // The danger button: a red border, red words and a red icon on no fill, so an action
            // that loses work is marked without a block of red. Under the pointer the border
            // thickens and the fill stays clear, so the red words keep the contrast they have on
            // the panel.
            //
            {
                props: {
                    variant: "outlined",
                    color: "error",
                },
                style: {
                    backgroundColor: "transparent",
                    color: "var(--color-danger)",
                    border: "none",
                    boxShadow: "inset 0 0 0 1px var(--color-danger)",
                    "&:hover": {
                        backgroundColor: "transparent",
                        border: "none",
                        boxShadow: "inset 0 0 0 2px var(--color-danger)",
                    },
                },
            },
        ],
        styleOverrides: {
            root: {
                textTransform: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-md)",
                fontWeight: "var(--weight-medium)",
                lineHeight: "var(--leading-normal)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-md)",
                transition: "background-color var(--duration-fast) var(--ease-standard)",
                "&:focus-visible": focusRing,
            },
            sizeSmall: {
                padding: "var(--space-1) var(--space-3)",
            },
            sizeLarge: {
                padding: "var(--space-3) var(--space-6)",
                fontSize: "var(--text-lg)",
            },
            startIcon: {
                "& > *:nth-of-type(1)": {
                    fontSize: "var(--icon-md)",
                },
            },
            //
            // Every kind of button has a 1px border, drawn as an inset line so it adds no size and
            // every kind of button stays the same height.
            //
            contained: {
                backgroundColor: "var(--color-accent)",
                color: "var(--color-on-accent)",
                boxShadow: "inset 0 0 0 1px var(--color-accent-hover)",
                "&:hover": {
                    backgroundColor: "var(--color-accent-hover)",
                    boxShadow: "inset 0 0 0 1px var(--color-accent-hover)",
                },
                "&.Mui-disabled": {
                    backgroundColor: "var(--color-disabled)",
                    color: "var(--color-text-disabled)",
                    boxShadow: "inset 0 0 0 1px var(--color-border)",
                },
            },
            outlined: {
                borderColor: "var(--color-border-control)",
                color: "var(--color-text)",
                "&:hover": {
                    borderColor: "var(--color-text-muted)",
                    backgroundColor: "var(--color-hover)",
                },
                "&.Mui-disabled": {
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-disabled)",
                },
            },
            text: {
                color: "var(--color-accent)",
                boxShadow: "inset 0 0 0 1px var(--color-border)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
                },
                "&.Mui-disabled": {
                    color: "var(--color-text-disabled)",
                    boxShadow: "inset 0 0 0 1px var(--color-border)",
                },
            },
        },
    },
    MuiIconButton: {
        styleOverrides: {
            //
            // An icon button is square, its icon centred with room on every side between it and
            // the border, and its border shows it is a button.
            //
            root: {
                width: "calc(var(--icon-lg) + var(--space-3))",
                height: "calc(var(--icon-lg) + var(--space-3))",
                padding: 0,
                flex: "none",
                fontSize: "var(--icon-lg)",
                color: "var(--color-text-muted)",
                borderRadius: "var(--radius-md)",
                boxShadow: "inset 0 0 0 1px var(--color-border)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
                    color: "var(--color-text)",
                },
                "&.Mui-disabled": {
                    color: "var(--color-text-disabled)",
                },
                "&:focus-visible": focusRing,
            },
            sizeSmall: {
                width: "calc(var(--icon-md) + var(--space-3))",
                height: "calc(var(--icon-md) + var(--space-3))",
                fontSize: "var(--icon-md)",
            },
        },
        variants: [
            {
                //
                // A danger icon button, such as Discard, looks like the danger button: the icon and
                // the border in the danger colour, the border thickening on hover.
                //
                props: {
                    color: "error",
                },
                style: {
                    color: "var(--color-danger)",
                    boxShadow: "inset 0 0 0 1px var(--color-danger)",
                    "&:hover": {
                        backgroundColor: "transparent",
                        color: "var(--color-danger)",
                        boxShadow: "inset 0 0 0 2px var(--color-danger)",
                    },
                    "&.Mui-disabled": {
                        color: "var(--color-text-disabled)",
                        boxShadow: "inset 0 0 0 1px var(--color-border)",
                    },
                },
            },
        ],
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: {
                backgroundColor: "var(--color-panel)",
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-md)",
                borderRadius: "var(--radius-md)",
                "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-border-control)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-text-muted)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-focus)",
                },
                "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-danger)",
                },
                "&.Mui-disabled": {
                    backgroundColor: "var(--color-disabled)",
                },
                "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-border)",
                },
            },
            input: {
                "&::placeholder": {
                    color: "var(--color-text-muted)",
                    opacity: 1,
                },
                "&.Mui-disabled": {
                    WebkitTextFillColor: "var(--color-text-disabled)",
                },
            },
        },
    },
    MuiInputLabel: {
        styleOverrides: {
            root: {
                color: "var(--color-text-muted)",
                fontSize: "var(--text-md)",
                "&.Mui-focused": {
                    color: "var(--color-focus)",
                },
                "&.Mui-error": {
                    color: "var(--color-danger)",
                },
                "&.Mui-disabled": {
                    color: "var(--color-text-disabled)",
                },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            outlined: {
                backgroundColor: "var(--color-panel)",
                backgroundImage: "none",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
            },
        },
        variants: [
            {
                props: {
                    variant: "overlay",
                },
                style: {
                    backgroundColor: "var(--color-panel)",
                    backgroundImage: "none",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-overlay)",
                },
            },
            {
                props: {
                    variant: "dialog",
                },
                style: {
                    backgroundColor: "var(--color-panel)",
                    backgroundImage: "none",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-overlay)",
                },
            },
        ],
    },
    MuiDialog: {
        defaultProps: {
            disableScrollLock: true,
            slotProps: {
                paper: {
                    variant: "dialog",
                },
            },
        },
    },
    MuiBackdrop: {
        styleOverrides: {
            root: {
                backgroundColor: "var(--color-scrim)",
            },
            invisible: {
                backgroundColor: "transparent",
            },
        },
    },
    MuiDialogTitle: {
        styleOverrides: {
            root: {
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-bold)",
                padding: "var(--space-4) var(--space-6) var(--space-2)",
            },
        },
    },
    MuiDialogContent: {
        styleOverrides: {
            root: {
                padding: "var(--space-2) var(--space-6)",
            },
        },
    },
    //
    // Popups mount at the end of the page, so a pane or column that cuts off what overflows it
    // never cuts off a popup, and a pane to the right never paints over one. They take the light or
    // dark class AppTheme sets on the page's root element.
    //
    MuiPopover: {
        defaultProps: {
            disablePortal: false,
            //
            // The page keeps its scrollbar while a popover or menu is open, so the page does not
            // jump as it opens and closes.
            //
            disableScrollLock: true,
        },
        styleOverrides: {
            paper: {
                backgroundColor: "var(--color-panel)",
                backgroundImage: "none",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-overlay)",
            },
        },
    },
    //
    // A menu has a spacing step above its first item and below its last, and half a step at each
    // side.
    //
    MuiMenu: {
        defaultProps: {
            disableScrollLock: true,
        },
        styleOverrides: {
            list: {
                padding: "var(--space-2) var(--space-1)",
            },
        },
    },
    MuiMenuItem: {
        styleOverrides: {
            root: {
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-md)",
                minHeight: "auto",
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                gap: "var(--space-2)",
                transition: "background-color var(--duration-fast) var(--ease-standard)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
                },
                "&.Mui-focusVisible": {
                    backgroundColor: "var(--color-hover)",
                    outline: "var(--focus-ring-width) solid var(--color-focus)",
                    outlineOffset: "calc(var(--focus-ring-width) * -1)",
                },
                "&.Mui-selected, &.Mui-selected:hover": {
                    backgroundColor: "var(--color-selected)",
                },
                "&.Mui-disabled": {
                    opacity: 1,
                    color: "var(--color-text-disabled)",
                },
            },
        },
    },
    //
    // Every tooltip is a solid slate panel with a thin border and no arrow, cooler than the page
    // in both themes, and waits a moment before it shows, so moving the pointer across a toolbar
    // does not flash a tooltip at each button. It mounts at the end of the page, so a box that
    // cuts off what overflows it never cuts off its tooltip.
    //
    MuiTooltip: {
        defaultProps: {
            arrow: false,
            enterDelay: 400,
            enterNextDelay: 150,
            slotProps: {
                popper: {
                    disablePortal: false,
                },
            },
        },
        styleOverrides: {
            //
            // A tooltip sets every text style of its own instead of taking the control's, and
            // takes the width of its text up to its widest, so a tooltip on a button in a narrow
            // spot does not squeeze its words onto many lines.
            //
            tooltip: {
                width: "max-content",
                maxWidth: "280px",
                backgroundColor: "var(--color-tooltip)",
                border: "1px solid var(--color-tooltip-border)",
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                textTransform: "none",
                letterSpacing: "normal",
                lineHeight: "var(--leading-tight)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "calc(var(--radius-lg) * 2)",
                boxShadow: "var(--shadow-overlay)",
            },
        },
    },
    //
    // A popper mounts at the end of the page, as the tooltips do.
    //
    MuiPopper: {
        defaultProps: {
            disablePortal: false,
        },
    },
    //
    // A list's heading, as the keyboard shortcuts overlay heads each group, in the style guide's
    // muted bold text, scrolling with its list.
    //
    MuiListSubheader: {
        styleOverrides: {
            root: {
                position: "static",
                backgroundColor: "transparent",
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-bold)",
                lineHeight: "var(--leading-normal)",
                padding: "var(--space-2) var(--space-3) var(--space-1)",
            },
        },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                transition: "background-color var(--duration-fast) var(--ease-standard)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
                },
                "&.Mui-focusVisible": {
                    backgroundColor: "var(--color-hover)",
                    outline: "var(--focus-ring-width) solid var(--color-focus)",
                    outlineOffset: "calc(var(--focus-ring-width) * -1)",
                },
                "&.Mui-selected, &.Mui-selected:hover": {
                    backgroundColor: "var(--color-selected)",
                },
            },
        },
    },
    //
    // A loading placeholder is a block in the border colour with small rounded corners, as the
    // style guide draws it, so it shows in light and dark mode alike.
    //
    MuiSkeleton: {
        styleOverrides: {
            root: {
                backgroundColor: "var(--color-border)",
                borderRadius: "var(--radius-sm)",
            },
        },
    },
    MuiBreadcrumbs: {
        styleOverrides: {
            root: {
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-md)",
                color: "var(--color-text-muted)",
            },
            separator: {
                marginLeft: "var(--space-2)",
                marginRight: "var(--space-2)",
                color: "var(--color-text-muted)",
                fontSize: "var(--icon-sm)",
            },
        },
    },
    MuiAvatar: {
        styleOverrides: {
            root: {
                backgroundColor: "var(--color-accent)",
                color: "var(--color-on-accent)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-raised)",
            },
        },
    },
    MuiChip: {
        variants: [
            {
                props: {
                    variant: "count",
                },
                style: {
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-raised)",
                    color: "var(--color-text-muted)",
                },
            },
            {
                props: {
                    variant: "current",
                },
                style: {
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-on-accent)",
                    "& .MuiChip-icon": {
                        color: "var(--color-on-accent)",
                    },
                },
            },
            ...refChipKinds.map(kind => ({
                props: {
                    variant: kind,
                },
                //
                // Each kind of ref is outlined in its colour, with no fill, and its icon takes the
                // same colour.
                //
                style: {
                    backgroundColor: "transparent",
                    boxShadow: `inset 0 0 0 1px ${refChipColours[kind]}`,
                    color: "var(--color-text)",
                    "& .MuiChip-icon": {
                        color: refChipColours[kind],
                    },
                },
            })),
        ],
        styleOverrides: {
            root: {
                height: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-normal)",
                borderRadius: "var(--radius-full)",
                gap: "var(--space-1)",
                //
                // Half a spacing step above the text, so the lowercase letters of a ref name sit in
                // the middle of the badge.
                //
                padding: "calc(var(--space-1) / 2) var(--space-2) 0",
            },
            label: {
                padding: 0,
            },
            //
            // The root's padding above the text moves the badge's content down half of it, so the
            // icon is raised by the whole step to sit in the middle of the badge.
            //
            icon: {
                margin: "calc(var(--space-1) / -2) 0 0",
                fontSize: "var(--icon-sm)",
            },
            deleteIcon: {
                margin: 0,
                fontSize: "var(--icon-sm)",
                color: "var(--color-text-muted)",
                "&:hover": {
                    color: "var(--color-text)",
                },
            },
        },
    },
};
