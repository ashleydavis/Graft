//
// The result of something that can fail in an expected way: its value or its error. Graft's code
// returns failures as a Result instead of throwing, so the compiler shows the caller every case.
//

//
// A success, holding the value.
//
export interface IOk<TValue> {
    // Always true, so a caller can tell a success from a failure.
    ok: true;

    // What was made or read.
    value: TValue;
}

//
// A failure, holding the error.
//
export interface IErr<TError> {
    // Always false, so a caller can tell a failure from a success.
    ok: false;

    // What went wrong.
    error: TError;
}

//
// Either a success with its value or a failure with its error.
//
export type Result<TValue, TError> = IOk<TValue> | IErr<TError>;

//
// Makes a success holding the value.
//
export function ok<TValue>(value: TValue): IOk<TValue> {
    return {
        ok: true,
        value,
    };
}

//
// Makes a failure holding the error.
//
export function err<TError>(error: TError): IErr<TError> {
    return {
        ok: false,
        error,
    };
}
