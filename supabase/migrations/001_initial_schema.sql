-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Default Plate Config
  default_plate_width INTEGER NOT NULL DEFAULT 1820,
  default_plate_height INTEGER NOT NULL DEFAULT 910,
  default_plate_unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Default Cut Config
  default_cut_width DECIMAL(5,1) NOT NULL DEFAULT 4,
  default_margin INTEGER NOT NULL DEFAULT 20,

  -- Default Optimization Preferences
  default_optimization_goal VARCHAR(50) NOT NULL DEFAULT 'remaining-space',
  default_use_ga BOOLEAN NOT NULL DEFAULT false,
  default_use_grid_grouping BOOLEAN NOT NULL DEFAULT true,
  default_offcut_mode VARCHAR(50) NOT NULL DEFAULT 'consumption',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id)
);

-- RLS Policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- PRODUCT TEMPLATES TABLE
-- =============================================
CREATE TABLE product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Products stored as JSONB array of Item[]
  products JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_templates_name_user_unique UNIQUE(user_id, name)
);

-- RLS Policies for product_templates
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON product_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON product_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON product_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON product_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for product_templates
CREATE INDEX idx_product_templates_user_id ON product_templates(user_id);
CREATE INDEX idx_product_templates_created_at ON product_templates(created_at DESC);

-- =============================================
-- OFFCUT TEMPLATES TABLE
-- =============================================
CREATE TABLE offcut_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Offcuts stored as JSONB array of OffcutPlate[]
  offcuts JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT offcut_templates_name_user_unique UNIQUE(user_id, name)
);

-- RLS Policies for offcut_templates
ALTER TABLE offcut_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offcut templates"
  ON offcut_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offcut templates"
  ON offcut_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offcut templates"
  ON offcut_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offcut templates"
  ON offcut_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for offcut_templates
CREATE INDEX idx_offcut_templates_user_id ON offcut_templates(user_id);
CREATE INDEX idx_offcut_templates_created_at ON offcut_templates(created_at DESC);

-- =============================================
-- CALCULATION HISTORY TABLE
-- =============================================
CREATE TABLE calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Input Configuration
  plate_config JSONB NOT NULL,
  cut_config JSONB NOT NULL,
  products JSONB NOT NULL,
  offcuts JSONB,

  -- Optimization Settings
  optimization_goal VARCHAR(50) NOT NULL,
  use_ga BOOLEAN NOT NULL,
  use_grid_grouping BOOLEAN NOT NULL,
  offcut_mode VARCHAR(50),

  -- Calculation Result (full CalculationResult object)
  result JSONB NOT NULL,

  -- Metadata (denormalized for quick filtering)
  total_plates INTEGER NOT NULL,
  average_yield DECIMAL(5,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,

  -- Optional user-provided name/notes
  name VARCHAR(255),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for calculation_history
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON calculation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON calculation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON calculation_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON calculation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for calculation_history
CREATE INDEX idx_calculation_history_user_id ON calculation_history(user_id);
CREATE INDEX idx_calculation_history_created_at ON calculation_history(created_at DESC);
CREATE INDEX idx_calculation_history_total_plates ON calculation_history(total_plates);
CREATE INDEX idx_calculation_history_average_yield ON calculation_history(average_yield);

-- =============================================
-- AUTOMATIC CLEANUP TRIGGER FOR CALCULATION HISTORY
-- Keeps only the last 100 calculations per user
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_calculations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM calculation_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM calculation_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_calculations
AFTER INSERT ON calculation_history
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_calculations();

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_templates_updated_at
BEFORE UPDATE ON product_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offcut_templates_updated_at
BEFORE UPDATE ON offcut_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
