export async function createSectionDoc(
  title: string,
  sectionOrder: number,
  slug: string,
) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      section: title,
      sectionOrder,
      order: 0,
      slug,
      content: `# ${title}\n\n`,
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Create failed');
  }
  return res.json();
}

export async function reorderExistingSections(
  allSections: Record<string, number>,
  newSectionTitle: string,
) {
  const reorderSections: Record<string, number> = {};
  for (const [key, val] of Object.entries(allSections)) {
    if (key !== newSectionTitle) {
      reorderSections[key] = val;
    }
  }
  const res = await fetch('/api/docs/reorder-section', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections: reorderSections }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Reorder failed');
  }
}