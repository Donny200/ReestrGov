DO $migration$
BEGIN
    IF to_regclass('public.users') IS NOT NULL THEN
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS token_version BIGINT NOT NULL DEFAULT 0;
    END IF;
END;
$migration$;
