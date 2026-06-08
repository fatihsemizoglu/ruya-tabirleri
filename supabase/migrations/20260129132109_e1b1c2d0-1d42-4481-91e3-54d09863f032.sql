-- Create contact_messages table
CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can view messages
CREATE POLICY "Admins can view all messages"
ON public.contact_messages
FOR SELECT
USING (is_admin(auth.uid()));

-- Anyone can insert messages (contact form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
ON public.contact_messages
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.contact_messages
FOR DELETE
USING (is_admin(auth.uid()));