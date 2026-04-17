const result = {
  ga4_private_key: 'MISSING',
  ga4_client_email: 'MISSING',
  ga4_property_id: 'MISSING',
  naming_conflict: false,
  root_cause: '',
  next_fix: ''
}

// Check GA4_PRIVATE_KEY
const privateKey = process.env.GA4_PRIVATE_KEY

if (privateKey) {
  if (privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
    result.ga4_private_key = 'OK'
  } else {
    result.ga4_private_key = 'INVALID'
  }
} else {
  result.ga4_private_key = 'MISSING'
}

// Check GA4_CLIENT_EMAIL
const clientEmail = process.env.GA4_CLIENT_EMAIL

if (clientEmail) {
  if (clientEmail.includes('@') && clientEmail.includes('.iam.gserviceaccount.com')) {
    result.ga4_client_email = 'OK'
  } else {
    result.ga4_client_email = 'INVALID'
  }
} else {
  result.ga4_client_email = 'MISSING'
}

// Check GA4_PROPERTY_ID
const propertyId = process.env.GA4_PROPERTY_ID

if (propertyId) {
  if (propertyId.startsWith('properties/') || /^\d+$/.test(propertyId)) {
    result.ga4_property_id = 'OK'
  } else {
    result.ga4_property_id = 'INVALID'
  }
} else {
  result.ga4_property_id = 'MISSING'
}

// Determine root cause
const missing = []
if (result.ga4_private_key === 'MISSING') missing.push('GA4_PRIVATE_KEY')
if (result.ga4_client_email === 'MISSING') missing.push('GA4_CLIENT_EMAIL')
if (result.ga4_property_id === 'MISSING') missing.push('GA4_PROPERTY_ID')

const invalid = []
if (result.ga4_private_key === 'INVALID') invalid.push('GA4_PRIVATE_KEY')
if (result.ga4_client_email === 'INVALID') invalid.push('GA4_CLIENT_EMAIL')
if (result.ga4_property_id === 'INVALID') invalid.push('GA4_PROPERTY_ID')

if (missing.length > 0) {
  result.root_cause = `Missing: ${missing.join(', ')}`
  result.next_fix = `Add ${missing[0]} to .env.local`
} else if (invalid.length > 0) {
  result.root_cause = `Invalid: ${invalid.join(', ')}`
  result.next_fix = `Fix ${invalid[0]} format in .env.local`
} else {
  result.root_cause = 'All credentials present'
  result.next_fix = 'Test GA4 connection'
}

console.log(JSON.stringify(result, null, 2))
