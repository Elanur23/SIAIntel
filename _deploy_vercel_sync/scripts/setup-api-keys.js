#!/usr/bin/env node

/**
 * SIA Intelligence Terminal - API Keys Setup Script
 * 
 * This script helps you set up API keys interactively
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(__dirname, '..', '.env.local');

console.log('\n🔑 SIA Intelligence Terminal - API Keys Setup\n');
console.log('This script will help you configure your API keys.\n');

const questions = [
  {
    key: 'TOGETHER_API_KEY',
    prompt: 'Together AI API Key (get from https://api.together.xyz/settings/api-keys): ',
    optional: true
  },
  {
    key: 'OPENROUTER_API_KEY',
    prompt: 'OpenRouter API Key (get from https://openrouter.ai/keys): ',
    optional: true
  },
  {
    key: 'CEREBRAS_API_KEY',
    prompt: 'Cerebras API Key (optional, get from https://cloud.cerebras.ai/): ',
    optional: true
  },
  {
    key: 'MISTRAL_API_KEY',
    prompt: 'Mistral AI API Key (optional, get from https://console.mistral.ai/api-keys): ',
    optional: true
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.prompt, (answer) => {
      resolve({ key: question.key, value: answer.trim() });
    });
  });
}

async function main() {
  const answers = {};

  for (const question of questions) {
    const { key, value } = await askQuestion(question);
    if (value) {
      answers[key] = value;
    }
  }

  rl.close();

  if (Object.keys(answers).length === 0) {
    console.log('\n⚠️  No keys provided. Exiting...\n');
    return;
  }

  // Read current .env.local
  let envContent = fs.readFileSync(ENV_FILE, 'utf8');

  // Update keys
  for (const [key, value] of Object.entries(answers)) {
    const regex = new RegExp(`${key}=.*`, 'g');
    envContent = envContent.replace(regex, `${key}=${value}`);
  }

  // Write back
  fs.writeFileSync(ENV_FILE, envContent);

  console.log('\n✅ API keys updated successfully!\n');
  console.log('Updated keys:');
  for (const key of Object.keys(answers)) {
    console.log(`  - ${key}`);
  }
  console.log('\n🚀 Restart your development server to apply changes:\n');
  console.log('   npm run dev\n');
}

main().catch(console.error);
