import { fetchApi } from '@/lib/api';

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
      const response = await fetchApi('/admin/audit-log', {
        method: 'POST',
        body: JSON.stringify({
          action,
          entityType,
          entityId,
          entityTitle,
          details,
        }),
      });

      if (!response.success) {
        console.error('Audit log error:', response.error);
      }
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  return { logAction };
}
