/**
 * Board limits shared by the client store and the persistence schemas.
 *
 * Keeping them in one place is what stops the local board from drifting into a
 * state that the database boundary rejects.
 */

export const MAX_TIERS = 26;
export const MIN_TIERS = 1;
export const MAX_ITEMS = 500;

export const MAX_TIER_LABEL_LENGTH = 32;
export const MAX_TIER_COLOR_LENGTH = 32;

export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;

export const MAX_TEXT_ITEM_CONTENT_LENGTH = 200;

/**
 * Image items are stored inline as data URLs, so this cap bounds both the
 * localStorage payload and the `items` jsonb column. ~1.5 MB of binary once
 * base64 decoded.
 */
export const MAX_IMAGE_ITEM_CONTENT_LENGTH = 2_000_000;

export const MAX_ITEM_CONTENT_LENGTH = MAX_IMAGE_ITEM_CONTENT_LENGTH;

/** Upper bound applied to a file before it is read into a data URL. */
export const MAX_IMAGE_UPLOAD_BYTES = 1_400_000;
