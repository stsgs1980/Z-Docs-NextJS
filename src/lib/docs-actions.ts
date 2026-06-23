import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface DocData {
  meta: {
    title: string;
    section: string;
    sectionOrder?: number;
    order: number;
    slug: string;
  };
  content: string;
}

interface ActionSuccess {
  success: true;
}

interface ActionError {
  success: false;
  error: string;
}

type ActionResult = ActionSuccess | ActionError;

/**
 * Delete a document by slug.
 */
export async function deleteDoc(slug: string): Promise<ActionResult> {
  try {
    const res = await fetch(`/api/docs/${slug}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed');
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка удаления' };
  }
}

/**
 * Save (update) an existing document.
 */
export async function saveDoc(
  doc: DocData,
  slug: string,
  commitMessage: string,
): Promise<ActionResult> {
  try {
    const res = await fetch(`/api/docs/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...doc.meta,
        content: doc.content,
        commitMessage: commitMessage || `docs: update ${slug}`,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Save failed');
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка сохранения' };
  }
}

type CreateDocResult = ActionResult & { slug?: string };

/**
 * Create a new document.
 */
export async function createDoc(
  title: string,
  slug: string,
  section: string,
  sectionOrder: string,
  order: string,
  content: string,
): Promise<CreateDocResult> {
  try {
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        section: section || 'Uncategorized',
        sectionOrder: sectionOrder ? parseInt(sectionOrder) : undefined,
        order: order ? parseInt(order) : 0,
        slug,
        content,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Create failed');
    }

    return { success: true, slug: data.slug };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка создания' };
  }
}

type UploadDocsResult = ActionResult & { slug?: string };

/**
 * Upload documents from files.
 */
export async function uploadDocs(
  files: FileList,
  section: string,
): Promise<UploadDocsResult> {
  try {
    const formData = new FormData();
    formData.append('section', section || 'Uploaded');

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const res = await fetch('/api/docs/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    // Navigate to the first uploaded file
    if (data.results && data.results.length > 0) {
      return { success: true, slug: data.results[0].slug };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка загрузки' };
  }
}

/**
 * Navigate after a successful action.
 */
export function navigateAfterAction(router: AppRouterInstance, path: string) {
  router.push(path);
  router.refresh();
}
