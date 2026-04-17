// Mock API functions - Gerçek uygulamada bu fonksiyonlar gerçek API'lerden veri çekecek

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  category: string
  author: {
    name: string
    avatar: string
    bio: string
  }
  publishedAt: string
  updatedAt: string
  featuredImage: {
    url: string
    alt: string
    width: number
    height: number
  }
  tags: string[]
  readTime: number
  views: number
  likes: number
  shares: number
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
    canonicalUrl: string
  }
  isBreaking: boolean
  isFeatured: boolean
  isPremium: boolean
  video?: {
    id: string
    url?: string
    thumbnailUrl?: string
    duration: number
    provider: string
    status: 'processing' | 'completed' | 'failed'
    generatedAt: string
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  parentId?: string
}

// Mock data
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Breaking: Major Economic Policy Changes Announced by Federal Reserve',
    excerpt: 'The Federal Reserve announced significant changes to monetary policy today, affecting interest rates and inflation targets. Market analysts are closely watching the implications.',
    content: 'Detailed news content will be here...',
    slug: 'federal-reserve-economic-policy-changes-announced',
    category: 'business',
    author: {
      name: 'John Smith',
      avatar: '/authors/john-smith.jpg',
      bio: 'Business correspondent with 15 years of experience'
    },
    publishedAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
      alt: 'Federal Reserve Building',
      width: 800,
      height: 400
    },
    tags: ['federal reserve', 'economy', 'interest rates', 'monetary policy'],
    readTime: 5,
    views: 2150,
    likes: 89,
    shares: 34,
    seo: {
      metaTitle: 'Breaking: Major Economic Policy Changes Announced by Federal Reserve',
      metaDescription: 'The Federal Reserve announced significant changes to monetary policy today, affecting interest rates and inflation targets.',
      keywords: ['federal reserve', 'economic policy', 'interest rates'],
      canonicalUrl: '/news/federal-reserve-economic-policy-changes-announced'
    },
    isBreaking: true,
    isFeatured: true,
    isPremium: false
  },
  {
    id: '2',
    title: 'NFL Playoffs: Dramatic Overtime Victory Sends Team to Championship',
    excerpt: 'In a thrilling overtime battle, the home team secured their spot in the championship game with a spectacular touchdown pass in the final moments.',
    content: 'Detailed news content will be here...',
    slug: 'nfl-playoffs-dramatic-overtime-victory-championship',
    category: 'sports',
    author: {
      name: 'Mike Johnson',
      avatar: '/authors/mike-johnson.jpg',
      bio: 'Sports reporter covering NFL and college football'
    },
    publishedAt: '2024-02-01T09:30:00Z',
    updatedAt: '2024-02-01T09:30:00Z',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
      alt: 'NFL Stadium Celebration',
      width: 800,
      height: 400
    },
    tags: ['nfl', 'playoffs', 'football', 'championship'],
    readTime: 4,
    views: 1890,
    likes: 156,
    shares: 67,
    seo: {
      metaTitle: 'NFL Playoffs: Dramatic Overtime Victory Sends Team to Championship',
      metaDescription: 'In a thrilling overtime battle, the home team secured their spot in the championship game.',
      keywords: ['nfl playoffs', 'overtime victory', 'championship'],
      canonicalUrl: '/news/nfl-playoffs-dramatic-overtime-victory-championship'
    },
    isBreaking: false,
    isFeatured: true,
    isPremium: false
  },
  {
    id: '3',
    title: 'Tech Giants Announce Major AI Breakthrough in Healthcare Applications',
    excerpt: 'Leading technology companies unveiled revolutionary AI systems that could transform medical diagnosis and treatment, promising faster and more accurate healthcare solutions.',
    content: 'Detailed news content will be here...',
    slug: 'tech-giants-ai-breakthrough-healthcare-applications',
    category: 'technology',
    author: {
      name: 'Sarah Davis',
      avatar: '/authors/sarah-davis.jpg',
      bio: 'Technology editor specializing in AI and healthcare tech'
    },
    publishedAt: '2024-02-01T08:45:00Z',
    updatedAt: '2024-02-01T08:45:00Z',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
      alt: 'AI Healthcare Technology',
      width: 800,
      height: 400
    },
    tags: ['artificial intelligence', 'healthcare', 'technology', 'medical'],
    readTime: 6,
    views: 1254,
    likes: 78,
    shares: 23,
    seo: {
      metaTitle: 'Tech Giants Announce Major AI Breakthrough in Healthcare Applications',
      metaDescription: 'Leading technology companies unveiled revolutionary AI systems that could transform medical diagnosis and treatment.',
      keywords: ['ai healthcare', 'medical technology', 'artificial intelligence'],
      canonicalUrl: '/news/tech-giants-ai-breakthrough-healthcare-applications'
    },
    isBreaking: false,
    isFeatured: false,
    isPremium: true
  },
  {
    id: '4',
    title: 'Hollywood Stars Shine at Annual Awards Ceremony Red Carpet',
    excerpt: 'The biggest names in entertainment dazzled on the red carpet at last night\'s prestigious awards ceremony, showcasing stunning fashion and memorable moments.',
    content: 'Detailed news content will be here...',
    slug: 'hollywood-stars-annual-awards-ceremony-red-carpet',
    category: 'entertainment',
    author: {
      name: 'Emma Wilson',
      avatar: '/authors/emma-wilson.jpg',
      bio: 'Entertainment correspondent covering Hollywood events'
    },
    publishedAt: '2024-02-01T07:30:00Z',
    updatedAt: '2024-02-01T07:30:00Z',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=400&fit=crop',
      alt: 'Red Carpet Awards Ceremony',
      width: 800,
      height: 400
    },
    tags: ['hollywood', 'awards', 'celebrities', 'red carpet'],
    readTime: 3,
    views: 987,
    likes: 234,
    shares: 89,
    seo: {
      metaTitle: 'Hollywood Stars Shine at Annual Awards Ceremony Red Carpet',
      metaDescription: 'The biggest names in entertainment dazzled on the red carpet at last night\'s prestigious awards ceremony.',
      keywords: ['hollywood awards', 'red carpet', 'celebrities'],
      canonicalUrl: '/news/hollywood-stars-annual-awards-ceremony-red-carpet'
    },
    isBreaking: false,
    isFeatured: false,
    isPremium: false
  },
  {
    id: '5',
    title: 'Severe Weather Alert: Major Storm System Approaching East Coast',
    excerpt: 'Meteorologists warn of a powerful storm system bringing heavy snow, ice, and dangerous winds to the Eastern United States over the next 48 hours.',
    content: 'Detailed news content will be here...',
    slug: 'severe-weather-alert-storm-system-east-coast',
    category: 'weather',
    author: {
      name: 'David Chen',
      avatar: '/authors/david-chen.jpg',
      bio: 'Chief meteorologist with 20 years of forecasting experience'
    },
    publishedAt: '2024-02-01T06:15:00Z',
    updatedAt: '2024-02-01T06:15:00Z',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=400&fit=crop',
      alt: 'Storm Clouds Weather System',
      width: 800,
      height: 400
    },
    tags: ['weather', 'storm', 'east coast', 'severe weather'],
    readTime: 4,
    views: 1567,
    likes: 45,
    shares: 78,
    seo: {
      metaTitle: 'Severe Weather Alert: Major Storm System Approaching East Coast',
      metaDescription: 'Meteorologists warn of a powerful storm system bringing heavy snow, ice, and dangerous winds to the Eastern United States.',
      keywords: ['severe weather', 'storm alert', 'east coast weather'],
      canonicalUrl: '/news/severe-weather-alert-storm-system-east-coast'
    },
    isBreaking: true,
    isFeatured: true,
    isPremium: false
  }
]

const mockCategories: Category[] = [
  { id: '1', name: 'Breaking News', slug: 'breaking-news', description: 'Latest breaking news and urgent updates', color: '#e74c3c', icon: '🚨' },
  { id: '2', name: 'Politics', slug: 'politics', description: 'Political news and government updates', color: '#3498db', icon: '🏛️' },
  { id: '3', name: 'Business', slug: 'business', description: 'Business, finance and market news', color: '#f39c12', icon: '💼' },
  { id: '4', name: 'Technology', slug: 'technology', description: 'Tech news, gadgets and innovation', color: '#9b59b6', icon: '💻' },
  { id: '5', name: 'Sports', slug: 'sports', description: 'Sports news, scores and updates', color: '#27ae60', icon: '⚽' },
  { id: '6', name: 'Entertainment', slug: 'entertainment', description: 'Celebrity news, movies and TV shows', color: '#e67e22', icon: '🎬' },
  { id: '7', name: 'Health', slug: 'health', description: 'Health, medical and wellness news', color: '#1abc9c', icon: '🏥' },
  { id: '8', name: 'Science', slug: 'science', description: 'Science discoveries and research', color: '#34495e', icon: '🔬' },
  { id: '9', name: 'World', slug: 'world', description: 'International news and global events', color: '#8e44ad', icon: '🌍' },
  { id: '10', name: 'Weather', slug: 'weather', description: 'Weather forecasts and climate news', color: '#16a085', icon: '🌤️' },
  { id: '11', name: 'Local', slug: 'local', description: 'Local community news and events', color: '#2c3e50', icon: '🏘️' },
  { id: '12', name: 'Crime', slug: 'crime', description: 'Crime reports and law enforcement news', color: '#c0392b', icon: '🚔' }
]

// API Functions
export async function getLatestNews(limit: number = 10): Promise<NewsArticle[]> {
  // Gerçek uygulamada burada API çağrısı yapılacak
  await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API delay
  
  return mockArticles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export async function getFeaturedNews(limit: number = 5): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockArticles
    .filter(article => article.isFeatured)
    .slice(0, limit)
}

export async function getBreakingNews(): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockArticles.filter(article => article.isBreaking)
}

export async function getCategoryNews(categories: string[], limit: number = 4): Promise<Record<string, NewsArticle[]>> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const result: Record<string, NewsArticle[]> = {}
  
  categories.forEach(category => {
    result[category] = mockArticles
      .filter(article => article.category === category)
      .slice(0, limit)
  })
  
  return result
}

export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockArticles.find(article => article.slug === slug) || null
}

export async function getRelatedArticles(articleId: string, limit: number = 4): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const article = mockArticles.find(a => a.id === articleId)
  if (!article) return []
  
  return mockArticles
    .filter(a => a.id !== articleId && a.category === article.category)
    .slice(0, limit)
}

export async function searchArticles(query: string, limit: number = 20): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const searchTerm = query.toLowerCase()
  
  return mockArticles
    .filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.excerpt.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
    .slice(0, limit)
}

export async function getCategories(): Promise<Category[]> {
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return mockCategories
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return mockCategories.find(category => category.slug === slug) || null
}

export async function getTrendingArticles(limit: number = 10): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockArticles
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

export async function getMostLikedArticles(limit: number = 10): Promise<NewsArticle[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockArticles
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit)
}

// Newsletter subscription
export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Gerçek uygulamada burada email validation ve database kayıt işlemi yapılacak
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Geçerli bir e-posta adresi girin.' }
  }
  
  return { success: true, message: 'Başarıyla abone oldunuz!' }
}

// Contact form submission
export async function submitContactForm(data: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Gerçek uygulamada burada form validation ve email gönderimi yapılacak
  if (!data.name || !data.email || !data.message) {
    return { success: false, message: 'Lütfen tüm alanları doldurun.' }
  }
  
  return { success: true, message: 'Mesajınız başarıyla gönderildi!' }
}