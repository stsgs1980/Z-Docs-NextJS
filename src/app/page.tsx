import { redirect } from 'next/navigation';
import { getAllPageIds } from '@/lib/mdx-utils';

export default function HomePage() {
  const allIds = getAllPageIds();
  const firstPage = allIds[0] || 'approaches-overview';
  redirect(`/docs/${firstPage}/`);
}
