/**
 * Pretty-prints cleaned HTML for the "Code" view using Prettier's browser-safe
 * standalone build plus the HTML plugin. Falls back to the raw string if the
 * input can't be parsed (e.g. mid-edit fragments), so the UI never breaks.
 */
import * as prettier from 'prettier/standalone';
import * as htmlPlugin from 'prettier/plugins/html';

export async function formatHtml(code: string): Promise<string> {
  if (!code.trim()) return '';
  try {
    return await prettier.format(code, {
      parser: 'html',
      plugins: [htmlPlugin],
      printWidth: 100,
      htmlWhitespaceSensitivity: 'ignore',
    });
  } catch {
    return code;
  }
}
