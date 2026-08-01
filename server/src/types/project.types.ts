/**
 * project.types.ts
 * Shared TypeScript types for the Project module.
 */

export type ProjectStatus   = 'active' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high';

// ── Request body shapes ──────────────────────────────────────

export interface CreateProjectBody {
  name:         string;
  description?: string;
  status?:      ProjectStatus;
  priority?:    ProjectPriority;
  startDate?:   string;   // ISO date string
  dueDate?:     string;   // ISO date string
  members?:     string[]; // User IDs
  tags?:        string[];
  color?:       string;
}

export interface UpdateProjectBody extends Partial<CreateProjectBody> {}

// ── Query params for GET /projects ──────────────────────────

export interface ProjectQueryParams {
  page?:     string;
  limit?:    string;
  sort?:     string;   // e.g. '-createdAt', 'name', '-dueDate'
  search?:   string;   // search by name
  status?:   string;   // filter by status
  priority?: string;   // filter by priority
}

// ── Safe project shape returned to client ────────────────────

export interface SafeProject {
  id:           string;
  owner:        string;
  name:         string;
  description:  string;
  status:       ProjectStatus;
  priority:     ProjectPriority;
  startDate:    string | null;
  dueDate:      string | null;
  members:      string[];
  tags:         string[];
  color:        string;
  createdAt:    string;
  updatedAt:    string;
}
