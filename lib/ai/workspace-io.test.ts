import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { readWorkspace, getMissingLangs } from './workspace-io'
import fs from 'fs/promises'

// Mock fs/promises
jest.mock('fs/promises')

describe('SIA Workspace I/O', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('readWorkspace', () => {
    it('should read and parse a valid array-based workspace', async () => {
      const mockData = {
        status: 'OK',
        articles: [
          {
            en: { title: 'Test', summary: 'Summary', content: 'Content', imageUrl: '' }
          }
        ]
      }
      ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockData))

      const result = await readWorkspace()
      expect(result.articles).toHaveLength(1)
      expect(result.articles[0].en.title).toBe('Test')
    })
  })

  describe('getMissingLangs', () => {
    it('should identify empty language nodes in the first article', () => {
      const container: any = {
        articles: [
          {
            en: { content: 'Some content' },
            tr: { content: ' ' }
          }
        ]
      }
      const missing = getMissingLangs(container)
      expect(missing).toContain('tr')
      expect(missing).not.toContain('en')
    })
  })
})
