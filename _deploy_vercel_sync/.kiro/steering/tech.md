# Technology Stack

## Framework & Language

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js 18+
- **Build Tool**: SWC (Speedy Web Compiler)

## Frontend

- **Styling**: Tailwind CSS with custom configuration
- **UI Components**: Headless UI, Heroicons, Lucide React
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: @tailwindcss/forms
- **Notifications**: react-hot-toast

## Backend & APIs

- **API Routes**: Next.js App Router API routes (`app/api/`)
- **AI Integration**: OpenAI (GPT-4, DALL-E)
- **Analytics**: Google Analytics 4 API, Google Search Console API
- **SEO**: next-seo, next-sitemap
- **Image Processing**: Sharp

## Development Tools

- **Linting**: ESLint with TypeScript ESLint plugin
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript compiler

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
```

### Quality Checks
```bash
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### SEO & Sitemap
```bash
npm run sitemap      # Generate sitemap
```

## Environment Variables

Required in `.env.local`:
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GOOGLE_ADSENSE_ID` - Google AdSense publisher ID
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - GA4 measurement ID
- `GA4_PROPERTY_ID` - GA4 property ID
- `GA4_CLIENT_EMAIL` - Service account email
- `GA4_PRIVATE_KEY` - Service account private key
- `GOOGLE_CLIENT_EMAIL` - Search Console service account
- `GOOGLE_PRIVATE_KEY` - Search Console private key
- `SITE_URL` - Production site URL
- `SITE_NAME` - Site name

## Build Configuration

- **Output**: Standalone mode for optimized deployment
- **Image Optimization**: WebP and AVIF formats, multiple device sizes
- **Compression**: Enabled
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Caching**: Public, max-age=31536000 for static assets

## Performance Targets

- Page Load Time: < 1.5s
- Mobile Score: 100%
- SEO Score: 95/100
- Core Web Vitals: A+ rating
