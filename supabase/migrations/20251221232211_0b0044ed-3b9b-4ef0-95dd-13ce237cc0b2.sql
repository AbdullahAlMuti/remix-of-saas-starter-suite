-- Delete all duplicate user_plans, keeping only the most recent one per user
DELETE FROM user_plans
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_plans
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id to prevent future duplicates
ALTER TABLE user_plans ADD CONSTRAINT user_plans_user_id_unique UNIQUE (user_id);