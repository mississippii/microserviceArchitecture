-- Categories can belong to one parent group (two levels only: group -> category).
ALTER TABLE categories ADD COLUMN parent_id BIGINT REFERENCES categories (id);
ALTER TABLE categories ADD CONSTRAINT categories_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id);
