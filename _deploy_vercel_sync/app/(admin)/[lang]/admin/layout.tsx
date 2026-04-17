import type { Metadata } from 'next'
import AdminShell from '@/components/AdminShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'SIA Intelligence Admin',
  description: 'Admin Dashboard for SIA Intelligence Platform',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
