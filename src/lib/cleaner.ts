/**
 * Core HTML cleaning logic.
 *
 * Everything operates on a DOM parsed with the browser's `DOMParser` (never
 * regex). The same code runs in the browser and, via happy-dom, in unit tests.
 * The module is deliberately free of any UI concerns so it stays reusable.
 */

import { ALWAYS_STRIP_TAGS } from './constants';

export type Mode = 'blacklist' | 'whitelist';
export type TagRemoval = 'unwrap' | 'remove';

export interface CleanOptions {
  /** `blacklist` removes the selected items; `whitelist` keeps only them. */
  mode: Mode;
  /** How removed tags are handled: keep children (`unwrap`) or delete subtree. */
  tagRemoval: TagRemoval;
  /** Selected tag names, lowercased. */
  tags: Set<string>;
  /** Selected attribute names, lowercased. */
  attrs: Set<string>;
  /** Keep HTML comments instead of stripping them (default behaviour strips). */
  keepComments: boolean;
}

/** Sensible defaults: blacklist + unwrap, nothing selected, strip comments. */
export function defaultOptions(): CleanOptions {
  return {
    mode: 'blacklist',
    tagRemoval: 'unwrap',
    tags: new Set(),
    attrs: new Set(),
    keepComments: false,
  };
}

const ALWAYS_STRIP = new Set(ALWAYS_STRIP_TAGS);

/** Decide whether an element's tag should be removed under the active mode. */
function shouldRemoveTag(tagName: string, opts: CleanOptions): boolean {
  const selected = opts.tags.has(tagName);
  return opts.mode === 'blacklist' ? selected : !selected;
}

/** Decide whether an attribute should be removed under the active mode. */
function shouldRemoveAttr(name: string, opts: CleanOptions): boolean {
  const selected = opts.attrs.has(name);
  return opts.mode === 'blacklist' ? selected : !selected;
}

/** Apply attribute filtering globally to a kept element. */
function filterAttributes(el: Element, opts: CleanOptions): void {
  // Snapshot names first: removing while iterating live attributes is unsafe.
  for (const name of el.getAttributeNames()) {
    if (shouldRemoveAttr(name.toLowerCase(), opts)) {
      el.removeAttribute(name);
    }
  }
}

/** Replace an element with its children (unwrap), preserving inner content. */
function unwrap(el: Element): ChildNode[] {
  const parent = el.parentNode;
  const moved = Array.from(el.childNodes);
  if (parent) {
    for (const child of moved) {
      parent.insertBefore(child, el);
    }
    parent.removeChild(el);
  }
  return moved;
}

/**
 * Recursively process a node's children. Iterates over a snapshot because the
 * tree mutates as elements are removed or unwrapped.
 */
function processChildren(node: Node, opts: CleanOptions): void {
  for (const child of Array.from(node.childNodes)) {
    processNode(child, opts);
  }
}

function processNode(node: Node, opts: CleanOptions): void {
  if (node.nodeType !== node.ELEMENT_NODE) return;

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();

  if (shouldRemoveTag(tagName, opts)) {
    if (opts.tagRemoval === 'unwrap') {
      // Keep the children, then process each in their new position.
      const moved = unwrap(el);
      for (const child of moved) processNode(child, opts);
    } else {
      el.remove();
    }
    return;
  }

  // Element is kept: clean its attributes, then recurse into its subtree.
  filterAttributes(el, opts);
  processChildren(el, opts);
}

/** Remove `<script>`/`<style>`/`<noscript>` (always) and comment nodes. */
function stripAlways(root: ParentNode, keepComments: boolean): void {
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (ALWAYS_STRIP.has(el.tagName.toLowerCase())) el.remove();
  }
  if (!keepComments) {
    removeComments(root as unknown as Node);
  }
}

/** Recursively remove comment nodes from the tree. */
function removeComments(node: Node): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === child.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
    } else {
      removeComments(child);
    }
  }
}

/**
 * Clean an HTML string according to `opts` and return the serialized result.
 *
 * @param input  Raw HTML pasted by the user.
 * @param opts   Mode, removal behaviour, and the selected tags/attributes.
 * @param parser Optional DOMParser (defaults to a fresh global one); useful for
 *               tests or non-browser callers.
 */
export function cleanHtml(
  input: string,
  opts: CleanOptions,
  parser: DOMParser = new DOMParser(),
): string {
  const doc = parser.parseFromString(input, 'text/html');

  // Pass 1: unconditionally strip dangerous/noise nodes.
  stripAlways(doc.body, opts.keepComments);

  // Pass 2: apply the user's tag/attribute rules across the body subtree.
  processChildren(doc.body, opts);

  return doc.body.innerHTML;
}

/**
 * Collect the distinct tag names and attribute names present in `input`, so the
 * UI can offer exactly what the document contains (and nothing else). Tags that
 * are always stripped (`script`/`style`/`noscript`) are excluded since they are
 * never user-selectable. Both lists are returned sorted alphabetically.
 */
export function extractTagsAndAttrs(
  input: string,
  parser: DOMParser = new DOMParser(),
): { tags: string[]; attrs: string[] } {
  const doc = parser.parseFromString(input, 'text/html');
  const tags = new Set<string>();
  const attrs = new Set<string>();

  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase();
    if (ALWAYS_STRIP.has(tag)) continue;
    tags.add(tag);
    for (const name of el.getAttributeNames()) attrs.add(name.toLowerCase());
  }

  return { tags: [...tags].sort(), attrs: [...attrs].sort() };
}
