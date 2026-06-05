import { describe, it, expect } from 'vitest';
import { cleanHtml, defaultOptions, extractTagsAndAttrs, type CleanOptions } from './cleaner';

/** Build options on top of the defaults for terse, focused test setup. */
function opts(overrides: Partial<CleanOptions> = {}): CleanOptions {
  return { ...defaultOptions(), ...overrides };
}

/** Normalize whitespace so assertions don't depend on incidental formatting. */
function norm(html: string): string {
  return html.replace(/\s+/g, ' ').trim();
}

/**
 * happy-dom's `DOMParser` drops comment nodes at parse time (real browsers keep
 * them). This stand-in builds the document via `innerHTML`, which happy-dom
 * parses with comments intact, so the comment-handling logic is tested for real.
 */
function commentSafeParser(): DOMParser {
  return {
    parseFromString(html: string) {
      const doc = document.implementation.createHTMLDocument('');
      doc.body.innerHTML = html;
      return doc;
    },
  } as unknown as DOMParser;
}

describe('cleanHtml — tag removal modes', () => {
  it('blacklist: unwraps a selected tag, keeping inner content', () => {
    const out = cleanHtml('<div>text</div>', opts({ tags: new Set(['div']) }));
    expect(norm(out)).toBe('text');
  });

  it('blacklist: keeps unselected tags untouched', () => {
    const out = cleanHtml('<p>hi</p><div>x</div>', opts({ tags: new Set(['div']) }));
    expect(norm(out)).toBe('<p>hi</p>x');
  });

  it('remove-with-contents: deletes the element and its subtree', () => {
    const out = cleanHtml(
      '<p>keep</p><div>drop<span>me</span></div>',
      opts({ tags: new Set(['div']), tagRemoval: 'remove' }),
    );
    expect(norm(out)).toBe('<p>keep</p>');
  });

  it('unwrap preserves nested children of a removed tag', () => {
    const out = cleanHtml(
      '<div><span>a</span><b>b</b></div>',
      opts({ tags: new Set(['div']) }),
    );
    expect(norm(out)).toBe('<span>a</span><b>b</b>');
  });

  it('whitelist: keeps only selected tags, unwrapping the rest', () => {
    const out = cleanHtml(
      '<div><p>para</p><span>s</span></div>',
      opts({ mode: 'whitelist', tags: new Set(['p']) }),
    );
    expect(norm(out)).toBe('<p>para</p>s');
  });

  it('whitelist + remove: drops content of non-whitelisted tags', () => {
    const out = cleanHtml(
      '<p>keep</p><div>drop</div>',
      opts({ mode: 'whitelist', tags: new Set(['p']), tagRemoval: 'remove' }),
    );
    expect(norm(out)).toBe('<p>keep</p>');
  });
});

describe('cleanHtml — always-strip and comments', () => {
  it('always removes script/style/noscript with contents', () => {
    const out = cleanHtml(
      '<p>hi</p><script>alert(1)</script><style>.a{}</style><noscript>x</noscript>',
      opts(),
    );
    expect(norm(out)).toBe('<p>hi</p>');
  });

  it('strips comments by default', () => {
    const out = cleanHtml('<p>hi</p><!-- secret -->', opts(), commentSafeParser());
    expect(norm(out)).toBe('<p>hi</p>');
  });

  it('keeps comments when keepComments is true', () => {
    const out = cleanHtml(
      '<p>hi</p><!-- keep -->',
      opts({ keepComments: true }),
      commentSafeParser(),
    );
    expect(norm(out)).toBe('<p>hi</p><!-- keep -->');
  });

  it('strips script even in whitelist mode (always-strip wins)', () => {
    const out = cleanHtml(
      '<p>hi</p><script>x</script>',
      opts({ mode: 'whitelist', tags: new Set(['p', 'script']) }),
    );
    expect(norm(out)).toBe('<p>hi</p>');
  });
});

describe('cleanHtml — attribute filtering', () => {
  it('blacklist: removes selected exact attributes', () => {
    const out = cleanHtml(
      '<p class="a" id="b" title="t">x</p>',
      opts({ attrs: new Set(['class', 'id']) }),
    );
    expect(norm(out)).toBe('<p title="t">x</p>');
  });

  it('blacklist: removes data- attributes selected by exact name', () => {
    const out = cleanHtml(
      '<p data-x="1" data-y="2" id="keep">x</p>',
      opts({ attrs: new Set(['data-x', 'data-y']) }),
    );
    expect(norm(out)).toBe('<p id="keep">x</p>');
  });

  it('blacklist: removes event handlers selected by exact name', () => {
    const out = cleanHtml(
      '<button onclick="f()" onmouseover="g()" id="keep">x</button>',
      opts({ attrs: new Set(['onclick', 'onmouseover']) }),
    );
    expect(norm(out)).toBe('<button id="keep">x</button>');
  });

  it('whitelist: keeps only selected attributes, drops the rest', () => {
    const out = cleanHtml(
      '<a href="/u" class="c" target="_blank">x</a>',
      opts({ mode: 'whitelist', tags: new Set(['a']), attrs: new Set(['href']) }),
    );
    expect(norm(out)).toBe('<a href="/u">x</a>');
  });
});

describe('extractTagsAndAttrs', () => {
  it('returns distinct, sorted tag and attribute names', () => {
    const { tags, attrs } = extractTagsAndAttrs(
      '<div class="a" id="b"><p class="c">x</p><span data-k="v">y</span></div>',
    );
    expect(tags).toEqual(['div', 'p', 'span']);
    expect(attrs).toEqual(['class', 'data-k', 'id']);
  });

  it('excludes always-stripped tags (script/style/noscript)', () => {
    const { tags } = extractTagsAndAttrs(
      '<p>x</p><script src="a.js"></script><style>.a{}</style><noscript>n</noscript>',
    );
    expect(tags).toEqual(['p']);
  });

  it('detects tags and attributes nested at any depth', () => {
    const { tags, attrs } = extractTagsAndAttrs(
      '<section><ul><li role="item">x</li></ul></section>',
    );
    expect(tags).toEqual(['li', 'section', 'ul']);
    expect(attrs).toEqual(['role']);
  });

  it('returns empty lists for empty input', () => {
    expect(extractTagsAndAttrs('')).toEqual({ tags: [], attrs: [] });
  });
});
