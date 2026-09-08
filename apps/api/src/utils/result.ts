/**
 * A tiny tagged result type, so controllers can report *why* they failed
 * instead of collapsing every failure into `null`.
 */

export type Ok<T> = { ok: true; value: T }
export type Err<E extends string> = { ok: false; error: E }
export type Result<T, E extends string> = Ok<T> | Err<E>

/**
 * Wraps a successful value
 *
 * @param {T} value - The value produced by the controller
 * @returns {Ok<T>} - The success branch of a Result
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })

/**
 * Wraps a failure code
 *
 * @param {E} error - A machine readable reason for the failure
 * @returns {Err<E>} - The failure branch of a Result
 */
export const err = <E extends string>(error: E): Err<E> => ({
  ok: false,
  error
})
