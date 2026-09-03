/**
 * Result contract for the tier list server actions.
 *
 * Next.js redacts thrown server action errors in production, so failures are
 * returned as data instead. That gives the client a stable code to branch on
 * and a message it can show, rather than a generic "something went wrong".
 */

export type ActionErrorCode =
  | 'unauthenticated'
  | 'invalid-input'
  | 'not-found'
  | 'forbidden'
  | 'conflict'
  | 'unavailable';

export interface ActionFailure {
  ok: false;
  code: ActionErrorCode;
  message: string;
}

export interface ActionSuccess<T> {
  ok: true;
  data: T;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function actionFailure(code: ActionErrorCode, message: string): ActionFailure {
  return { ok: false, code, message };
}

export function isActionFailure<T>(result: ActionResult<T>): result is ActionFailure {
  return result.ok === false;
}

export const ACTION_FAILURE_MESSAGES: Record<ActionErrorCode, string> = {
  unauthenticated: 'You need to be signed in to do that.',
  'invalid-input': 'That tier list could not be saved because it is not valid.',
  'not-found': 'That tier list no longer exists.',
  forbidden: 'That tier list belongs to someone else.',
  conflict: 'This tier list changed somewhere else. Reload to get the latest version.',
  unavailable: 'Something went wrong. Please try again.',
};
