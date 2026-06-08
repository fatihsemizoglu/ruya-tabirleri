import { supabase } from '@/integrations/supabase/client';

type EntityType = 'dream' | 'category' | 'user' | 'comment' | 'blog_post' | 'blog_category' | 'setting' | 'message';
type ActionType = 'create' | 'update' | 'delete' | 'view' | 'publish' | 'unpublish' | 'approve' | 'reject';

interface LogActionParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const logAction = async ({ action, entityType, entityId, entityTitle, details }: LogActionParams) => {
    try {
      const { error } = await supabase.rpc('log_admin_action', {
        _action: action,
        _entity_type: entityType,
        _entity_id: entityId || null,
        _entity_title: entityTitle || null,
        _details: details ? JSON.parse(JSON.stringify(details)) : null,
      });

      if (error) {
        console.error('Audit log error:', error);
      }
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  return { logAction };
}
