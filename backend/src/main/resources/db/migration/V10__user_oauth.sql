-- 소셜 로그인 사용자는 비밀번호가 없다.
ALTER TABLE app_user ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE app_user ADD COLUMN provider    TEXT NOT NULL DEFAULT 'local';
ALTER TABLE app_user ADD COLUMN provider_id TEXT;
