/*
  # Add Status and Implementation Time to Interventions

  1. Changes
    - Add `status` column to track intervention progress (suggested, planned, implemented, archived)
    - Add `implementation_time` column to store estimated timeline for implementation
  
  2. Details
    - `status` defaults to 'suggested' for new interventions
    - `implementation_time` is optional text field for timeline descriptions
    - Uses IF NOT EXISTS pattern to safely add columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interventions' AND column_name = 'status'
  ) THEN
    ALTER TABLE interventions ADD COLUMN status text DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'planned', 'implemented', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interventions' AND column_name = 'implementation_time'
  ) THEN
    ALTER TABLE interventions ADD COLUMN implementation_time text;
  END IF;
END $$;
