//
// The theme menu: the top bar's button that shows the theme in use, and the drop-down it opens
// where the user picks Light, Dark or System.
//

import { faCheck, faChevronDown, faCircleHalfStroke, faMoon, faSun, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonBase, Menu, MenuItem } from "@mui/material";
import { JSX, useState } from "react";
import { themeButtonLabel, themeOptions, ThemeSetting } from "../lib/theme";

//
// What the theme menu shows and what it reports.
//
export interface IThemeMenuProps {
    // The theme the user picked, which the button shows and the menu ticks.
    setting: ThemeSetting;

    // Called with the theme the user chooses from the menu.
    onChooseSetting(setting: ThemeSetting): void;
}

//
// Each setting's icon: the sun for light, the moon for dark and a half filled circle for following
// the system.
//
export const themeIcons: Record<ThemeSetting, IconDefinition> = {
    light: faSun,
    dark: faMoon,
    system: faCircleHalfStroke,
};

//
// Shows the theme in use as its icon with a small chevron, so it reads as a drop-down. A click
// opens a menu under it, aligned to its right edge, headed "Theme", with a row for each setting:
// the setting's icon in a soft tile, its name, what it does and a tick on the one in use. Choosing
// a row closes the menu and reports the setting, unless it is the one already in use.
//
export function ThemeMenu({ setting, onChooseSetting }: IThemeMenuProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement | undefined>(undefined);
    const label = themeButtonLabel(setting);

    function choose(chosen: ThemeSetting): void {
        setAnchor(undefined);
        if (chosen !== setting) {
            onChooseSetting(chosen);
        }
    }

    return (
        <>
            <ButtonBase
                data-id="theme-button"
                aria-label={label}
                title={label}
                aria-haspopup="menu"
                aria-expanded={anchor !== undefined}
                onClick={event => setAnchor(event.currentTarget)}
                className="flex h-[calc(var(--icon-lg)+var(--space-3))] items-center gap-1.5 rounded-[var(--radius-md)] px-2 text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
                <FontAwesomeIcon data-id={`theme-icon-${setting}`} icon={themeIcons[setting]} className="text-[length:var(--icon-md)]" />
                <FontAwesomeIcon icon={faChevronDown} className={`text-[length:var(--icon-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${anchor !== undefined ? "rotate-180" : ""}`} />
            </ButtonBase>
            <Menu
                data-id="theme-menu"
                open={anchor !== undefined}
                anchorEl={anchor}
                onClose={() => setAnchor(undefined)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                slotProps={{
                    paper: {
                        className: "mt-2 w-72",
                        elevation: 0,
                    },
                    list: {
                        className: "flex flex-col gap-0.5",
                    },
                }}
            >
                <li data-id="theme-menu-heading" className="px-3 pb-1 pt-1 text-[length:var(--text-sm)] font-[var(--weight-bold)] text-[var(--color-text-muted)]" role="presentation">
                    Theme
                </li>
                {themeOptions.map(option => {
                    const isChosen = option.setting === setting;
                    return (
                        <MenuItem
                            key={option.setting}
                            data-id={`theme-option-${option.setting}`}
                            selected={isChosen}
                            onClick={() => choose(option.setting)}
                            className="gap-3 py-2"
                        >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${isChosen ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]" : "bg-[var(--color-raised)] text-[var(--color-text-muted)]"}`}>
                                <FontAwesomeIcon icon={themeIcons[option.setting]} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-[length:var(--text-md)] font-[var(--weight-medium)] text-[var(--color-text)]">{option.name}</span>
                                <span className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{option.description}</span>
                            </span>
                            <span className="flex w-4 justify-center text-[var(--color-accent)]">
                                {isChosen && <FontAwesomeIcon data-id={`theme-option-${option.setting}-check`} icon={faCheck} />}
                            </span>
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}
