import EditArticlePage from '@/components/admin/EditArticlePage';

export default function AdminEditArticlePage({ params }: { params: { id: string } }) {
  return <EditArticlePage id={params.id} basePath="/admin/news" />;
}
