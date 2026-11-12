//
// The style that marks the commit explorer's active pane: its border in the theme's primary
// colour, so the user sees which pane the keys act on.
//

import { useTheme } from "@mui/material/styles";
import { CSSProperties } from "react";

//
// Returns the style of a pane's card: a border in the MaterialUI theme's primary colour while the
// pane is active, and no style of its own otherwise, so the card keeps its grey border. It reads
// the colour from the theme, so it follows the light and dark themes.
//
export function useActivePaneStyle(isActive: boolean): CSSProperties | undefined {
    const theme = useTheme();
    if (!isActive) {
        return undefined;
    }
    return {
        borderColor: theme.palette.primary.main,
    };
}
