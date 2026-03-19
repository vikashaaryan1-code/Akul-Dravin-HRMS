-- Drop the problematic foreign key constraint
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS "FK_2be2f615d3c20d620c6485d5463";

-- Delete orphaned attendance records that reference non-existent employees
DELETE FROM attendance 
WHERE employee_id NOT IN (SELECT id FROM employees_legacy);

-- Optionally: Drop employees_legacy table if not needed
-- DROP TABLE IF EXISTS employees_legacy CASCADE;
