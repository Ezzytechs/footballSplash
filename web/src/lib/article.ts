import { slugify } from './format'

export interface ArticleSection {
  id: string
  title: string
  html: string
}

/**
 * Splits an article body into <h2>-anchored sections so the table of
 * contents can link to them. Falls back to a single untitled section when
 * the body has no headings.
 */
export function parseSections(content: string): ArticleSection[] {
  if (!content) return []
  if (typeof DOMParser === 'undefined') return []

  const doc = new DOMParser().parseFromString(
    `<div id="root">${content}</div>`,
    'text/html',
  )
  const root = doc.getElementById('root')
  if (!root) return []

  const nodes = Array.from(root.children)
  if (!nodes.some((node) => node.tagName === 'H2')) {
    return [{ id: '', title: '', html: content }]
  }

  const sections: ArticleSection[] = []
  const push = (id: string, title: string) => {
    sections.push({ id, title, html: '' })
    return sections[sections.length - 1]
  }

  let current = push('intro', '')
  const used = new Set<string>()

  for (const node of nodes) {
    if (node.tagName === 'H2') {
      const title = node.textContent?.trim() || 'Section'
      let id = slugify(title) || 'section'
      while (used.has(id)) id = `${id}-2`
      used.add(id)
      current = push(id, title)
      current.html += node.outerHTML
    } else {
      current.html += node.outerHTML
    }
  }

  const first = sections[0]
  if (first && first.title === '' && first.id === 'intro') {
    first.id = ''
  }
  return sections.filter((section) => section.html.trim().length > 0)
}
