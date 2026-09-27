-- 0008_member_plan.sql — access plan per member.
-- none = must subscribe · frontier = free forever (early community) · active = paid
ALTER TABLE members ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'none';
