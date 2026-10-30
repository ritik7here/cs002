-- S1: Seed data matching mock-data counts
-- 3 users (profiles), 6 NGOs, 5 requirements, 5 donations,
-- 1 distribution, 4 notifications
--
-- Uses deterministic UUIDs so foreign keys are predictable.
-- Convention: uuid_generate_v5 would be ideal but for clarity
-- we use hardcoded UUIDs with a readable pattern.

-- ============================================================
-- NGOs (6)
-- ============================================================
-- Insert NGOs before profiles because profiles.organization_id references ngos.id

INSERT INTO ngos (id, name, slug, registration_number, tax_exempt_id, verification_status,
  description, mission_statement, contact_email, phone, address, city, state, website,
  founded_year, beneficiaries_count, active_campaigns_count, causes, certifications,
  trust_score, logo_initial) VALUES

('b0000000-0000-0000-0000-000000000001',
 'Aashraya Community Foundation', 'aashraya-community-foundation',
 'MH/2018/0094125', 'AACTA9821PF001', 'verified',
 'Providing daily wholesome meals, emergency shelter kits, and holistic care for destitute elderly and marginalized street communities.',
 'To ensure no vulnerable citizen sleeps on the street hungry or unsheltered through dignifying community partnerships.',
 'contact@aashrayatrust.org', '+91 98201 54321',
 'Plot 44, Chembur Social Welfare Complex', 'Mumbai', 'Maharashtra',
 'https://aashrayatrust.org', 2018,
 42800, 4,
 ARRAY['Hunger & Nutrition','Shelter & Clothing','Elderly Care']::cause_category[],
 ARRAY['80G Certified','FCRA Approved','ISO 9001:2015 Social Audited','GuideStar Gold Seal'],
 98, 'AC'),

('b0000000-0000-0000-0000-000000000002',
 'VidyaJyoti Rural Education Trust', 'vidyajyoti-rural-education',
 'RJ/2019/0129840', 'BBPTR4512RF002', 'verified',
 'Empowering first-generation learners in rural tribal pockets with STEM kits, refurbished digital tablets, and school supplies.',
 'Bridging the digital divide and igniting scientific curiosity in children from remote villages.',
 'connect@vidyajyoti.org', '+91 94140 88219',
 'Near Govt Senior Secondary School, Amer Block', 'Jaipur', 'Rajasthan',
 'https://vidyajyoti.org', 2019,
 16400, 3,
 ARRAY['Education & Youth','Women Empowerment']::cause_category[],
 ARRAY['80G Tax Exemption','12A Income Tax Registered','NITI Aayog Darpan Verified'],
 96, 'VJ'),

('b0000000-0000-0000-0000-000000000003',
 'Arogya Medical Relief Mission', 'arogya-medical-relief',
 'DL/2015/0073210', 'CCKMD7712DF003', 'verified',
 'Rapid response medical aid teams deploying primary diagnostic kits, essential medicines, and mobile triage units during crises.',
 'Equitable emergency healthcare delivery wherever natural disasters or poverty cut communities off from formal medical infrastructure.',
 'aid@arogyamission.org', '+91 98110 33421',
 'A-12 Institutional Area, Okhla Phase II', 'New Delhi', 'Delhi',
 'https://arogyamission.org', 2015,
 89000, 5,
 ARRAY['Healthcare & Medical','Disaster Relief']::cause_category[],
 ARRAY['FCRA Active','80G Registered','WHO Humanitarian Partner'],
 99, 'AM'),

('b0000000-0000-0000-0000-000000000004',
 'GreenRoot Agro & Habitat Initiative', 'greenroot-agro-habitat',
 'KA/2021/0088194', 'DDRTR9921KF004', 'verified',
 'Promoting community rainwater harvesting, tree canopies, and emergency relief provisions for agrarian workers during drought periods.',
 'Building climate-resilient rural habitats and protecting local ecosystems alongside marginal farming families.',
 'info@greenrootindia.org', '+91 80234 56789',
 'Kalyan Nagar Eco Hub, 4th Cross', 'Bengaluru', 'Karnataka',
 'https://greenrootindia.org', 2021,
 12500, 2,
 ARRAY['Environment & Animal Welfare','Disaster Relief']::cause_category[],
 ARRAY['12A/80G Compliant','UN Global Compact Signatory'],
 92, 'GR'),

('b0000000-0000-0000-0000-000000000005',
 'Prerna Women Dignity & Livelihood Center', 'prerna-women-livelihood',
 'WB/2024/0049218', 'EESTR3412LF005', 'pending',
 'Vocational tailoring, computer literacy, and micro-entrepreneurship training for single mothers and domestic abuse survivors.',
 'Creating self-sustaining economic pathways for women to break cycles of poverty and violence.',
 'director@prernafoundation.org', '+91 93301 98765',
 'Block C, Salt Lake Sector 1', 'Kolkata', 'West Bengal',
 'https://prernafoundation.org', 2024,
 3100, 2,
 ARRAY['Women Empowerment','Education & Youth']::cause_category[],
 ARRAY['Registration Submitted','Awaiting 80G Approval'],
 78, 'PW'),

('b0000000-0000-0000-0000-000000000006',
 'Karuna Animal Rescue & Rehabilitation Sanctuary', 'karuna-animal-sanctuary',
 'MH/2020/0034112', 'FFATR8821ZF006', 'verified',
 'Providing trauma veterinary care, rescue ambulances, and lifelong sanctuary for injured stray dogs, working equines, and abandoned cattle.',
 'Alleviating the silent suffering of community animals through compassionate veterinary care and adoption advocacy.',
 'rescue@karuna-sanctuary.org', '+91 97654 32109',
 'Survey 88, Old Pune-Satara Road', 'Pune', 'Maharashtra',
 'https://karuna-sanctuary.org', 2020,
 9400, 1,
 ARRAY['Environment & Animal Welfare']::cause_category[],
 ARRAY['Animal Welfare Board of India Recognized','80G Tax Exemption'],
 94, 'KA');

-- ============================================================
-- PROFILES (3 + 2 referenced donors)
-- ============================================================
-- In production these rows are created after Supabase Auth sign-up.
-- For seeding we insert directly. S2 will link to auth.users.

INSERT INTO profiles (id, name, email, role, phone, location, organization_id, status, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Sophia Chen',   'sophia.chen@example.org',        'donor', '+1 (555) 438-9021',  'San Francisco, CA & Mumbai Hub',  NULL, 'active', '2026-01-12T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'Dr. Aarav Patel','aarav@aashrayatrust.org',        'ngo',   '+91 98201 54321',    'Mumbai, Maharashtra',             'b0000000-0000-0000-0000-000000000001', 'active', '2025-11-04T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'Elena Vance',   'admin.elena@kindredbridge.org',  'admin', '+1 (555) 890-1122',  'Global Platform Operations',      NULL, 'active', '2025-08-01T00:00:00Z');

-- Two extra donor profiles referenced by mock donations (don-104, don-105)
-- that don't appear in INITIAL_USERS. We create them so FKs resolve.
INSERT INTO profiles (id, name, email, role, phone, location, status, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'Rahul Mehrotra',  'rahul.m@corporatepartners.com', 'donor', NULL, 'New Delhi, Delhi',       'active', '2026-09-01T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005', 'Ananya Sharma',   'ananya.sharma@designlab.io',    'donor', NULL, 'Bengaluru, Karnataka',   'active', '2026-09-01T00:00:00Z');

-- ============================================================
-- REQUIREMENTS (5)
-- ============================================================

INSERT INTO requirements (id, ngo_id, title, category, cause,
  target_quantity, fulfilled_quantity, unit, urgency, description,
  beneficiary_group, needed_by_date, status, created_at) VALUES

('c0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'Emergency Dry Ration & Pulse Kits for Slum Fire Victims',
 'Food & Groceries', 'Hunger & Nutrition',
 300, 210, 'Family Care Kits (15kg each)', 'Critical / Emergency',
 'Urgent dry provisions (Rice, Atta, Toor Dal, Mustard Oil, Salt & Haldi) for 300 displaced migrant families following the Kurla tenement blaze.',
 '300 displaced families in informal settlement',
 '2026-10-05', 'Partially Fulfilled', '2026-09-20T00:00:00Z'),

('c0000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000002',
 'Refurbished Laptops & Tablets for Girls'' Digital Lab',
 'Electronics & Devices', 'Education & Youth',
 25, 14, 'Working Laptops / Tablets', 'High',
 'We require working laptops (i3/4GB RAM or equivalent) to run python coding and basic digital literacy workshops for rural secondary school girls.',
 '120 rural girls across 4 villages',
 '2026-10-15', 'Partially Fulfilled', '2026-09-18T00:00:00Z'),

('c0000000-0000-0000-0000-000000000003',
 'b0000000-0000-0000-0000-000000000003',
 'Sterile Wound Dressing Packs & Antiseptics',
 'Medical Supplies', 'Healthcare & Medical',
 150, 45, 'Medical Aid Boxes', 'High',
 'Supplies required for our weekend mobile medical camps serving construction labor camps on Delhi periphery.',
 '1,400 daily wage laborers & their families',
 '2026-10-10', 'Partially Fulfilled', '2026-09-22T00:00:00Z'),

('c0000000-0000-0000-0000-000000000004',
 'b0000000-0000-0000-0000-000000000001',
 'Warm Fleece Blankets & Thermal Inners for Night Shelters',
 'Clothing & Blankets', 'Shelter & Clothing',
 500, 500, 'Blanket Sets', 'Medium',
 'Pre-winter drive to stock municipal night shelters before temperatures drop in northern transit zones.',
 'Homeless senior citizens in municipal transit shelters',
 '2026-10-30', 'Fulfilled', '2026-09-01T00:00:00Z'),

('c0000000-0000-0000-0000-000000000005',
 'b0000000-0000-0000-0000-000000000002',
 'Elementary School Backpacks, Notebooks & Geometry Sets',
 'Educational Material', 'Education & Youth',
 200, 80, 'Complete Student Packs', 'Medium',
 'Backpack kits containing 4 ruled notebooks, drawing book, stationery kit, and stainless steel water bottle.',
 'Primary grade tribal children',
 '2026-10-25', 'Open', '2026-09-24T00:00:00Z');

-- ============================================================
-- DONATIONS (5)
-- ============================================================

INSERT INTO donations (id, donor_id, title, category, description,
  quantity, unit, estimated_value, condition, pickup_address, city,
  state, pincode, urgency, status, matched_ngo_id,
  target_requirement_id, created_at, updated_at) VALUES

('d0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 'Nutritious High-Protein Grain & Pulse Food Parcels (80 Kits)',
 'Food & Groceries',
 '80 sealed family grain kits with whole wheat flour, basmati rice, lentils, iodine salt, and refined sunflower oil.',
 80, 'Family Care Kits', 1200.00, 'Brand New',
 'Tower 4, Seaface Residency, Worli', 'Mumbai', 'Maharashtra', '400018',
 'Critical / Emergency', 'Distributed',
 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000001',
 '2026-09-21T09:30:00Z', '2026-09-24T16:00:00Z'),

('d0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001',
 '12 Lenovo ThinkPad Laptops (Core i5, 8GB RAM, SSD)',
 'Electronics & Devices',
 'Corporate decommissioned laptops, wiped clean, restored with fresh Linux Ubuntu and educational coding environments.',
 12, 'Laptops with Chargers & Mice', 3600.00, 'Used - Good Condition',
 'Tower 4, Seaface Residency, Worli', 'Mumbai', 'Maharashtra', '400018',
 'High', 'Received by NGO',
 'b0000000-0000-0000-0000-000000000002',
 'c0000000-0000-0000-0000-000000000002',
 '2026-09-22T14:15:00Z', '2026-09-25T11:20:00Z'),

('d0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000001',
 '40 Comprehensive First Aid & Burn Dressing Packs',
 'Medical Supplies',
 'Hospital grade sterile dressings, povidone-iodine solution, micropore tapes, shears, and burn soothing hydrogels.',
 40, 'Medical Emergency Boxes', 650.00, 'Brand New',
 'Tower 4, Seaface Residency, Worli', 'Mumbai', 'Maharashtra', '400018',
 'High', 'Pickup Scheduled',
 'b0000000-0000-0000-0000-000000000003',
 'c0000000-0000-0000-0000-000000000003',
 '2026-09-24T08:00:00Z', '2026-09-25T16:30:00Z'),

('d0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000004',
 '150 Heavyweight Woolen Blankets (Queen Size)',
 'Clothing & Blankets',
 'Thick, warm acrylic wool blend blankets individually packed in zipper covers, ideal for night shelter use.',
 150, 'Blankets', 900.00, 'Brand New',
 'Sector 54, Golf Course Road', 'New Delhi', 'Delhi', '122002',
 'Medium', 'Matched',
 'b0000000-0000-0000-0000-000000000001',
 NULL,
 '2026-09-25T10:00:00Z', '2026-09-25T18:00:00Z'),

('d0000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000005',
 '50 Complete Art & Stationery Learning Kits',
 'Educational Material',
 'Drawing pads, watercolor sets, oil pastels, sketch pens, and craft scissors for creative expression workshops.',
 50, 'Art Gift Boxes', 400.00, 'Brand New',
 'Indiranagar 100ft Road', 'Bengaluru', 'Karnataka', '560038',
 'Medium', 'Submitted',
 NULL, NULL,
 '2026-09-25T16:00:00Z', '2026-09-25T16:00:00Z');

-- ============================================================
-- DONATION IMAGES (proof photos for don-101, don-102)
-- ============================================================

INSERT INTO donation_images (donation_id, image_url, kind) VALUES
  ('d0000000-0000-0000-0000-000000000001', '/assets/images/community_food_aid_1790438468596.jpg', 'proof'),
  ('d0000000-0000-0000-0000-000000000002', '/assets/images/education_aid_kit_1790438483785.jpg',  'proof');

-- ============================================================
-- DISTRIBUTIONS (1)
-- ============================================================

INSERT INTO distributions (id, donation_id, ngo_id, distribution_date,
  location, beneficiaries_reached, proof_image_url, impact_report,
  notes_to_donor) VALUES

('e0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 '2026-09-24',
 'Kurla West Relief Camp, Mumbai',
 320,
 '/assets/images/community_food_aid_1790438468596.jpg',
 'Delivered directly to 80 families whose homes were damaged in the electrical fire. The kits sustain each family for approximately 2 weeks with basic staple nourishment.',
 'Dearest Sophia, words cannot express our gratitude. Your timely pledge arrived within 48 hours of the incident, giving these families hope and food security while emergency shelters are erected. God bless you!');

-- ============================================================
-- NOTIFICATIONS (4)
-- ============================================================

INSERT INTO notifications (id, user_id, title, message, type, read,
  action_view, action_id, created_at) VALUES

('f0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 'Impact Report Ready!',
 'Aashraya Foundation completed the distribution of your 80 Grain Care Kits to 320 beneficiaries in Kurla. View photos and notes.',
 'success', false,
 'donor-tracking', 'd0000000-0000-0000-0000-000000000001',
 '2026-09-25T14:00:00Z'),

('f0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001',
 'Pickup Confirmed',
 'Arogya Medical Mission confirmed pickup for your 40 Medical Aid Kits tomorrow at 11:00 AM.',
 'info', false,
 'donor-donation-details', 'd0000000-0000-0000-0000-000000000003',
 '2026-09-25T11:00:00Z'),

('f0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000002',
 'New Donation Match Found',
 'Donor Rahul Mehrotra pledged 150 heavyweight blankets that align with your winter shelter requirements.',
 'info', true,
 'ngo-available-donations', 'd0000000-0000-0000-0000-000000000004',
 '2026-09-24T12:00:00Z'),

('f0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000003',
 'Pending NGO Verification',
 'Prerna Women Dignity Center uploaded 80G tax registration and incorporation documents for compliance review.',
 'warning', false,
 'admin-ngo-verification', 'b0000000-0000-0000-0000-000000000005',
 '2026-09-25T13:00:00Z');
