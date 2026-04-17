import ArticlesAdminPage from '@/components/admin/ArticlesAdminPage'

export default async function LocalizedAdminNewsPage({ params }: { params: { lang: string } }) {
  return <ArticlesAdminPage basePath={`/${params.lang}/admin/news`} />
}
