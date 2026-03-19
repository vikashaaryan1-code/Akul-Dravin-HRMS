-- Fix company_id column to allow NULL or set default
ALTER TABLE employees ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN company_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
