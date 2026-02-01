-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Create context sections table
CREATE TABLE IF NOT EXISTS project_context_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  extracted_text TEXT,
  files JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_context_sections_project_id ON project_context_sections(project_id);

-- Add columns to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS use_project_context BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);

-- Create default project for each user
INSERT INTO projects (user_id, name, description, is_default)
SELECT
  id,
  'Личные чаты',
  'Автоматически созданный проект для существующих чатов',
  TRUE
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = users.id AND p.is_default = TRUE
);

-- Assign existing chats to default projects
UPDATE chats
SET project_id = (
  SELECT p.id
  FROM projects p
  WHERE p.user_id = chats.user_id
  AND p.is_default = TRUE
)
WHERE project_id IS NULL;
