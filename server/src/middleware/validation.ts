import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = <T extends z.ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        res.status(400).json({ success: false, error: 'Validation failed', details: messages });
        return;
      }
      next(error);
    }
  };
};

export const dreamSchemas = {
  create: z.object({
    title: z.string().min(3).max(200),
    slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
    content: z.string().min(50),
    category_id: z.string().uuid().optional(),
    islamic_interpretation: z.string().optional(),
    psychological_interpretation: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  }),
  update: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
    content: z.string().min(50).optional(),
    category_id: z.string().uuid().optional(),
    islamic_interpretation: z.string().optional(),
    psychological_interpretation: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category_id: z.string().uuid().optional(),
    search: z.string().optional(),
    is_published: z.enum(['true', 'false', 'all']).optional(),
    sort_by: z.enum(['created_at', 'view_count', 'like_count', 'title']).optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
};

export const authSchemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    name: z.string().min(2).max(100),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

export const blogSchemas = {
  createPost: z.object({
    title: z.string().min(3).max(200),
    slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
    content: z.string().min(50),
    excerpt: z.string().max(300).optional(),
    featured_image: z.string().url().optional(),
    category_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  }),
  updatePost: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
    content: z.string().min(50).optional(),
    excerpt: z.string().max(300).optional(),
    featured_image: z.string().url().optional(),
    category_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  }),
};

export const categorySchemas = {
  create: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    order_index: z.coerce.number().int().min(0).optional(),
  }),
  update: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    order_index: z.coerce.number().int().min(0).optional(),
  }),
};

export const contactSchemas = {
  create: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().min(5).max(200),
    message: z.string().min(10).max(5000),
  }),
};