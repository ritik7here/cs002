-- S1: KindredBridge schema foundation
-- All tables except auth.users (managed by Supabase Auth in S2).
-- This migration is designed to apply to a fresh Supabase project.

-- ============================================================
-- ENUMS
-- ============================================================
-- Why enums: Postgres enforces valid values at the DB level, so
-- the backend can't accidentally write 'Submited' or 'fullfilled'.

CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');

CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');

CREATE TYPE donation_category AS ENUM (
  'Food & Groceries',
  'Clothing & Blankets',
  'Medical Supplies',
  'Educational Material',
  'Electronics & Devices',
  'Financial Aid',
  'Hygiene & Sanitation',
  'Other Essentials'
);

CREATE TYPE cause_category AS ENUM (
  'Disaster Relief',
  'Hunger & Nutrition',
  'Education & Youth',
  'Healthcare & Medical',
  'Shelter & Clothing',
  'Environment & Animal Welfare',
  'Women Empowerment',
  'Elderly Care'
);

CREATE TYPE item_condition AS ENUM (
  'Brand New',
  'Gently Used',
  'Used - Good Condition',
  'Not Applicable (Consumable/Cash)'
);

CREATE TYPE urgency_level AS ENUM ('Low', 'Medium', 'High', 'Critical / Emergency');

-- Donation status: this is the frontend's current vocabulary.
-- D1 (transition rules) is still OPEN — we define the enum values
-- here but don't enforce transitions in the DB. That's the backend's
-- job (S7), using a transition table it owns.
CREATE TYPE donation_status AS ENUM (
  'Submitted',
  'Matched',
  'Pickup Scheduled',
  'In Transit',
  'Received by NGO',
  'Distributed',
  'Cancelled'
);

CREATE TYPE requirement_status AS ENUM ('Open', 'Partially Fulfilled', 'Fulfilled', 'Closed');

CREATE TYPE donation_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'alert');

-- ============================================================
-- PROFILES
-- ============================================================
-- Linked to Supabase auth.users via id. In S2 we'll add the FK
-- and RLS policies. For now the column is a plain UUID so the
-- migration applies without auth.users existing.

CREATE TABLE profiles (
  id            UUID PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  role          user_role   NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  location      TEXT        NOT NULL DEFAULT '',
  organization_id UUID,       -- FK to ngos, set when role = 'ngo'
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NGOs
-- ============================================================

CREATE TABLE ngos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  registration_number   TEXT NOT NULL,
  tax_exempt_id         TEXT NOT NULL,
  verification_status   verification_status NOT NULL DEFAULT 'pending',
  description           TEXT NOT NULL DEFAULT '',
  mission_statement     TEXT NOT NULL DEFAULT '',
  contact_email         TEXT NOT NULL,
  phone                 TEXT NOT NULL DEFAULT '',
  address               TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL DEFAULT '',
  state                 TEXT NOT NULL DEFAULT '',
  website               TEXT NOT NULL DEFAULT '',
  founded_year          INT,
  -- Denormalized counters — updated by triggers or application code.
  -- Cheaper than COUNT(*) on every page load for public-facing cards.
  beneficiaries_count     INT NOT NULL DEFAULT 0,
  active_campaigns_count  INT NOT NULL DEFAULT 0,
  causes                cause_category[] NOT NULL DEFAULT '{}',
  certifications        TEXT[] NOT NULL DEFAULT '{}',
  trust_score           INT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  banner_image_url      TEXT,
  logo_initial          TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Back-reference from profiles to ngos
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_organization
  FOREIGN KEY (organization_id) REFERENCES ngos (id);

-- ============================================================
-- DONATIONS
-- ============================================================
-- No tracking_timeline column — timeline is derived (D7).
-- Denormalized donor fields (donorName etc.) are NOT stored here;
-- the API joins profiles when building the response.

CREATE TABLE donations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id              UUID NOT NULL REFERENCES profiles (id),
  title                 TEXT NOT NULL,
  category              donation_category NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  quantity              INT NOT NULL CHECK (quantity > 0),
  unit                  TEXT NOT NULL,
  estimated_value       NUMERIC(12,2),
  condition             item_condition NOT NULL,
  pickup_address        TEXT NOT NULL,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  pincode               TEXT NOT NULL,
  urgency               urgency_level NOT NULL,
  status                donation_status NOT NULL DEFAULT 'Submitted',
  matched_ngo_id        UUID REFERENCES ngos (id),
  target_requirement_id UUID,  -- FK added after requirements table
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DONATION IMAGES
-- ============================================================
-- Separate table so a donation can have multiple photos.
-- `kind` distinguishes upload-time photos from proof-of-distribution.

CREATE TABLE donation_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id   UUID NOT NULL REFERENCES donations (id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'listing'
                CHECK (kind IN ('listing', 'proof')),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REQUIREMENTS
-- ============================================================

CREATE TABLE requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id              UUID NOT NULL REFERENCES ngos (id),
  title               TEXT NOT NULL,
  category            donation_category NOT NULL,
  cause               cause_category NOT NULL,
  target_quantity     INT NOT NULL CHECK (target_quantity > 0),
  fulfilled_quantity  INT NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  unit                TEXT NOT NULL,
  urgency             urgency_level NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  beneficiary_group   TEXT NOT NULL DEFAULT '',
  needed_by_date      DATE,
  status              requirement_status NOT NULL DEFAULT 'Open',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add the FK from donations to requirements
ALTER TABLE donations
  ADD CONSTRAINT fk_donations_target_requirement
  FOREIGN KEY (target_requirement_id) REFERENCES requirements (id);

-- ============================================================
-- DONATION MATCHES (populated by matching engine, S6)
-- ============================================================

CREATE TABLE donation_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id     UUID NOT NULL REFERENCES donations (id),
  requirement_id  UUID NOT NULL REFERENCES requirements (id),
  score           NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  matched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (donation_id, requirement_id)
);

-- ============================================================
-- DONATION REQUESTS (NGO claims a donation)
-- ============================================================

CREATE TABLE donation_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id           UUID NOT NULL REFERENCES donations (id),
  ngo_id                UUID NOT NULL REFERENCES ngos (id),
  status                donation_request_status NOT NULL DEFAULT 'pending',
  proposed_pickup_date  DATE,
  notes                 TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PICKUPS
-- ============================================================

CREATE TABLE pickups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id     UUID NOT NULL REFERENCES donations (id),
  scheduled_date  TIMESTAMPTZ,
  picked_up_at    TIMESTAMPTZ,
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DISTRIBUTIONS
-- ============================================================

CREATE TABLE distributions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id             UUID NOT NULL REFERENCES donations (id),
  ngo_id                  UUID NOT NULL REFERENCES ngos (id),
  distribution_date       DATE NOT NULL,
  location                TEXT NOT NULL DEFAULT '',
  beneficiaries_reached   INT NOT NULL DEFAULT 0 CHECK (beneficiaries_reached >= 0),
  proof_image_url         TEXT,
  impact_report           TEXT NOT NULL DEFAULT '',
  notes_to_donor          TEXT NOT NULL DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles (id),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        notification_type NOT NULL DEFAULT 'info',
  read        BOOLEAN NOT NULL DEFAULT false,
  action_view TEXT,
  action_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
-- Generic event log. `entity_type` + `entity_id` point to any table.
-- `actor_id` is nullable for system-generated events.

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES profiles (id),
  entity_type   TEXT NOT NULL,  -- e.g. 'donation', 'ngo', 'requirement'
  entity_id     UUID NOT NULL,
  action        TEXT NOT NULL,  -- e.g. 'created', 'status_changed', 'verified'
  details       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Only the obvious ones for now; add more when query patterns emerge.

CREATE INDEX idx_donations_donor      ON donations (donor_id);
CREATE INDEX idx_donations_status     ON donations (status);
CREATE INDEX idx_donations_ngo        ON donations (matched_ngo_id);
CREATE INDEX idx_requirements_ngo     ON requirements (ngo_id);
CREATE INDEX idx_requirements_status  ON requirements (status);
CREATE INDEX idx_donation_requests_donation ON donation_requests (donation_id);
CREATE INDEX idx_notifications_user   ON notifications (user_id, read);
CREATE INDEX idx_audit_logs_entity    ON audit_logs (entity_type, entity_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
-- Automatically bump updated_at on UPDATE for tables that have it.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ngos_updated_at
  BEFORE UPDATE ON ngos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_donation_requests_updated_at
  BEFORE UPDATE ON donation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
