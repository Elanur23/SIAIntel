import ManualEntryEditor from '@/components/admin/ManualEntryEditor'

export default function CreatePage({ params }: { params: { lang: string } }) {
  return <ManualEntryEditor lang={params.lang} />
}
