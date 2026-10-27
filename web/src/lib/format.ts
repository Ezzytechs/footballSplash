/** Small display helpers shared by the post and tag pages. */

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000))
  const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto',
  })
  let value = -seconds
  for (const [step, unit] of units) {
    if (Math.abs(value) < step) return formatter.format(Math.round(value), unit)
    value = value / step
  }
  return formatter.format(Math.round(value), 'year')
}

export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
  }
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function readTime(text: string): number {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean)
  return Math.max(1, Math.round(words.length / 220))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
