-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_title TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert audit logs (through functions)
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    _action TEXT,
    _entity_type TEXT,
    _entity_id UUID DEFAULT NULL,
    _entity_title TEXT DEFAULT NULL,
    _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, entity_title, details)
    VALUES (auth.uid(), _action, _entity_type, _entity_id, _entity_title, _details)
    RETURNING id INTO _log_id;
    
    RETURN _log_id;
END;
$$;