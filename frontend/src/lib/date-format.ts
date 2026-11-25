//
// Formats the dates of commits for the repo explorer page: a short date for each commit in the
// commit pane and the date and time in the commit details pane.
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
// Formats the day of the date as its day and short month name ("Jan 3" in en-US), for the commit
// pane, where each row has room for the day only, as the style guide's commit list shows it.
//
export function formatDate(date: Date, options: IDateFormatOptions): string {
    return date.toLocaleDateString(options.locale, {
        timeZone: options.timeZone,
        month: "short",
        day: "numeric",
    });
}

//
// Formats the date with its time to the minute ("Jan 3, 2026, 9:00 AM" in en-US), for the commit
// details pane, which shows when a commit was written and made, as the style guide's commit details
// show it.
//
export function formatDateTime(date: Date, options: IDateFormatOptions): string {
    return date.toLocaleString(options.locale, {
        timeZone: options.timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

//
// Writes a number with at least two digits, as ISO 8601 writes each part of a date, a time and an
// offset.
//
export function twoDigits(value: number): string {
    return String(value).padStart(2, "0");
}

//
// Formats the date as ISO 8601 in the time zone, to the second and with the zone's offset from
// UTC ("2026-01-03T19:00:00+10:00" in Australia/Brisbane), for the commit pane's date tooltip,
// whose field copies it, as the style guide's date tooltip shows it. ISO 8601 is written the same
// way in every locale, so only the time zone is used. The offset is the zone's wall clock time at that moment
// less the moment itself.
//
export function formatIsoDate(date: Date, options: IDateFormatOptions): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: options.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const values: Record<string, string> = {};
    for (const part of parts) {
        values[part.type] = part.value;
    }
    const wallClockMs = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const momentMs = Math.floor(date.getTime() / 1000) * 1000;
    const offsetMinutes = Math.round((wallClockMs - momentMs) / 60000);
    let sign = "+";
    if (offsetMinutes < 0) {
        sign = "-";
    }
    const offsetSize = Math.abs(offsetMinutes);
    const offset = `${sign}${twoDigits(Math.floor(offsetSize / 60))}:${twoDigits(offsetSize % 60)}`;
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}${offset}`;
}
