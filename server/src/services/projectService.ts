import { Types } from 'mongoose';
import { Project, IProject, SafeProject } from '../models/Project';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';

// ── Input shapes ──────────────────────────────────────────────

export interface CreateProjectInput {
  name:        string;
  description?: string;
  status?:     string;
  priority?:   string;
  dueDate?:    string | null;
  members?:    string[];
  tags?:       string[];
  color?:      string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface ProjectListResult {
  projects:   SafeProject[];
  total:      number;
  page:       number;
  totalPages: number;
}

export interface ProjectQuery {
  page?:   string;
  limit?:  string;
  status?: string;
  search?: string;
}

// ── Access guard ──────────────────────────────────────────────

function assertAccess(project: IProject, userId: string): void {
  const isOwner  = project.owner.toString() === userId;
  const isMember = project.members.some((m) => m.toString() === userId);
  if (!isOwner && !isMember) {
    throw ApiError.forbidden('You do not have access to this project');
  }
}

function assertOwner(project: IProject, userId: string): void {
  if (project.owner.toString() !== userId) {
    throw ApiError.forbidden('Only the project owner can perform this action');
  }
}

// ── Service functions ─────────────────────────────────────────

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<SafeProject> {
  const project = await Project.create({
    owner:       new Types.ObjectId(ownerId),
    name:        input.name.trim(),
    description: input.description?.trim() ?? '',
    status:      input.status   ?? 'active',
    priority:    input.priority ?? 'medium',
    dueDate:     input.dueDate  ? new Date(input.dueDate) : null,
    members:     (input.members ?? []).map((id) => new Types.ObjectId(id)),
    tags:        input.tags  ?? [],
    color:       input.color ?? '#6C63FF',
  });

  return project.toSafeObject();
}

export async function listProjects(
  userId: string,
  query: ProjectQuery,
): Promise<ProjectListResult> {
  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    $or: [
      { owner:   new Types.ObjectId(userId) },
      { members: new Types.ObjectId(userId) },
    ],
  };

  if (query.status) {
    filter['status'] = query.status;
  }

  if (query.search) {
    filter['name'] = { $regex: query.search.trim(), $options: 'i' };
  }

  const [docs, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  return {
    projects:   docs.map((p) => p.toSafeObject()),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProject(
  projectId: string,
  userId: string,
): Promise<SafeProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  assertAccess(project, userId);
  return project.toSafeObject();
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<SafeProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  assertAccess(project, userId);

  if (input.name        !== undefined) project.name        = input.name.trim();
  if (input.description !== undefined) project.description = input.description.trim();
  if (input.status      !== undefined) project.status      = input.status as IProject['status'];
  if (input.priority    !== undefined) project.priority    = input.priority as IProject['priority'];
  if (input.color       !== undefined) project.color       = input.color;
  if (input.tags        !== undefined) project.tags        = input.tags;
  if (input.dueDate     !== undefined) {
    project.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.members !== undefined) {
    project.members = input.members.map((id) => new Types.ObjectId(id));
  }

  await project.save();
  return project.toSafeObject();
}

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  assertOwner(project, userId);

  // Delete all tasks that belong to this project
  await Task.deleteMany({ project: new Types.ObjectId(projectId) });
  await project.deleteOne();
}
