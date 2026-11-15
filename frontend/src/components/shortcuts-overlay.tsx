//
// The keyboard shortcuts overlay: a dialog over the app that lists Graft's keyboard shortcuts,
// which the Keyboard Shortcuts action shows and closes.
//

import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { JSX, useEffect, useState } from "react";

//
// The name of the backend's Keyboard Shortcuts action (backend/src/lib/actions.zig), whose shortcut
// is `?`. The overlay registers its handler under this name and removes it under the same name.
//
export const shortcutsOverlayAction = "toggle-shortcuts-overlay";

//
// Shows the keyboard shortcuts overlay while it is open, with placeholder text in place of the
// shortcuts. It registers the handler of the Keyboard Shortcuts action, so Ziggy runs it when the
// user presses `?` outside a text box: the handler opens the overlay when it is closed and closes
// it when it is open. Escape closes it too. A click outside the overlay leaves it open, so only `?`
// and Escape close it. The handler is removed when the overlay goes, so a later overlay can
// register it again.
//
export function ShortcutsOverlay(): JSX.Element {
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        window.ziggy.registerAction(shortcutsOverlayAction, () => {
            setOpen(wasOpen => !wasOpen);
        });
        return () => {
            window.ziggy.removeAction(shortcutsOverlayAction);
        };
    }, []);

    return (
        <Dialog
            data-id="shortcuts-overlay"
            open={isOpen}
            onClose={(_event, reason) => {
                if (reason === "escapeKeyDown") {
                    setOpen(false);
                }
            }}
            fullWidth={true}
            maxWidth="sm"
        >
            <DialogTitle data-id="shortcuts-overlay-title">
                Keyboard shortcuts
            </DialogTitle>
            <DialogContent>
                <p data-id="shortcuts-overlay-placeholder" className="text-sm text-gray-600 dark:text-gray-400">
                    Placeholder: Graft's keyboard shortcuts are listed here.
                </p>
            </DialogContent>
        </Dialog>
    );
}
