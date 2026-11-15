//
// Formats the dates of commits for the commits page: a short date for each commit in the commit
// pane and the date and time in the commit details pane.
//

//
// Where and how to show a date: the user's locale and time zone. The page passes the browser's own
// (Intl.DateTimeFormat().resolvedOptions()), so dates read as the user expects, and a test passes
// fixed ones, so it gets the same text on every machine.
//
export interface IDateFormatOptions {
    // The locale whose conventions the date follows, such as "en-US".
    locale: string;

    // The time zone the date is shown in, such as "UTC".
    timeZone: string;
}

//
// Formats the day of the date in the locale's short numeric form ("1/3/2026" in en-US), for the
// commit pane, where each row has room for the day only.
//
export function formatDate(date: Date, options: IDateFormatOptions): string {
    return date.toLocaleDateString(options.locale, {
        timeZone: options.timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
}

//
// Formats the date with its time to the second ("1/3/2026, 9:00:00 AM" in en-US), for the commit
// details pane, which shows when a commit was written and made.
//
export function formatDateTime(date: Date, options: IDateFormatOptions): string {
    return date.toLocaleString(options.locale, {
        timeZone: options.timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}
