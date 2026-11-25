//
// The repo explorer's panes and the keys that work in each, with what each key does there. The
// keyboard shortcuts overlay lists a pane's keys from here and the repo explorer page takes the
// keys it handles from here, so a key and its description sit in one place.
//

import { PaneOrPage } from "./active-pane";

//
// One key that works in a pane and what it does there.
//
export interface IPaneKey {
    // The key as KeyboardEvent.key names it, such as "ArrowUp", which the repo explorer page
    // matches.
    eventKey: string;

    // The key as the overlay shows it, such as "Up".
    keys: string;

    // What the key does in the pane, such as "Select the commit above".
    label: string;
}

//
// The keys that maximise and collapse a pane, which work in every pane, so every pane lists them
// last. The key is the lower case letter, which the repo explorer matches in either case.
//
const PANE_SIZE_KEYS: IPaneKey[] = [
    {
        eventKey: "m",
        keys: "M",
        label: "Maximise the pane or put the panes back",
    },
    {
        eventKey: "c",
        keys: "C",
        label: "Collapse the pane or restore it",
    },
];

//
// Makes the keys that move the selection a page at a time and to the first and last item in a pane
// that lists items, given what each does there.
//
function listJumpKeys(pageUpLabel: string, pageDownLabel: string, firstLabel: string, lastLabel: string): IPaneKey[] {
    return [
        {
            eventKey: "PageUp",
            keys: "Page Up",
            label: pageUpLabel,
        },
        {
            eventKey: "PageDown",
            keys: "Page Down",
            label: pageDownLabel,
        },
        {
            eventKey: "Home",
            keys: "Home",
            label: firstLabel,
        },
        {
            eventKey: "End",
            keys: "End",
            label: lastLabel,
        },
    ];
}

//
// The keys of every pane, written once, in the order the overlay lists them. Each pane lists only
// the keys that do something in it, as docs/spec/repo-explorer/keys/detail.md describes them, so the
// overlay lists what each key does in the active pane. A page or pane with no entry has no keys of
// its own.
//
export const PANE_KEYS: Partial<Record<PaneOrPage, IPaneKey[]>> = {
    "repo-details-pane": [
        {
            eventKey: "ArrowUp",
            keys: "Up",
            label: "Select the link above",
        },
        {
            eventKey: "ArrowDown",
            keys: "Down",
            label: "Select the link below",
        },
        ...listJumpKeys("Select the first link", "Select the last link", "Select the first link", "Select the last link"),
        {
            eventKey: "ArrowRight",
            keys: "Right",
            label: "Make the pane to the right active",
        },
        {
            eventKey: "Enter",
            keys: "Enter",
            label: "Open the selected link's pane",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the rightmost pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "commit-pane": [
        {
            eventKey: "ArrowUp",
            keys: "Up",
            label: "Select the commit above",
        },
        {
            eventKey: "ArrowDown",
            keys: "Down",
            label: "Select the commit below",
        },
        ...listJumpKeys("Select the commit a page above", "Select the commit a page below", "Select the first commit", "Select the last commit read"),
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the repo details pane active",
        },
        {
            eventKey: "ArrowRight",
            keys: "Right",
            label: "Make the commit details pane active",
        },
        {
            eventKey: "Enter",
            keys: "Enter",
            label: "Open the selected commit's details",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the rightmost pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "commit-details-pane": [
        {
            eventKey: "ArrowUp",
            keys: "Up",
            label: "Open the commit or file above",
        },
        {
            eventKey: "ArrowDown",
            keys: "Down",
            label: "Open the commit or file below",
        },
        ...listJumpKeys("Open the commit or file a page above", "Open the commit or file a page below", "Open the first commit or file", "Open the last commit or file"),
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the commit pane active",
        },
        {
            eventKey: "ArrowRight",
            keys: "Right",
            label: "Make the file pane active",
        },
        {
            eventKey: "Enter",
            keys: "Enter",
            label: "Open the selected file's diff",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the rightmost pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "file-pane": [
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the commit details pane active",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the file pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "changes-pane": [
        {
            eventKey: "ArrowUp",
            keys: "Up",
            label: "Select the changed file above",
        },
        {
            eventKey: "ArrowDown",
            keys: "Down",
            label: "Select the changed file below",
        },
        ...listJumpKeys("Select the changed file a page above", "Select the changed file a page below", "Select the first changed file", "Select the last changed file"),
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the repo details pane active",
        },
        {
            eventKey: "ArrowRight",
            keys: "Right",
            label: "Make the file pane active",
        },
        {
            eventKey: "Enter",
            keys: "Enter",
            label: "Open the selected file's diff",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the rightmost pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "working-file-pane": [
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the changes pane active",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the file pane",
        },
        ...PANE_SIZE_KEYS,
    ],
    "tag-pane": [
        {
            eventKey: "ArrowLeft",
            keys: "Left",
            label: "Make the repo details pane active",
        },
        {
            eventKey: "Escape",
            keys: "Escape",
            label: "Close the tag pane",
        },
        ...PANE_SIZE_KEYS,
    ],
};

