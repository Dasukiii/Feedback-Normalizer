/*
  # Drop Unused Tables

  ## Changes
  Removes tables that are not needed for the Feedback Normalizer application:
  - uploads
  - stories
  - interventions

  ## Notes
  - Uses CASCADE to automatically drop dependent objects
  - Tables will be dropped only if they exist
*/

-- Drop tables if they exist
DROP TABLE IF EXISTS interventions CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;