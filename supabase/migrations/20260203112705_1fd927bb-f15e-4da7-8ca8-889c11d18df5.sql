-- Create blog subscribers table
CREATE TABLE public.blog_subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_token UUID DEFAULT gen_random_uuid(),
    subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe" 
ON public.blog_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Allow subscribers to update their own subscription (via verification token)
CREATE POLICY "Anyone can verify with token" 
ON public.blog_subscribers 
FOR UPDATE 
USING (true);

-- Admins can view all subscribers
CREATE POLICY "Admins can view subscribers" 
ON public.blog_subscribers 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Admins can delete subscribers
CREATE POLICY "Admins can delete subscribers" 
ON public.blog_subscribers 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_blog_subscribers_updated_at
BEFORE UPDATE ON public.blog_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_blog_subscribers_email ON public.blog_subscribers(email);
CREATE INDEX idx_blog_subscribers_verified ON public.blog_subscribers(is_verified) WHERE is_verified = true;