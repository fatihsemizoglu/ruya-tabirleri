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
    all: ['dreams'] as const,
    lists: () => [...queryKeys.dreams.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.dreams.lists(), filters] as const,
    details: () => [...queryKeys.dreams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.dreams.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.dreams.all, 'slug', slug] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  blog: {
    all: ['blog'] as const,
    lists: () => [...queryKeys.blog.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.blog.lists(), filters] as const,
    details: () => [...queryKeys.blog.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.blog.details(), id] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  search: {
    results: (query: string) => ['search', query] as const,
    suggestions: (query: string) => ['search', 'suggestions', query] as const,
    popular: (limit: number) => ['search', 'popular', limit] as const,
    alphabet: (letter: string, page: number) => ['search', 'alphabet', letter, page] as const,
  },
  user: {
    favorites: ['user', 'favorites'] as const,
    history: ['user', 'history'] as const,
    journal: ['user', 'journal'] as const,
    likes: ['user', 'likes'] as const,
  },
  comments: {
    all: ['comments'] as const,
    byDream: (dreamId: string) => ['comments', dreamId] as const,
  },
  admin: {
    all: ['admin'] as const,
    stats: ['admin', 'stats'] as const,
    dreams: {
      all: [...queryKeys.admin.all, 'dreams'] as const,
      list: (filters?: Record<string, unknown>) => [...queryKeys.admin.dreams.all, 'list', filters] as const,
      select: [...queryKeys.admin.dreams.all, 'select'] as const,
    },
    categories: {
      all: [...queryKeys.admin.all, 'categories'] as const,
      list: [...queryKeys.admin.categories.all, 'list'] as const,
      select: [...queryKeys.admin.categories.all, 'select'] as const,
    },
    blog: {
      all: [...queryKeys.admin.all, 'blog'] as const,
      posts: [...queryKeys.admin.blog.all, 'posts'] as const,
      categories: [...queryKeys.admin.blog.all, 'categories'] as const,
      comments: (status?: string) => [...queryKeys.admin.blog.all, 'comments', status] as const,
    },
    comments: {
      all: [...queryKeys.admin.all, 'comments'] as const,
      pending: [...queryKeys.admin.comments.all, 'pending'] as const,
    },
    messages: {
      all: [...queryKeys.admin.all, 'messages'] as const,
      unread: [...queryKeys.admin.messages.all, 'unread'] as const,
    },
    subscribers: [...queryKeys.admin.all, 'subscribers'] as const,
    users: [...queryKeys.admin.all, 'users'] as const,
    notifications: [...queryKeys.admin.all, 'notifications'] as const,
    recentActivity: [...queryKeys.admin.all, 'recent-activity'] as const,
    media: [...queryKeys.admin.all, 'media-library'] as const,
    searchAnalytics: {
      all: [...queryKeys.admin.all, 'search-analytics'] as const,
      stats: [...queryKeys.admin.all, 'search-stats'] as const,
    },
    advancedStats: [...queryKeys.admin.all, 'advanced-stats'] as const,
    auditLogs: {
      all: [...queryKeys.admin.all, 'audit-logs'] as const,
      list: (filters: Record<string, unknown>) => [...queryKeys.admin.auditLogs.all, filters] as const,
    },
    bulk: {
      seoDreams: [...queryKeys.admin.all, 'bulk-seo-dreams'] as const,
      seoBlogs: [...queryKeys.admin.all, 'bulk-seo-blogs'] as const,
      exportDreams: [...queryKeys.admin.all, 'export-dreams'] as const,
      exportBlogs: [...queryKeys.admin.all, 'export-blogs'] as const,
      importCategories: [...queryKeys.admin.all, 'import-categories'] as const,
      importBlogCategories: [...queryKeys.admin.all, 'import-blog-categories'] as const,
    },
  },
};