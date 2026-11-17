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
        styleOverrides: {
            root: {
                textTransform: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-md)",
                fontWeight: "var(--weight-medium)",
                lineHeight: "var(--leading-normal)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-md)",
                transition: "background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
                "&:active": {
                    transform: "translateY(1px)",
                },
                "&:focus-visible": focusRing,
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
            // Every kind of button has a 1px border, drawn as an inset line so it adds no size.
            //
            contained: {
                backgroundColor: "var(--color-accent)",
                color: "var(--color-on-accent)",
                boxShadow: "inset 0 0 0 1px var(--color-accent-hover)",
                "&:hover": {
                    backgroundColor: "var(--color-accent-hover)",
                    boxShadow: "inset 0 0 0 1px var(--color-accent-hover), var(--shadow-raised)",
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
            },
            text: {
                color: "var(--color-accent)",
                boxShadow: "inset 0 0 0 1px var(--color-border)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
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
                transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
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
                    transition: "border-color var(--duration-fast) var(--ease-standard)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-text-muted)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-focus)",
                },
            },
            input: {
                "&::placeholder": {
                    color: "var(--color-text-muted)",
                    opacity: 1,
                },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundColor: "var(--color-panel)",
                backgroundImage: "none",
                color: "var(--color-text)",
            },
            outlined: {
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
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-overlay)",
                },
            },
        ],
    },
    MuiDialog: {
        defaultProps: {
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
                padding: "var(--space-2) var(--space-6) var(--space-6)",
            },
        },
    },
    MuiPopover: {
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
                "&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible": {
                    backgroundColor: "var(--color-selected)",
                },
            },
        },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                padding: "var(--space-1) var(--space-3)",
                transition: "background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
                "&:hover": {
                    backgroundColor: "var(--color-hover)",
                },
                "&.Mui-focusVisible": {
                    backgroundColor: "var(--color-hover)",
                    outline: "var(--focus-ring-width) solid var(--color-focus)",
                    outlineOffset: "calc(var(--focus-ring-width) * -1)",
                },
                //
                // The selected row carries the selection colour and a line down its left edge in
                // the colour of a selection inside the active pane.
                //
                "&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible": {
                    backgroundColor: "var(--color-selected)",
                    boxShadow: "inset 2px 0 0 var(--color-select-item)",
                },
            },
        },
    },
    MuiDivider: {
        styleOverrides: {
            root: {
                borderColor: "var(--color-border)",
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
                },
            },
            ...refChipKinds.map(kind => ({
                props: {
                    variant: kind,
                },
                //
                // Each kind of ref is outlined in its colour, with no fill.
                //
                style: {
                    backgroundColor: "transparent",
                    boxShadow: `inset 0 0 0 1px ${refChipColours[kind]}`,
                    color: "var(--color-text)",
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
        },
    },
};
