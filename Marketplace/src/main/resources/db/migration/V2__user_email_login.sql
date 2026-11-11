-- Users can log in with phone OR email (staff accounts are usually email-only).
ALTER TABLE users ADD COLUMN email VARCHAR(255);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email));
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL);
