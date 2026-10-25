import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
function contrast(a: string, b: string) {
  const light = (hex: string) => {
    const rgb = hex.slice(1).match(/../g)!.map((x) => parseInt(x, 16) / 255).map((x) => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const x = light(a), y = light(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
test('primary text tokens and solid summary button meet contrast in both themes', () => {
  for (const selector of [':root', "[data-theme='dark']"]) {
    const block = css.slice(css.indexOf(selector + ' {')).split('}')[0];
    const value = (name: string) => block.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1];
    for (const text of ['text', 'text-muted', 'text-subtle']) {
      for (const surface of ['bg', 'bg-subtle', 'bg-card', 'bg-card-hover', 'event-bg']) {
        assert.ok(contrast(value(text), value(surface)) >= 4.5, `${selector}: ${text} on ${surface}`);
      }
    }
    assert.ok(contrast(value('btn-pri-text'), value('btn-pri-bg')) >= 4.5);
  }
});
test('font declarations do not fall below 11 pixels', () => {
  for (const declaration of css.matchAll(/font(?:-size)?:[^;{}]+;/g)) {
    const size = declaration[0].match(/([\d.]+)px/);
    if (size) assert.ok(Number(size[1]) >= 11, declaration[0]);
  }
});
