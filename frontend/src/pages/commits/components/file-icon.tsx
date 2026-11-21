//
// The icon in front of a file's path on the commits page, picked by the file's name or extension,
// as the style guide's file icon is.
//

import {
    faBook,
    faCodeBranch,
    faCube,
    faDatabase,
    faFile,
    faFileAudio,
    faFileCode,
    faFileCsv,
    faFileImage,
    faFileLines,
    faFilePdf,
    faFileVideo,
    faFileZipper,
    faGear,
    faLock,
    faPalette,
    faTerminal,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { JSX } from "react";

//
// Icons for whole file names, which win over the extension, the style guide's list.
//
const NAME_ICONS: Record<string, IconDefinition> = {
    ".gitignore": faCodeBranch,
    ".gitattributes": faCodeBranch,
    ".gitmodules": faCodeBranch,
    "bun.lock": faLock,
    "package-lock.json": faLock,
    "yarn.lock": faLock,
    "Cargo.lock": faLock,
    "package.json": faCube,
    "build.zig.zon": faCube,
    "Dockerfile": faCube,
    "LICENSE": faBook,
};

//
// Icons by extension, without the dot, the style guide's list.
//
const EXTENSION_ICONS: Record<string, IconDefinition> = {
    ts: faFileCode,
    tsx: faFileCode,
    js: faFileCode,
    jsx: faFileCode,
    mjs: faFileCode,
    zig: faFileCode,
    rs: faFileCode,
    go: faFileCode,
    py: faFileCode,
    c: faFileCode,
    h: faFileCode,
    cpp: faFileCode,
    java: faFileCode,
    html: faFileCode,
    css: faPalette,
    scss: faPalette,
    md: faBook,
    txt: faFileLines,
    json: faGear,
    toml: faGear,
    yml: faGear,
    yaml: faGear,
    ini: faGear,
    env: faGear,
    lock: faLock,
    sh: faTerminal,
    bash: faTerminal,
    zsh: faTerminal,
    ps1: faTerminal,
    png: faFileImage,
    jpg: faFileImage,
    jpeg: faFileImage,
    gif: faFileImage,
    svg: faFileImage,
    webp: faFileImage,
    ico: faFileImage,
    pdf: faFilePdf,
    zip: faFileZipper,
    gz: faFileZipper,
    tar: faFileZipper,
    mp3: faFileAudio,
    wav: faFileAudio,
    mp4: faFileVideo,
    mov: faFileVideo,
    csv: faFileCsv,
    sql: faDatabase,
    db: faDatabase,
    sqlite: faDatabase,
};

//
// Returns the icon for the file at the path: by its whole name first, then by its extension, and
// the plain file icon for any other, so a reader can tell kinds of file apart at a glance.
//
export function fileIconFor(path: string): IconDefinition {
    const name = path.slice(path.lastIndexOf("/") + 1);
    const named = NAME_ICONS[name];
    if (named) {
        return named;
    }
    const dot = name.lastIndexOf(".");
    if (dot > 0) {
        const byExtension = EXTENSION_ICONS[name.slice(dot + 1).toLowerCase()];
        if (byExtension) {
            return byExtension;
        }
    }
    return faFile;
}

//
// What the file icon shows.
//
export interface IFileIconProps {
    // The path of the file from the root of the repo.
    path: string;
}

//
// Shows the file's icon at the small icon size in the muted text colour, so it marks the row
// without drawing the eye from the path.
//
export function FileIcon({ path }: IFileIconProps): JSX.Element {
    return <FontAwesomeIcon icon={fileIconFor(path)} aria-hidden="true" className="flex-none text-[length:var(--icon-sm)] text-[var(--color-text-muted)]" />;
}
