//
// The tag pane: the column that opens to the right of the repo details pane when a tag is clicked,
// with the tag's name and the commit it points at and, for an annotated tag, who made it, when
// and its message.
//

import { JSX, useEffect, useState } from "react";
import { formatDateTime, IDateFormatOptions } from "../../../lib/date-format";
import { ITagDetails, readTagDetails } from "../../../lib/tags";
import { activePaneClass } from "./active-pane-style";
import { CollapsedStrip } from "./collapse";
import { Fact, PersonAndDate } from "./commit-info-pane";
import { CloseButton, collapseHandler, MaximiseButton, PaneHeader } from "./pane-header";
import { paneWidthClass } from "./pane-width";

//
// What the tag pane is given and what it reports.
//
export interface ITagPaneProps {
    // The repo to read.
    repoPath: string;

    // The name of the tag to show.
    tagName: string;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Whether the pane is maximised, filling the repo explorer, which its maximise button shows.
    isMaximised: boolean;

    // Called when the user clicks the pane's maximise button.
    onToggleMaximise(): void;

    // Whether the pane is collapsed into a narrow strip, which the pane draws in its place.
    isCollapsed: boolean;

    // Called when the user clicks the collapse button or the strip's restore button.
    onToggleCollapse(): void;

    // The locale and time zone the tag's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the tag's details with the tag details task and shows them in a rounded card headed "Tag"
// and the tag's name, with a button that maximises the pane and restores it and a button that
// closes the pane. It shows that it is loading until the task ends and what went wrong when the tag
// could not be read. The card fills the repo explorer while the pane is maximised. The card's border
// is in the style guide's active pane colour while the pane is active. The page's AnimatedPane
// column animates it as it opens and closes. While it is collapsed it draws the strip with "Tag"
// and the tag's name down it in its place.
//
export function TagPane({ repoPath, tagName, isActive, isMaximised, onToggleMaximise, isCollapsed, onToggleCollapse, dateFormat, onClose }: ITagPaneProps): JSX.Element {
    const [details, setDetails] = useState<ITagDetails | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readTagDetails({
            taskId: `tag-details-${Date.now()}-${Math.random()}`,
            repoPath,
            name: tagName,
        }, result => {
            if (result.ok) {
                setDetails(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [repoPath, tagName]);

    if (isCollapsed) {
        return <CollapsedStrip paneLabel="Tag" title={`Tag ${tagName}`} paneDataId="tag-pane" isActive={isActive} onRestore={onToggleCollapse} />;
    }
    const title = (
        <span className="flex items-baseline gap-2">
            Tag
            <span className="truncate text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{tagName}</span>
        </span>
    );
    return (
        <section data-id="tag-pane" aria-label="Tag" className={`flex ${paneWidthClass("w-[450px]", isMaximised)} flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title={title} titleDataId="tag-heading" collapseDataId="tag-pane-collapse" onCollapse={collapseHandler(isMaximised, onToggleCollapse)} action={(
                <>
                    <MaximiseButton isMaximised={isMaximised} dataId="tag-maximise" onToggleMaximise={onToggleMaximise} />
                    <CloseButton paneLabel="Tag" dataId="tag-close" onClose={onClose} />
                </>
            )} />
            <div className="min-h-0 flex-1 overflow-auto">
                <TagContent details={details} error={error} dateFormat={dateFormat} />
            </div>
        </section>
    );
}

//
// What the content of the tag pane shows.
//
export interface ITagContentProps {
    // The tag, or undefined until it is read.
    details: ITagDetails | undefined;

    // Why the tag could not be read, or undefined.
    error: string | undefined;

    // The locale and time zone the tag's date is shown in.
    dateFormat: IDateFormatOptions;
}

//
// Shows an annotated tag's message, then the tag's facts in a column of labels and a column of
// values, as the commit details pane lays out a commit's: its name, the commit it points at as the
// short hash and title, and for an annotated tag who made it and when. Or it shows that the tag is
// loading or why it could not be read. The message's description shows only when the message has
// more than a title.
//
export function TagContent({ details, error, dateFormat }: ITagContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="tag-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (details === undefined) {
        return <p data-id="tag-loading" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the tag.</p>;
    }
    const annotation = details.annotation;
    return (
        <div data-id="tag-details" className="flex flex-col gap-4 p-4">
            {annotation && (
                <div className="flex flex-col gap-2">
                    <h3 data-id="tag-message-title" className="text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">{annotation.title}</h3>
                    {annotation.description !== "" && (
                        <p data-id="tag-message-description" className="whitespace-pre-wrap text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{annotation.description}</p>
                    )}
                </div>
            )}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2">
                <Fact label="Name" dataId="tag-name">
                    {details.name}
                </Fact>
                <Fact label="Commit" dataId="tag-commit">
                    <code data-id="tag-commit-hash" className="font-[family-name:var(--font-mono)]">{details.commitHash.slice(0, 7)}</code>{" "}
                    <span data-id="tag-commit-title">{details.commitTitle}</span>
                </Fact>
                {annotation && (
                    <Fact label="Tagged" dataId="tag-tagger">
                        <PersonAndDate name={annotation.taggerName} email={annotation.taggerEmail} date={formatDateTime(annotation.taggerDate, dateFormat)} />
                    </Fact>
                )}
            </dl>
        </div>
    );
}
