export function headerOffset(): number {
  const header = document.querySelector('header')
  return (header?.getBoundingClientRect().height ?? 0) + 16
}

/** Smooth-scroll an in-page anchor to just below the sticky header. */
export function scrollToId(id: string): void {
  const element = document.getElementById(id)
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - headerOffset()
  window.scrollTo({ top, behavior: 'smooth' })
}
