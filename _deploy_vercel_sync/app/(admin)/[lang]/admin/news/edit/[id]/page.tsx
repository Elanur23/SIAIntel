import EditArticlePage from '@/components/admin/EditArticlePage'

export default function LocalizedAdminEditArticlePage({
  params,
}: {
  params: { lang: string; id: string }
}) {
  return <EditArticlePage id={params.id} basePath={`/${params.lang}/admin/news`} />
}
