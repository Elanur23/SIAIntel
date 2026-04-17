#!/usr/bin/env node
require('tsx/cjs');
const { getGlobalDatabase } = require('./lib/neural-assembly/database');

const db = getGlobalDatabase();
const testId = 'test-' + Date.now();

const mic = {
  id: testId,
  version: 1,
  created_at: Date.now(),
  updated_at: Date.now(),
  truth_nucleus: {
    facts: [],
    claims: [],
    impact_analysis: 'test',
    geopolitical_context: 'test'
  },
  structural_atoms: {
    core_thesis: 'test',
    key_entities: [],
    temporal_markers: [],
    numerical_data: []
  },
  metadata: {
    category: 'test',
    urgency: 'standard',
    target_regions: []
  }
};

console.log('Saving MIC with ID:', testId);
db.saveMIC(mic);

console.log('Retrieving MIC...');
const retrieved = db.getMIC(testId);

console.log('Result:', retrieved ? 'SUCCESS' : 'FAILED');
if (retrieved) {
  console.log('Retrieved ID:', retrieved.id);
} else {
  console.log('ERROR: getMIC returned null!');
}
