//
// A file path drawn with its directory muted and its name in the main text colour, so the eye finds
// the file name first, as the style guide's commit explorer draws paths.
//

import { JSX } from "react";

//
// What the file path shows.
//
export interface IFilePathProps {
    // The path of the file from the root of the repo.
    path: string;
}

//
// Shows the path, cut short with an ellipsis at the start of the directory when it is wider than
// its space, so the file name stays in view. Only once the directory has gone is the file name
// itself cut short at its end.
//
export function FilePath({ path }: IFilePathProps): JSX.Element {
    const slash = path.lastIndexOf("/");
    const directory = path.slice(0, slash + 1);
    const name = path.slice(slash + 1);
    return (
        <span className="flex min-w-0 whitespace-nowrap">
            {directory !== "" && (
                <span className="min-w-0 shrink-[1000] truncate text-left text-[var(--color-text-muted)] [direction:rtl]">
                    <bdi>{directory}</bdi>
                </span>
            )}
            <span className="min-w-0 truncate">{name}</span>
        </span>
    );
}
