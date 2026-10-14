-- 0028_activity_video_key.sql
-- Kendi barındırılan video (Akademi/seminer). S3 key; oynatma linki yalnızca kilidi
-- açık (paralı) üyeye kısa ömürlü presigned GET olarak verilir. youtube_id alternatifidir.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_key text;
