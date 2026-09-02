import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sanitizeArticleHtml, isRichArticle, ARTICLE_COLOURS } from '../src/lib/article-html'

// Journal articles are written in a rich text editor and rendered on a public
// page. What an editor produces and what a reader receives have to be two
// different things, and this is the gap between them. Every case below is
// something somebody could put in the box, on purpose or by pasting.
test('nothing dangerous survives the sanitiser', () => {
  const attacks: [string, RegExp][] = [
    ['<script>alert(1)</script>hello', /script/i],
    ['<p onclick="alert(1)">hi</p>', /onclick/i],
    ['<a href="javascript:alert(1)">x</a>', /javascript:/i],
    ['<img src=x onerror=alert(1)>', /onerror/i],
    ['<iframe src="https://evil.test"></iframe>', /iframe/i],
    ['<svg><use href="#x" /></svg>', /svg/i],
    ['<span style="position:fixed;top:0">x</span>', /position/i],
    ['<style>body{display:none}</style>', /display:\s*none/i],
    ['<form action="/steal"><input name="p"></form>', /<form|<input/i],
  ]
  for (const [input, forbidden] of attacks) {
    const out = sanitizeArticleHtml(input)
    assert.ok(!forbidden.test(out), `${forbidden} survived sanitising: ${out}`)
  }
})

test('everything the toolbar can produce survives it', () => {
  const rich = '<h2>H2</h2><h3>H3</h3><p><strong>b</strong><em>i</em><u>u</u><s>s</s></p>'
    + '<ul><li>one</li></ul><ol><li>two</li></ol><blockquote>q</blockquote>'
    + '<p><span style="color:#287548">green</span></p><p><a href="https://example.com">link</a></p>'
  const out = sanitizeArticleHtml(rich)
  for (const keep of ['<h2>', '<h3>', '<strong>', '<em>', '<u>', '<s>', '<ul>', '<ol>', '<li>', '<blockquote>', '#287548']) {
    assert.ok(out.includes(keep), `${keep} was stripped`)
  }
})

// A colour picker in body copy wrecks a premium brand within a few articles.
// The editor offers a short list; the sanitiser enforces it, so pasting a
// colour from elsewhere does not get one past.
test('only the brand palette is allowed as a text colour', () => {
  assert.ok(ARTICLE_COLOURS.length <= 6, 'a free colour picker is not a palette')
  assert.match(sanitizeArticleHtml('<span style="color:#287548">x</span>'), /#287548/)
  for (const rogue of ['#ff00ff', 'rgb(255,0,0)', 'var(--x)']) {
    const out = sanitizeArticleHtml(`<span style="color:${rogue}">x</span>`)
    assert.ok(!out.includes(rogue), `${rogue} was allowed through`)
  }
})

// An article linking out should not hand that site a handle on this one, nor
// pass it ranking.
test('outbound links are hardened', () => {
  const out = sanitizeArticleHtml('<a href="https://example.com">x</a>')
  assert.match(out, /rel="noopener noreferrer nofollow"/)
  assert.match(out, /target="_blank"/)
})

// Every article written before the editor existed is plain text with newlines
// and has to keep rendering exactly as it always has.
test('articles written before the editor still render as paragraphs', () => {
  assert.equal(isRichArticle('Just a line.\nAnd another.'), false)
  assert.equal(isRichArticle('<p>Rich</p>'), true)
  const page = readFileSync(new URL('../src/app/blog/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /isRichArticle\(post\.content\)/)
})

// Sanitised on the way in and again on the way out: the stored value could
// predate the sanitiser or arrive by another path, and checking twice costs
// nothing next to being wrong once.
test('the body is sanitised on save and on render', () => {
  const route = readFileSync(new URL('../src/app/api/admin/blog/route.ts', import.meta.url), 'utf8')
  assert.match(route, /withCleanBody\(post\)/, 'creating an article must sanitise it')
  assert.match(route, /withCleanBody\(pickEditable\(body\)\)/, 'and so must editing one')
  const page = readFileSync(new URL('../src/app/blog/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /sanitizeArticleHtml\(post\.content\)/, 'and rendering must not trust the stored value')
})
