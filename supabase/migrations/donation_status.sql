-- KindredBridge: persistent donation status history.
-- Apply this migration in Supabase SQL Editor before deploying the matching backend patch.
-- Existing donations are intentionally not backfilled with guessed transition timestamps.

CREATE TABLE IF NOT EXISTS public.donation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  actor_id UUID NULL
);

CREATE INDEX IF NOT EXISTS idx_donation_status_history_donation_time
  ON public.donation_status_history (donation_id, changed_at ASC);

ALTER TABLE public.donation_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.donation_status_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.donation_status_history TO service_role;

CREATE OR REPLACE FUNCTION public.record_donation_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.donation_status_history (
      donation_id, from_status, to_status, changed_at, actor_id
    ) VALUES (
      NEW.id, NULL, NEW.status, COALESCE(NEW.created_at, clock_timestamp()), auth.uid()
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.donation_status_history (
      donation_id, from_status, to_status, changed_at, actor_id
    ) VALUES (
      NEW.id, OLD.status, NEW.status, clock_timestamp(), auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_donation_status_history ON public.donations;
CREATE TRIGGER trg_record_donation_status_history
AFTER INSERT OR UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.record_donation_status_history();

REVOKE ALL ON FUNCTION public.record_donation_status_history() FROM PUBLIC, anon, authenticated;
