declare namespace NodeJS {
  interface ProcessEnv {
    // 🛡️ CRITICAL SECURITY & AUTH
    ADMIN_SECRET: string;
    SESSION_SECRET: string;
    NEXTAUTH_SECRET: string;
    NEXT_PUBLIC_ADMIN_PASSWORD: string;
    SIGNED_URL_SECRET: string;
    REVALIDATION_SECRET: string;
    DB_ENCRYPTION_KEY: string;
    API_KEYS: string;

    // 🧠 AI & INTELLIGENCE APIs
    GROQ_API_KEY: string;
    GEMINI_API_KEY: string;
    OPENAI_API_KEY?: string;
    HUGGINGFACE_API_KEY?: string;

    // 🗄️ DATABASE & INFRASTRUCTURE
    DATABASE_URL: string;
    TURSO_DATABASE_URL?: string;
    TURSO_AUTH_TOKEN?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_URL?: string;

    // 📡 COMMUNICATIONS & MONITORING
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    SLACK_WEBHOOK_URL?: string;
    DISCORD_WEBHOOK_URL?: string;

    // 🌐 DEPLOYMENT & NETWORKING
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_BASE_URL: string;
    SIAINTEL_BACKEND_URL: string;
    NEXT_PUBLIC_SIAINTEL_BACKEND_URL: string;

    // 📊 ANALYTICS & ADS
    NEXT_PUBLIC_GA4_MEASUREMENT_ID?: string;
    NEXT_PUBLIC_GTM_ID?: string;
    NEXT_PUBLIC_GOOGLE_ADSENSE_ID?: string;
  }
}
