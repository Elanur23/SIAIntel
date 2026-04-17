/**
 * Manual verification script for language-specific formatting
 * Run with: npx ts-node lib/sia-news/test-language-formatting.ts
 */

import {
  formatNumber,
  formatDate,
  formatCurrency,
  formatTurkishFormal,
  formatGermanFormal,
  formatArabicRTL,
  validateCulturalReferences,
  validateFinancialTerminology,
  addRegulatoryDisclaimer,
  LANGUAGE_FORMATTERS,
  REGULATORY_CONTEXTS
} from './regional-news-formatter'

console.log('='.repeat(80))
console.log('LANGUAGE-SPECIFIC FORMATTING VERIFICATION')
console.log('='.repeat(80))

// Test 1: Number Formatting
console.log('\n1. NUMBER FORMATTING')
console.log('-'.repeat(80))
const testNumber = 1234.56
console.log(`Original: ${testNumber}`)
console.log(`English:  ${formatNumber(testNumber, 'en')}`)
console.log(`German:   ${formatNumber(testNumber, 'de')}`)
console.log(`Turkish:  ${formatNumber(testNumber, 'tr')}`)
console.log(`Arabic:   ${formatNumber(testNumber, 'ar')}`)

// Test 2: Date Formatting
console.log('\n2. DATE FORMATTING')
console.log('-'.repeat(80))
const testDate = new Date('2026-03-01T10:30:00Z')
console.log(`Original: ${testDate.toISOString()}`)
console.log(`English:  ${formatDate(testDate, 'en')}`)
console.log(`German:   ${formatDate(testDate, 'de')}`)
console.log(`Turkish:  ${formatDate(testDate, 'tr')}`)
console.log(`Arabic:   ${formatDate(testDate, 'ar')}`)

// Test 3: Currency Formatting
console.log('\n3. CURRENCY FORMATTING')
console.log('-'.repeat(80))
const testAmount = 1234.56
console.log(`Original: ${testAmount}`)
console.log(`English (USD): ${formatCurrency(testAmount, 'en')}`)
console.log(`German (EUR):  ${formatCurrency(testAmount, 'de')}`)
console.log(`Turkish (TRY): ${formatCurrency(testAmount, 'tr')}`)
console.log(`Arabic (AED):  ${formatCurrency(testAmount, 'ar')}`)

// Test 4: Language-Specific Formatters
console.log('\n4. LANGUAGE-SPECIFIC FORMATTERS')
console.log('-'.repeat(80))

const turkishContent = 'Bitcoin 1234.56 değerinde işlem görüyor.'
console.log(`Turkish Original: ${turkishContent}`)
console.log(`Turkish Formatted: ${formatTurkishFormal(turkishContent)}`)

const germanContent = 'Bitcoin handelt bei 1234.56 USD.'
console.log(`\nGerman Original: ${germanContent}`)
console.log(`German Formatted: ${formatGermanFormal(germanContent)}`)

const arabicContent = 'بيتكوين يتداول عند 1234.56 دولار'
console.log(`\nArabic Original: ${arabicContent}`)
console.log(`Arabic Formatted (RTL): ${formatArabicRTL(arabicContent)}`)

// Test 5: Cultural Reference Validation
console.log('\n5. CULTURAL REFERENCE VALIDATION')
console.log('-'.repeat(80))

const inappropriateContent = 'The market is like a pig in a poke with alcohol flowing.'
console.log(`Content: "${inappropriateContent}"`)
const culturalValidation = validateCulturalReferences(inappropriateContent, 'AE')
console.log(`Valid for UAE: ${culturalValidation.isValid}`)
console.log(`Issues: ${culturalValidation.issues.join(', ')}`)

const appropriateContent = 'Bitcoin surged 8% following institutional buying pressure.'
console.log(`\nContent: "${appropriateContent}"`)
const culturalValidation2 = validateCulturalReferences(appropriateContent, 'AE')
console.log(`Valid for UAE: ${culturalValidation2.isValid}`)
console.log(`Issues: ${culturalValidation2.issues.length === 0 ? 'None' : culturalValidation2.issues.join(', ')}`)

// Test 6: Regulatory Disclaimers
console.log('\n6. REGULATORY DISCLAIMERS')
console.log('-'.repeat(80))

const baseContent = 'Bitcoin analysis content'
console.log(`Base Content: "${baseContent}"`)
console.log(`\nTurkish (KVKK):`)
console.log(addRegulatoryDisclaimer(baseContent, 'TR'))
console.log(`\nGerman (BaFin):`)
console.log(addRegulatoryDisclaimer(baseContent, 'DE'))
console.log(`\nUAE (VARA):`)
console.log(addRegulatoryDisclaimer(baseContent, 'AE'))

// Test 7: Financial Terminology Validation
console.log('\n7. FINANCIAL TERMINOLOGY VALIDATION')
console.log('-'.repeat(80))

const inconsistentContent = 'Bitcoin and BTC are both mentioned here with Bitcoin again.'
console.log(`Content: "${inconsistentContent}"`)
const terminologyValidation = validateFinancialTerminology(inconsistentContent, 'en')
console.log(`Valid: ${terminologyValidation.isValid}`)
console.log(`Issues: ${terminologyValidation.issues.join(', ')}`)

const consistentContent = 'Bitcoin surged 8% following institutional buying pressure.'
console.log(`\nContent: "${consistentContent}"`)
const terminologyValidation2 = validateFinancialTerminology(consistentContent, 'en')
console.log(`Valid: ${terminologyValidation2.isValid}`)
console.log(`Issues: ${terminologyValidation2.issues.length === 0 ? 'None' : terminologyValidation2.issues.join(', ')}`)

// Test 8: Configuration Verification
console.log('\n8. CONFIGURATION VERIFICATION')
console.log('-'.repeat(80))

console.log('Language Formatters:')
const languages = ['tr', 'en', 'de', 'ar', 'fr', 'es', 'ru']
for (const lang of languages) {
  const formatter = LANGUAGE_FORMATTERS[lang as keyof typeof LANGUAGE_FORMATTERS]
  console.log(`  ${lang}: direction=${formatter.direction}, formality=${formatter.formalityLevel}`)
}

console.log('\nRegulatory Contexts:')
const regions = ['TR', 'US', 'DE', 'FR', 'ES', 'RU', 'AE']
for (const region of regions) {
  const context = REGULATORY_CONTEXTS[region as keyof typeof REGULATORY_CONTEXTS]
  console.log(`  ${region}: ${context.regulators.length} regulators, ${context.culturalSensitivities.length} sensitivities`)
}

console.log('\n' + '='.repeat(80))
console.log('VERIFICATION COMPLETE')
console.log('='.repeat(80))
