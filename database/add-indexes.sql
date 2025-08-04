-- Database indexes for improved query performance on transformed_service_data table
-- Run these commands in your Supabase SQL editor

-- Index on service_date for date range filtering (most common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_service_date 
ON transformed_service_data (service_date DESC);

-- Index on technician for technician filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_technician 
ON transformed_service_data (technician);

-- Index on make for vehicle make filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_make 
ON transformed_service_data (make);

-- Index on year for vehicle year filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_year 
ON transformed_service_data (year);

-- Index on complaint for complaint type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_complaint 
ON transformed_service_data (complaint);

-- Index on estimated_loss for minimum loss filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_estimated_loss 
ON transformed_service_data (estimated_loss) WHERE estimated_loss > 0;

-- Index on suspected_misdiagnosis for problem type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_misdiagnosis 
ON transformed_service_data (suspected_misdiagnosis) WHERE suspected_misdiagnosis = 1;

-- Index on efficiency_deviation for efficiency problem filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_efficiency 
ON transformed_service_data (efficiency_deviation) WHERE efficiency_deviation > 0.2;

-- Composite index for common filter combinations (date + technician)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_date_technician 
ON transformed_service_data (service_date DESC, technician);

-- Composite index for date + make filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_date_make 
ON transformed_service_data (service_date DESC, make);

-- Index for repeat jobs analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_repeat_45d 
ON transformed_service_data (repeat_45d) WHERE repeat_45d = 1;

-- Index for financial calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_invoice_total 
ON transformed_service_data (invoice_total) WHERE invoice_total > 0;

-- Index for labor hours analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformed_service_data_labor_hours 
ON transformed_service_data (labor_hours_billed) WHERE labor_hours_billed > 0;

-- Analyze the table to update statistics after creating indexes
ANALYZE transformed_service_data;

-- Check index usage (run this after some time to verify indexes are being used)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'transformed_service_data' 
-- ORDER BY idx_tup_read DESC;