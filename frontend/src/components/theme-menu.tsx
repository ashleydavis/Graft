//
// The theme menu: the top bar's button that shows the theme in use, and the drop-down it opens
// where the user picks Light, Dark or System.
//

import { faChevronDown, faCircleHalfStroke, faMoon, faSun, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { JSX, useState } from "react";
import { themeButtonLabel, themeOptions, ThemeSetting } from "../lib/theme";

//
// What the theme menu shows and what it reports.
//
export interface IThemeMenuProps {
    // The theme the user picked, which the button shows and the menu marks.
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
// opens a menu under it, aligned to its right edge, headed "Theme", with a row for each setting
// laid out as the style guide's menu items: the setting's muted icon, its name and what it does
// below it. The row of the one in use has the selected colour, which marks it as the style guide's
// select list marks its chosen item. The button has the style guide's outlined button border and
// the menu sits a spacing step below it. Choosing a row closes the menu and reports the setting,
// unless it is the one already in use.
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
            <Tooltip title={label}>
                <ButtonBase
                    data-id="theme-button"
                    aria-label={label}
                    aria-haspopup="menu"
                    aria-expanded={anchor !== undefined}
                    onClick={event => setAnchor(event.currentTarget)}
                    className="flex h-[calc(var(--icon-lg)+var(--space-3))] flex-none items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[var(--color-text)] border border-[var(--color-border-control)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-hover)] focus-visible:outline-solid focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[var(--color-focus)]"
                >
                    <FontAwesomeIcon data-id={`theme-icon-${setting}`} icon={themeIcons[setting]} className="text-[length:var(--icon-lg)]" />
                    <FontAwesomeIcon icon={faChevronDown} className={`text-[length:var(--icon-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${anchor !== undefined ? "rotate-180" : ""}`} />
                </ButtonBase>
            </Tooltip>
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
                        className: "mt-[var(--space-1)] w-72",
                        elevation: 0,
                    },
                    list: {
                        className: "flex flex-col",
                    },
                }}
            >
                <li data-id="theme-menu-heading" className="px-[var(--space-3)] pt-[var(--space-2)] pb-[var(--space-1)] text-[length:var(--text-sm)] font-[var(--weight-bold)] leading-[var(--leading-normal)] text-[var(--color-text-muted)]" role="presentation">
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
                        >
                            <ListItemIcon className="min-w-[var(--space-6)] text-[length:var(--icon-md)] text-[var(--color-text-muted)]">
                                <FontAwesomeIcon icon={themeIcons[option.setting]} fixedWidth={true} />
                            </ListItemIcon>
                            <ListItemText
                                primary={option.name}
                                secondary={option.description}
                                className="m-0"
                                slotProps={{
                                    primary: {
                                        className: "text-[length:var(--text-md)] text-[var(--color-text)]",
                                    },
                                    secondary: {
                                        className: "text-[length:var(--text-sm)] text-[var(--color-text-muted)]",
                                    },
                                }}
                            />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}
