-- =============================================================================
-- MedWeb / ArogyaAI Supabase Schema & Row Level Security (RLS) Policies
-- Enforces user-level data segregation and protects Protected Health Information (PHI).
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: vitals_logs
-- Stores user vital signs (Heart rate, Blood Pressure, Blood Sugar, Temperature).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vitals_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    heart_rate NUMERIC,
    sys_bp NUMERIC,
    dia_bp NUMERIC,
    blood_sugar NUMERIC,
    temp NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for user query performance
CREATE INDEX IF NOT EXISTS idx_vitals_logs_user_id ON public.vitals_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_vitals_logs_created_at ON public.vitals_logs (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.vitals_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vitals_logs
DROP POLICY IF EXISTS "Users can view own vitals logs" ON public.vitals_logs;
CREATE POLICY "Users can view own vitals logs"
    ON public.vitals_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vitals logs" ON public.vitals_logs;
CREATE POLICY "Users can insert own vitals logs"
    ON public.vitals_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vitals logs" ON public.vitals_logs;
CREATE POLICY "Users can update own vitals logs"
    ON public.vitals_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vitals logs" ON public.vitals_logs;
CREATE POLICY "Users can delete own vitals logs"
    ON public.vitals_logs FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================================
-- TABLE: symptom_logs
-- Stores user symptom tracking history and notes.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    symptom_name TEXT NOT NULL,
    severity NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_id ON public.symptom_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_created_at ON public.symptom_logs (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for symptom_logs
DROP POLICY IF EXISTS "Users can view own symptom logs" ON public.symptom_logs;
CREATE POLICY "Users can view own symptom logs"
    ON public.symptom_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own symptom logs" ON public.symptom_logs;
CREATE POLICY "Users can insert own symptom logs"
    ON public.symptom_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own symptom logs" ON public.symptom_logs;
CREATE POLICY "Users can update own symptom logs"
    ON public.symptom_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own symptom logs" ON public.symptom_logs;
CREATE POLICY "Users can delete own symptom logs"
    ON public.symptom_logs FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================================
-- TABLE: prescriptions
-- Stores scanned prescription summaries and extracted medicines.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extracted_medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'processed',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions (user_id);

-- Enable Row Level Security
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescriptions (PHI protection)
DROP POLICY IF EXISTS "Users can view own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can view own prescriptions"
    ON public.prescriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can insert own prescriptions"
    ON public.prescriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can update own prescriptions"
    ON public.prescriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can delete own prescriptions"
    ON public.prescriptions FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================================
-- TABLE: cart
-- Stores user cart items added via Multi-Agent Inventory workflow.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart (user_id);

-- Enable Row Level Security
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart;
CREATE POLICY "Users can view own cart items"
    ON public.cart FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart;
CREATE POLICY "Users can insert own cart items"
    ON public.cart FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart;
CREATE POLICY "Users can update own cart items"
    ON public.cart FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart;
CREATE POLICY "Users can delete own cart items"
    ON public.cart FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================================
-- PUBLIC READ-ONLY REFERENCE TABLES: medicines & doctors
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    generic TEXT,
    price TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Read-only policies for public catalog
DROP POLICY IF EXISTS "Public read-only access for medicines" ON public.medicines;
CREATE POLICY "Public read-only access for medicines"
    ON public.medicines FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public read-only access for doctors" ON public.doctors;
CREATE POLICY "Public read-only access for doctors"
    ON public.doctors FOR SELECT
    USING (true);

