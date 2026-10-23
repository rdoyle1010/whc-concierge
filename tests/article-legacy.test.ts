import test from 'node:test'
import assert from 'node:assert/strict'
import { toArticleHtml, isRichArticle } from '../src/lib/article-html'

// The detector listed the tags the new editor produces and missed the ones
// older articles were written with. A live article using <b> and <br /> fell
// through to the plain-text path and printed its own markup at the reader:
// "<b>A strong spa job advert should help someone understand..."
test('an article written with b and br renders as formatting, not as text', () => {
  const legacy = '<b>A strong spa job advert should help someone understand the opportunity.</b>Yet many adverts rely on a formula.\nGood recruitment begins with clarity.<br /><b>START WITH THE OPPORTUNITY</b>The opening paragraph should say what makes the role worth considering.'
  assert.equal(isRichArticle(legacy), true, 'b and br must count as rich')

  const html = toArticleHtml(legacy)
  assert.match(html, /<b>A strong spa job advert/, 'the bold must survive as a tag')
  assert.ok(!html.includes('&lt;b&gt;'), 'and must never be escaped into visible text')
  assert.match(html, /<br \/>|<br>/, 'line breaks must survive')
})

// Without block structure the whole article collapsed into one unbroken slab.
// Newlines are where the writer meant a paragraph.
test('newlines become paragraphs when the article has no structure of its own', () => {
  const html = toArticleHtml('First paragraph.\nSecond paragraph.\nThird.')
  assert.equal((html.match(/<p>/g) || []).length, 3, `expected three paragraphs, got: ${html}`)
})

test('an article that already has paragraphs is left alone', () => {
  const html = toArticleHtml('<p>One</p><p>Two</p>')
  assert.equal((html.match(/<p>/g) || []).length, 2)
})

// The fix must not open a hole: legacy content goes through the same allowlist.
test('legacy content is sanitised too', () => {
  const html = toArticleHtml('<b>Fine</b><script>alert(1)</script>\n<img src=x onerror=alert(1)>')
  assert.ok(!/script|onerror/i.test(html), `something dangerous survived: ${html}`)
  assert.match(html, /<b>Fine<\/b>/)
})
