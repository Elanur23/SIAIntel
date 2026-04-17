'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, Loader2 } from 'lucide-react'


export default function BackfillTranslationsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [limit, setLimit] = useState(10);

  const handleClick = async () => {
    setIsRunning(true);
    setLogs([]);
    try {
      setLogs((prev) => [...prev, `Başlatıldı: limit = ${limit}`]);
      const response = await fetch('/api/admin/backfill-multilingual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Backfill failed');
      }
      setLogs((prev) => [
        ...prev,
        `Taramalar: ${data.scanned}, güncellenen: ${data.updated}, atlanan: ${data.skipped}`
      ]);
      if (data.errors && data.errors.length > 0) {
        setLogs((prev) => [
          ...prev,
          ...data.errors.map((e: any, i: number) => `Hata #${i + 1}: ${typeof e === 'string' ? e : JSON.stringify(e)}`)
        ]);
      }
      startTransition(() => router.refresh());
    } catch (error: any) {
      setLogs((prev) => [...prev, error?.message || 'Backfill failed']);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 w-full max-w-xs">
      <div className="flex items-center gap-2 w-full">
        <input
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          disabled={isRunning || isPending}
          className="w-16 rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-xs text-emerald-200 focus:outline-none"
          title="Kaç makale işlenecek?"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={isRunning || isPending}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 disabled:opacity-50"
        >
          {isRunning || isPending ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
          Backfill Missing Languages
        </button>
      </div>
      <div className="w-full min-h-[18px] flex flex-col gap-1">
        {logs.map((log, i) => (
          <div key={i} className="text-[10px] text-emerald-300/80 whitespace-pre-line">{log}</div>
        ))}
      </div>
    </div>
  );
}