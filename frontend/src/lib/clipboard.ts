//
// Copies text to the clipboard for Graft's copy buttons: the copy button beside a Git command and
// the copy buttons of a tooltip's fields.
//

//
// How long a copy button shows its tick after a copy, in milliseconds. A second and a half is long
// enough to see that the copy worked and short enough that the button is back to Copy before it is
// needed again, as in the style guide's copy buttons.
//
export const COPIED_DURATION_MS = 1500;

//
// Writes the text to the clipboard and calls onCopied once it is there, so the button can show the
// tick. It reports a failure in the log, because a copy button has nowhere else to show it.
//
export function copyText(text: string, onCopied: () => void): void {
    navigator.clipboard.writeText(text)
        .then(onCopied)
        .catch(error => {
            console.error(`Graft could not copy "${text}" to the clipboard: ${String(error)}. Nothing was copied, so look at whether the web view allows the clipboard.`);
        });
}
