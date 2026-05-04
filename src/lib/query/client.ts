import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  dreams: {
    all: ['dreams'],
    lists: () => ['dreams', 'list'],
    list: (filters: Record<string, unknown>) => ['dreams', 'list', filters],
    details: () => ['dreams', 'detail'],
    detail: (id: string) => ['dreams', 'detail', id],
    bySlug: (slug: string) => ['dreams', 'slug', slug],
  },
  categories: {
    all: ['categories'],
    lists: () => ['categories', 'list'],
    list: (filters: Record<string, unknown>) => ['categories', 'list', filters],
    details: () => ['categories', 'detail'],
    detail: (id: string) => ['categories', 'detail', id],
  },
  blog: {
    all: ['blog'],
    lists: () => ['blog', 'list'],
    list: (filters: Record<string, unknown>) => ['blog', 'list', filters],
    details: () => ['blog', 'detail'],
    detail: (id: string) => ['blog', 'detail', id],
  },
  auth: {
    me: ['auth', 'me'],
  },
  search: {
    results: (query: string) => ['search', query],
    suggestions: (query: string) => ['search', 'suggestions', query],
    popular: (limit: number) => ['search', 'popular', limit],
    alphabet: (letter: string, page: number) => ['search', 'alphabet', letter, page],
  },
  user: {
    favorites: ['user', 'favorites'],
    history: ['user', 'history'],
    journal: ['user', 'journal'],
    likes: ['user', 'likes'],
  },
  comments: {
    all: ['comments'],
    byDream: (dreamId: string) => ['comments', dreamId],
  },
  admin: {
    all: ['admin'],
    stats: ['admin', 'stats'],
    dreams: {
      all: ['admin', 'dreams'],
      list: (filters?: Record<string, unknown>) => ['admin', 'dreams', 'list', filters],
      select: ['admin', 'dreams', 'select'],
    },
    categories: {
      all: ['admin', 'categories'],
      list: ['admin', 'categories', 'list'],
      select: ['admin', 'categories', 'select'],
    },
    blog: {
      all: ['admin', 'blog'],
      posts: ['admin', 'blog', 'posts'],
      categories: ['admin', 'blog', 'categories'],
      comments: (status?: string) => ['admin', 'blog', 'comments', status],
    },
    comments: {
      all: ['admin', 'comments'],
      pending: ['admin', 'comments', 'pending'],
    },
    messages: {
      all: ['admin', 'messages'],
      unread: ['admin', 'messages', 'unread'],
    },
    subscribers: ['admin', 'subscribers'],
    users: ['admin', 'users'],
    notifications: ['admin', 'notifications'],
    recentActivity: ['admin', 'recent-activity'],
    media: ['admin', 'media-library'],
    searchAnalytics: {
      all: ['admin', 'search-analytics'],
      stats: ['admin', 'search-stats'],
    },
    advancedStats: ['admin', 'advanced-stats'],
    auditLogs: {
      all: ['admin', 'audit-logs'],
      list: (filters: Record<string, unknown>) => ['admin', 'audit-logs', 'list', filters],
    },
    bulk: {
      seoDreams: ['admin', 'bulk-seo-dreams'],
      seoBlogs: ['admin', 'bulk-seo-blogs'],
      exportDreams: ['admin', 'export-dreams'],
      exportBlogs: ['admin', 'export-blogs'],
      importCategories: ['admin', 'import-categories'],
      importBlogCategories: ['admin', 'import-blog-categories'],
    },
  },
};