"use client"

import { useState } from "react"
import { Mail, ArrowRight, Check, Loader2, Shield, Lock, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function NewsletterCTA() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSubscribed(true)
        setEmail("")
      } else {
        setError(data.error || 'Subscription failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 py-24 lg:py-32">
      {/* Background decoration engine */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08)_0%,_transparent_70%)]" />
      <div className="noise-overlay" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="holographic-card relative overflow-hidden rounded-[4rem] border border-black/10 dark:border-white/10 bg-white/[0.01] dark:bg-white/[0.01] p-12 lg:p-24 backdrop-blur-3xl shadow-2xl"
        >
          {/* Internal design elements */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-10 inline-flex items-center justify-center gap-4 rounded-3xl bg-blue-600/10 p-4 border border-blue-500/20 shadow-lg shadow-blue-900/40">
              <Mail className="h-8 w-8 text-blue-500" />
              <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
              <Lock className="h-5 w-5 text-slate-400 dark:text-white/30" />
            </div>

            <h2 className="mb-8 font-heading text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white lg:text-6xl">
              JOIN_THE_SIA<span className="text-blue-500">_PROTOCOL</span>
            </h2>

            <p className="mb-12 text-lg font-medium leading-relaxed text-slate-500 dark:text-white/40 uppercase tracking-widest text-pretty">
              Establish a secure uplink to our premium intelligence stream.
              Gain sub-second access to institutional-grade market signals before saturation.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-4 rounded-3xl bg-emerald-500/10 p-8 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 backdrop-blur-md"
              >
                <Check className="h-8 w-8" />
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-black uppercase tracking-widest">UPLINK_ESTABLISHED</span>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600/60 dark:text-emerald-500/60 text-left">Confirm intelligence node in your inbox.</span>
                </div>
              </motion.div>
            ) : (
              <div className="mx-auto max-w-xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:gap-4">
                  <div className="group relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="IDENTITY@SIA.SECURE"
                      required
                      disabled={loading}
                      className="w-full h-16 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40 px-6 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all hover:bg-black/10 dark:hover:bg-white/[0.05] hover:border-blue-600/30 dark:hover:border-blue-500/30 disabled:opacity-50"
                    />
                    <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-white/10 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-16 rounded-2xl bg-blue-600 px-8 text-xs font-black uppercase tracking-[0.4em] text-white shadow-2xl shadow-blue-600/30 transition-all hover:bg-blue-700 dark:hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        SYNCING...
                      </>
                    ) : (
                      <>
                        ESTABLISH_UPLINK
                        <ArrowRight className="ml-3 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
                {error && (
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">{error} // UPLINK_REJECTED</p>
                )}
              </div>
            )}

            <div className="mt-12 flex items-center justify-center gap-8 border-t border-black/5 dark:border-white/5 pt-8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                <Shield className="h-3.5 w-3.5 text-blue-600/40 dark:text-blue-500/40" />
                ENCRYPTED_TX
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                <Activity className="h-3.5 w-3.5 text-blue-600/40 dark:text-blue-500/40" />
                INSTITUTIONAL_GRADE
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                <Zap className="h-3.5 w-3.5 text-blue-600/40 dark:text-blue-500/40" />
                PREDICTIVE_BIAS
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
