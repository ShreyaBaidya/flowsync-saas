/**
 * task.types.ts
 * Shared TypeScript types for the Task module.
 */

export type TaskStatus   = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

// ── Request body shapes ──────────────────────────────────────

export interface CreateTaskBody {
  title:        string;
  description?: string;
  status?:      TaskStatus;
  priority?:    TaskPriority;
  assignee?:    string;   // User ID
  dueDate?:     string;   // ISO date string
  tags?:        string[];
  order?:       number;   // position within a column / list
}

export interface UpdateTaskBody extends Partial<CreateTaskBody> {}

// ── Query params for GET /projects/:projectId/tasks ──────────

export interface TaskQueryParams {
  page?:     string;
  limit?:    string;
  sort?:     string;     // e.g. '-createdAt', 'order', 'dueDate'
  search?:   string;     // search by title
  status?:   string;     // filter by status
  priority?: string;     // filter by priority
  assignee?: string;     // filter by assignee User ID
}

// ── Safe task shape returned to client ───────────────────────

export interface SafeTask {
  id:          string;
  project:     string;
  createdBy:   string;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignee:    string | null;
  dueDate:     string | null;
  tags:        string[];
  order:       number;
  createdAt:   string;
  updatedAt:   string;
}
