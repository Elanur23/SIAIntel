import { describe, expect, it } from '@jest/globals'
import {
  protectFinanceTerms,
  enforceScarcityTone,
  injectFinancialGravity,
  generateVerificationFooter,
  processSIAMasterProtocol
} from './sia-master-protocol-v4'

describe('SIA Master Protocol v4.0', () => {
  describe('protectFinanceTerms', () => {
    it('should bold protected finance terms', () => {
      const content = 'Bitcoin and DePIN infrastructure will reshape RWA markets.'
      const result = protectFinanceTerms(content)
      expect(result.processed).toContain('**DePIN**')
      expect(result.processed).toContain('**RWA**')
      expect(result.termsProtected).toBe(2)
    })
  })

  describe('enforceScarcityTone', () => {
    it('should convert weak language to imperatives', () => {
      const content = 'Bitcoin could potentially reach new highs. This might result in volatility.'
      const result = enforceScarcityTone(content)
      expect(result.processed).toContain('Bitcoin will reach new highs')
      expect(result.processed).toContain('This shall produce volatility')
    })
  })

  describe('injectFinancialGravity', () => {
    it('should inject USD reference into first paragraph for English', () => {
      const content = 'AI compute power is expanding. Global markets are reacting.'
      const result = injectFinancialGravity(content, 'en', 'USD')
      expect(result.processed).toContain('US Dollar ($)')
      expect(result.injectionPoint).toBeGreaterThan(0)
    })
  })
})
