//
// The file pane of a changed file in the working tree: the column that opens to the right of the
// changes pane when a file is clicked there, with the file's staged or unstaged diff in the file
// diff card the commit's file pane uses.
//

import { JSX, useEffect, useState } from "react";
import { readWorkingFileDiff } from "../../../lib/file-diff";
import { IWorkingFile } from "../../../lib/working-changes";
import { FileDiffCard } from "./file-pane";

//
// What the working file pane is given and what it reports.
//
export interface IWorkingFilePaneProps {
    // The repo the file is in.
    repoPath: string;

    // The changed file, as the list it is in gives it.
    file: IWorkingFile;

    // Whether the file is in the staged list, so its staged changes show, or in the unstaged list,
    // so its unstaged changes show.
    isStaged: boolean;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the file's staged or unstaged diff with the working file diff task and shows it in the
// file diff card. The repo explorer page keys the pane by the file's row and each read of the
// changes, so the diff is read afresh after every stage and unstage.
//
export function WorkingFilePane({ repoPath, file, isStaged, isActive, onClose }: IWorkingFilePaneProps): JSX.Element {
    const [diff, setDiff] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readWorkingFileDiff({
            taskId: `working-file-diff-${Date.now()}-${Math.random()}`,
            repoPath,
            path: file.path,
            isStaged,
            status: file.status,
        }, result => {
            if (result.ok) {
                setDiff(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [repoPath, file.path, file.status, isStaged]);

    return <FileDiffCard path={file.path} diff={diff} error={error} isActive={isActive} onClose={onClose} />;
}
