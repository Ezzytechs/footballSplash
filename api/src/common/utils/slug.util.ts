export function slugify(value: string, fallback = 'item'): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || fallback;
}

/**
 * Returns a slug that is not taken yet, suffixing `-2`, `-3`, ... as needed.
 */
export async function uniqueSlug(
  value: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallback = 'item',
): Promise<string> {
  const base = slugify(value, fallback);
  let slug = base;
  let suffix = 1;

  while (await isTaken(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;

    if (suffix > 50) {
      return `${base}-${Date.now().toString(36)}`;
    }
  }

  return slug;
}
