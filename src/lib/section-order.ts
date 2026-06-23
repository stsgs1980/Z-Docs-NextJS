import type { NavSection } from '@/lib/mdx-utils';

export interface SectionOrderResult {
  sectionOrder: number;
  needsRenumber: boolean;
  renumberedSections: Record<string, number>;
}

/**
 * Pure function that calculates the section order for a new section
 * based on its desired position relative to existing navigation sections.
 */
export function calculateSectionOrder(
  navigation: NavSection[],
  position: 'end' | 'before' | 'after',
  ref: string,
  title: string,
): SectionOrderResult {
  let sectionOrder: number;
  let needsRenumber = false;
  const renumberedSections: Record<string, number> = {};

  if (position === 'end' || !ref) {
    const maxOrder = navigation.reduce((max, s) => Math.max(max, s.order), 0);
    sectionOrder = maxOrder + 100;
  } else {
    const refIdx = navigation.findIndex((s) => s.title === ref);
    if (refIdx < 0) {
      sectionOrder = navigation.length * 100;
    } else {
      const refOrder = navigation[refIdx].order;
      const neighborOrder = position === 'before'
        ? (refIdx > 0 ? navigation[refIdx - 1].order : 0)
        : (refIdx < navigation.length - 1 ? navigation[refIdx + 1].order : refOrder + 200);
      sectionOrder = Math.round((refOrder + neighborOrder) / 2);

      // Collision: renumber all sections with 100-step spacing
      if (sectionOrder === refOrder || sectionOrder === neighborOrder) {
        needsRenumber = true;
        let counter = 100;
        for (let i = 0; i < navigation.length; i++) {
          renumberedSections[navigation[i].title] = counter;
          counter += 100;
          if (position === 'before' && i === refIdx) {
            renumberedSections[title] = counter;
            counter += 100;
          } else if (position === 'after' && i === refIdx) {
            renumberedSections[title] = counter;
            counter += 100;
          }
        }
        sectionOrder = renumberedSections[title];
      }
    }
  }

  return { sectionOrder, needsRenumber, renumberedSections };
}
