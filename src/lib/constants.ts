/**
 * Shared constants for the cleaning logic.
 *
 * The selectable tags/attributes are detected at runtime from the pasted HTML
 * (see `extractTagsAndAttrs` in `cleaner.ts`), so there are no predefined option
 * lists here — only the tags that are unconditionally removed.
 */

/**
 * Tags that are always removed *with their contents*, in either mode, before any
 * user-driven filtering runs. These never produce meaningful rendered output and
 * are a security/noise hazard when cleaning pasted markup; they are also excluded
 * from the auto-detected tag list.
 */
export const ALWAYS_STRIP_TAGS: readonly string[] = ['script', 'style', 'noscript'];
