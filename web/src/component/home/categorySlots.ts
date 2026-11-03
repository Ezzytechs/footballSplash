import { useCategoriesQuery } from '../../api/queries'
import type { CategoryWithCount } from '../../api/types'

/**
 * Every category is assigned to exactly one place on the site so the same
 * category never shows up twice:
 *
 *   - the navbar row loads the first 6 (no "More" dropdown),
 *   - the sidebar rail keeps the next 4,
 *   - everything left over is shared around the page body — a one-line strip
 *     near the top, another near the bottom, and the rest as the per-category
 *     article sections in the main column.
 *
 * Offsets live here only, so the three lists can never overlap.
 */
export const NAV_CATEGORY_COUNT = 6
export const SIDEBAR_CATEGORY_COUNT = 4

export interface CategorySlots {
  isLoading: boolean
  nav: CategoryWithCount[]
  sidebar: CategoryWithCount[]
  body: CategoryWithCount[]
}

export function useCategorySlots(): CategorySlots {
  const categories = useCategoriesQuery()
  const all = categories.data ?? []
  const sidebarEnd = NAV_CATEGORY_COUNT + SIDEBAR_CATEGORY_COUNT
  return {
    isLoading: categories.isLoading,
    nav: all.slice(0, NAV_CATEGORY_COUNT),
    sidebar: all.slice(NAV_CATEGORY_COUNT, sidebarEnd),
    body: all.slice(sidebarEnd),
  }
}

export interface BodySplit {
  topStrip: CategoryWithCount[]
  bottomStrip: CategoryWithCount[]
  sections: CategoryWithCount[]
}

/**
 * Spreads the body pool across the page instead of stacking it in one spot.
 * Small pools keep their categories for the article sections; larger pools
 * peel off one or two for each of the two single-line strips.
 */
export function splitBodyCategories(body: CategoryWithCount[]): BodySplit {
  const perStrip = body.length >= 7 ? 2 : body.length >= 3 ? 1 : 0
  return {
    topStrip: body.slice(0, perStrip),
    bottomStrip: body.slice(perStrip, perStrip * 2),
    sections: body.slice(perStrip * 2),
  }
}