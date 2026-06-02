-- Add 'exec' to plan_tier enum and migrate 'pro' rows
ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'exec';
