import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import type { BlogPost, BlogCategory, BlogComment, BlogLike, BlogSubscriber } from '../types/index';
type BlogPostWithExtras = BlogPost & { author_name?: string; category_name?: string; };

const router = Router();

// Get all blog posts
router.get('/posts', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const category_id = req.query.category_id as string;
    const tag = req.query.tag as string;
    const is_featured = req.query.is_featured === 'true';

    let query = supabase
      .from('blog_posts')
      .select('*, profiles!author_id(full_name), blog_categories(name)', { count: 'exact' })
      .eq('is_published', true);

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (tag) {
      query = query.contains('tags', JSON.stringify([tag]));
    }

    if (req.query.is_featured !== undefined) {
      query = query.eq('is_featured', is_featured);
    }

    const { data: posts, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;

    const result = (posts || []).map((p: any) => ({
      ...p,
      author_name: p.profiles?.full_name,
      category_name: p.blog_categories?.name,
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog posts' });
  }
});

// Get single blog post by slug
router.get('/posts/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*, profiles!author_id(full_name, avatar_url), blog_categories(name)')
      .eq('slug', slug)
      .single();

    if (error || !post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    // Check if user liked
    let isLiked = false;
    if (req.user) {
      const { data: likes } = await supabase
        .from('blog_likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', req.user!.id);
      isLiked = (likes?.length ?? 0) > 0;
    }

    res.json({
      success: true,
      data: {
        ...post,
        author_name: (post as any).profiles?.full_name,
        author_avatar: (post as any).profiles?.avatar_url,
        category_name: (post as any).blog_categories?.name,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog post' });
  }
});

// Create blog post (admin/moderator only)
router.post('/posts', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      category_id,
      featured_image,
      is_published,
      is_featured,
      scheduled_at,
      tags,
      meta_title,
      meta_description,
    } = req.body;

    if (!title || !slug || !content) {
      res.status(400).json({ success: false, error: 'Title, slug, and content are required' });
      return;
    }

    const id = uuidv4();
    const author_id = req.user!.id;

    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        id,
        title,
        slug,
        content,
        excerpt: excerpt || null,
        author_id,
        category_id: category_id || null,
        featured_image: featured_image || null,
        is_published: is_published !== undefined ? is_published : true,
        is_featured: is_featured || false,
        scheduled_at: scheduled_at || null,
        tags: JSON.stringify(tags || []),
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to create blog post' });
  }
});

// Update blog post
router.put('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      content,
      excerpt,
      category_id,
      featured_image,
      is_published,
      is_featured,
      scheduled_at,
      tags,
      meta_title,
      meta_description,
    } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('blog_posts')
      .update({
        title: title ?? existing.title,
        slug: slug ?? existing.slug,
        content: content ?? existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        category_id: category_id !== undefined ? category_id : existing.category_id,
        featured_image: featured_image !== undefined ? featured_image : existing.featured_image,
        is_published: is_published !== undefined ? is_published : existing.is_published,
        is_featured: is_featured !== undefined ? is_featured : existing.is_featured,
        scheduled_at: scheduled_at !== undefined ? scheduled_at : existing.scheduled_at,
        tags: tags ? JSON.stringify(tags) : existing.tags,
        meta_title: meta_title !== undefined ? meta_title : existing.meta_title,
        meta_description: meta_description !== undefined ? meta_description : existing.meta_description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    await supabase.from('blog_posts').delete().eq('id', id);

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog post' });
  }
});

// Like/Unlike blog post
router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: existing } = await supabase
      .from('blog_likes')
      .select('*')
      .eq('post_id', id)
      .eq('user_id', userId);

    if ((existing?.length ?? 0) > 0) {
      await supabase.from('blog_likes').delete().eq('post_id', id).eq('user_id', userId);

      // Decrement like count
      const { data: post } = await supabase.from('blog_posts').select('like_count').eq('id', id).single();
      await supabase
        .from('blog_posts')
        .update({ like_count: Math.max(0, (post?.like_count || 0) - 1) })
        .eq('id', id);

      res.json({ success: true, liked: false, message: 'Post unliked' });
    } else {
      await supabase
        .from('blog_likes')
        .insert({ id: uuidv4(), post_id: id, user_id: userId, created_at: new Date().toISOString() });

      // Increment like count
      const { data: post } = await supabase.from('blog_posts').select('like_count').eq('id', id).single();
      await supabase
        .from('blog_posts')
        .update({ like_count: (post?.like_count || 0) + 1 })
        .eq('id', id);

      res.json({ success: true, liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Like blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to like/unlike post' });
  }
});

// Get blog categories
router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    // Get post counts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('category_id')
      .eq('is_published', true);

    const postCountMap: Record<string, number> = {};
    (posts || []).forEach((p: any) => {
      if (p.category_id) {
        postCountMap[p.category_id] = (postCountMap[p.category_id] || 0) + 1;
      }
    });

    const result = (categories || []).map((c: any) => ({
      ...c,
      post_count: postCountMap[c.id] || 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog categories' });
  }
});

// Create blog category
router.post('/categories', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, order_index } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required' });
      return;
    }

    const id = uuidv4();

    const { data: newCategory, error } = await supabase
      .from('blog_categories')
      .insert({
        id,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        order_index: order_index || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Create blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create blog category' });
  }
});

// Update blog category
router.put('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, order_index } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Blog category not found' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('blog_categories')
      .update({
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        order_index: order_index !== undefined ? order_index : existing.order_index,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update blog category' });
  }
});

// Delete blog category
router.delete('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Blog category not found' });
      return;
    }

    // Set category_id to NULL for posts in this category
    await supabase
      .from('blog_posts')
      .update({ category_id: null })
      .eq('category_id', id);

    await supabase.from('blog_categories').delete().eq('id', id);

    res.json({ success: true, message: 'Blog category deleted successfully' });
  } catch (error) {
    console.error('Delete blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog category' });
  }
});

// Get blog comments
router.get('/posts/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select('*, profiles!user_id(full_name, avatar_url)')
      .eq('post_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (comments || []).map((c: any) => ({
      ...c,
      author_name: c.profiles?.full_name,
      author_avatar: c.profiles?.avatar_url,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get blog comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog comments' });
  }
});

// Add blog comment
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Comment content is required' });
      return;
    }

    const commentId = uuidv4();

    const { error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        id: commentId,
        content,
        post_id: id,
        user_id: userId,
        parent_id: parent_id || null,
        is_approved: true,
        like_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    const { data: newComment, error } = await supabase
      .from('blog_comments')
      .select('*, profiles!user_id(full_name, avatar_url)')
      .eq('id', commentId)
      .single();

    if (error) throw error;

    const result: any = {
      ...newComment,
      author_name: (newComment as any).profiles?.full_name,
      author_avatar: (newComment as any).profiles?.avatar_url,
    };

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Add blog comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// Subscribe to newsletter
router.post('/subscribe', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('blog_subscribers')
      .select('*')
      .eq('email', email);

    if ((existing?.length ?? 0) > 0) {
      if (existing![0].unsubscribed_at) {
        // Resubscribe
        await supabase
          .from('blog_subscribers')
          .update({
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
        res.json({ success: true, message: 'Resubscribed successfully' });
      } else {
        res.status(400).json({ success: false, error: 'Already subscribed' });
      }
      return;
    }

    const id = uuidv4();
    const verificationToken = uuidv4();

    await supabase
      .from('blog_subscribers')
      .insert({
        id,
        email,
        name: name || null,
        is_verified: false,
        verification_token: verificationToken,
        subscribed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully. Please check your email to verify.',
      verification_token: verificationToken,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// Verify subscription
router.post('/verify-subscription', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    const { data: subscribers, error } = await supabase
      .from('blog_subscribers')
      .select('*')
      .eq('verification_token', token);

    if (error || !subscribers || subscribers.length === 0) {
      res.status(404).json({ success: false, error: 'Invalid verification token' });
      return;
    }

    await supabase
      .from('blog_subscribers')
      .update({
        is_verified: true,
        verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscribers[0].id);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify subscription' });
  }
});

// Unsubscribe
router.post('/unsubscribe', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    await supabase
      .from('blog_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

// Get popular tags
router.get('/tags', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('tags')
      .eq('is_published', true)
      .not('tags', 'is', null);

    if (error) throw error;

    const tagCount: Record<string, number> = {};
    (posts || []).forEach((post: any) => {
      try {
        const tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    res.json({ success: true, data: sortedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tags' });
  }
});

export default router;
