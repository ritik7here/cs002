-- KindredBridge Pickup Coordination
-- Run once in Supabase SQL Editor after reviewing the duplicate check below.

ALTER TABLE public.pickups
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';

ALTER TABLE public.pickups
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Preserve legacy pickup completion information during migration.
UPDATE public.pickups
SET status = 'picked_up'
WHERE picked_up_at IS NOT NULL AND status = 'scheduled';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pickups_status_check'
      AND conrelid = 'public.pickups'::regclass
  ) THEN
    ALTER TABLE public.pickups
      ADD CONSTRAINT pickups_status_check
      CHECK (status IN ('scheduled', 'confirmed', 'picked_up', 'cancelled'));
  END IF;
END $$;

-- One pickup record per donation; the service reschedules a pre-pickup record
-- instead of creating duplicates. This aborts clearly if legacy duplicates exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT donation_id FROM public.pickups
    GROUP BY donation_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add pickup uniqueness: duplicate pickup rows exist for one or more donations. Resolve duplicates before rerunning this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pickups_donation_id
  ON public.pickups (donation_id);
