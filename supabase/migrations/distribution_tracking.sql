-- KindredBridge Distribution Tracking
-- Apply once in Supabase SQL Editor after the Pickup Coordination migration.

ALTER TABLE public.distributions
  ADD COLUMN IF NOT EXISTS quantity_distributed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'distributions_quantity_distributed_nonnegative'
      AND conrelid = 'public.distributions'::regclass
  ) THEN
    ALTER TABLE public.distributions
      ADD CONSTRAINT distributions_quantity_distributed_nonnegative
      CHECK (quantity_distributed >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_distributions_donation_created
  ON public.distributions (donation_id, created_at DESC);

-- The API uses the service-role client and enforces actor/organization authorization.
-- This function serializes distribution quantity updates for each donation so concurrent
-- requests cannot distribute more units than were donated.
CREATE OR REPLACE FUNCTION public.record_distribution_event(
  p_id UUID,
  p_donation_id UUID,
  p_ngo_id UUID,
  p_distribution_date DATE,
  p_quantity_distributed INTEGER,
  p_location TEXT,
  p_beneficiaries_reached INTEGER,
  p_proof_image_url TEXT,
  p_impact_report TEXT,
  p_notes_to_donor TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donation_row public.donations%ROWTYPE;
  already_distributed INTEGER;
  next_total INTEGER;
BEGIN
  IF p_quantity_distributed IS NULL OR p_quantity_distributed <= 0 THEN
    RAISE EXCEPTION 'quantity_distributed must be greater than zero';
  END IF;
  IF p_beneficiaries_reached IS NULL OR p_beneficiaries_reached < 0 THEN
    RAISE EXCEPTION 'beneficiaries_reached must be zero or greater';
  END IF;

  SELECT * INTO donation_row
  FROM public.donations
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;
  IF donation_row.matched_ngo_id IS DISTINCT FROM p_ngo_id THEN
    RAISE EXCEPTION 'Distribution NGO does not match the assigned NGO';
  END IF;
  IF donation_row.status <> 'Received by NGO' THEN
    RAISE EXCEPTION 'Donation must be received by the NGO before distribution';
  END IF;

  SELECT COALESCE(SUM(quantity_distributed), 0)::INTEGER
  INTO already_distributed
  FROM public.distributions
  WHERE donation_id = p_donation_id;

  next_total := already_distributed + p_quantity_distributed;
  IF next_total > donation_row.quantity THEN
    RAISE EXCEPTION 'Distribution quantity exceeds the remaining donated quantity';
  END IF;

  INSERT INTO public.distributions (
    id, donation_id, ngo_id, distribution_date, quantity_distributed,
    location, beneficiaries_reached, proof_image_url, impact_report,
    notes_to_donor, created_at, updated_at
  ) VALUES (
    p_id, p_donation_id, p_ngo_id, p_distribution_date, p_quantity_distributed,
    p_location, p_beneficiaries_reached, p_proof_image_url, p_impact_report,
    p_notes_to_donor, now(), now()
  );

  IF next_total = donation_row.quantity THEN
    UPDATE public.donations
    SET status = 'Distributed', updated_at = now()
    WHERE id = p_donation_id AND status = 'Received by NGO';
  END IF;

  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_distribution_event(UUID, UUID, UUID, DATE, INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_distribution_event(UUID, UUID, UUID, DATE, INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;
