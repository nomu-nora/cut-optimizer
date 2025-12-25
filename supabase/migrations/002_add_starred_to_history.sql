-- Add is_starred column to calculation_history
ALTER TABLE calculation_history
ADD COLUMN is_starred BOOLEAN DEFAULT false NOT NULL;

-- Create index for filtering starred items
CREATE INDEX idx_calculation_history_starred ON calculation_history(user_id, is_starred, created_at DESC);
