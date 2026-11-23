-- Additive staging migration. Does NOT fix existing permissive RLS policies.
-- Existing rows remain unowned until reviewed; never infer ownership from names
-- or unverified phone fields. Do not deploy as a standalone production fix.
BEGIN;
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS request_id text REFERENCES public.service_requests(id);

CREATE UNIQUE INDEX IF NOT EXISTS technicians_user_id_unique
  ON public.technicians(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS service_requests_customer_user_idx
  ON public.service_requests(customer_user_id);
CREATE INDEX IF NOT EXISTS messages_sender_user_idx ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_user_idx ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS reviews_customer_user_idx ON public.reviews(customer_user_id);
CREATE INDEX IF NOT EXISTS reviews_request_idx ON public.reviews(request_id);
COMMIT;
