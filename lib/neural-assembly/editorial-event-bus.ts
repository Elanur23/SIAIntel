export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export interface EditorialEvent<T = unknown> {
  type: string
  mic_id: string
  payload: T
  timestamp: number
}

export interface MICUpdatedPayload {
  previous_version?: number
  next_version?: number
}

export interface CellViewStalePayload {
  language: Language
  affected_cells: string[]
}

export interface EditorialEventBus {
  publish<T = unknown>(type: string, micId: string, payload: T): Promise<void>
  subscribe<T = unknown>(type: string, handler: (event: EditorialEvent<T>) => void | Promise<void>): () => void
}

class InMemoryEditorialEventBus implements EditorialEventBus {
  private handlers = new Map<string, Set<(event: EditorialEvent<unknown>) => void | Promise<void>>>()

  async publish<T = unknown>(type: string, micId: string, payload: T): Promise<void> {
    const event: EditorialEvent<T> = {
      type,
      mic_id: micId,
      payload,
      timestamp: Date.now(),
    }

    const listeners = this.handlers.get(type)
    if (!listeners || listeners.size === 0) {
      return
    }

    for (const listener of listeners) {
      await listener(event as EditorialEvent<unknown>)
    }
  }

  subscribe<T = unknown>(
    type: string,
    handler: (event: EditorialEvent<T>) => void | Promise<void>
  ): () => void {
    const listeners = this.handlers.get(type) || new Set<(event: EditorialEvent<unknown>) => void | Promise<void>>()
    listeners.add(handler as (event: EditorialEvent<unknown>) => void | Promise<void>)
    this.handlers.set(type, listeners)

    return () => {
      const current = this.handlers.get(type)
      if (!current) {
        return
      }
      current.delete(handler as (event: EditorialEvent<unknown>) => void | Promise<void>)
      if (current.size === 0) {
        this.handlers.delete(type)
      }
    }
  }
}

let globalEventBus: InMemoryEditorialEventBus | null = null

export function getGlobalEventBus(): EditorialEventBus {
  if (!globalEventBus) {
    globalEventBus = new InMemoryEditorialEventBus()
  }
  return globalEventBus
}

export function resetGlobalEventBus(): void {
  globalEventBus = null
}
