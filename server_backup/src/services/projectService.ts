/**
 * projectService.ts
 * Business logic for the Project module.
 * Controllers call these functions — no Express types here.
 */

import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { ApiError } from '../utils/ApiError';
import {
  CreateProjectBody,
  UpdateProjectBody,
  ProjectQueryParams,
  SafeProject,
  ProjectStatus,
} from '../types/project.types';

// ── Pagination result shape ───────────────────────────────────

export interface PaginatedProjects {
  projects:   SafeProject[];
  total:      number;
  page:       number;
  totalPages: number;
  limit:      number;
}

// ── Create ────────────────────────────────────────────────────

export async function createProject(
  ownerId: string,
  body: CreateProjectBody,
): Promise<SafeProject> {
  const project = new Project({
    owner:       new Types.ObjectId(ownerId),
    name:        body.name.trim(),
    description: body.description?.trim() ?? '',
    status:      body.status   ?? 'active',
    priority:    body.priority ?? 'medium',
    startDate:   body.startDate ? new Date(body.startDate) : null,
    dueDate:     body.dueDate   ? new Date(body.dueDate)   : null,
    members:     (body.members ?? []).map(id => new Types.ObjectId(id)),
    tags:        body.tags  ?? [],
    color:       body.color ?? '#6C63FF',
  });

  await project.save();
  return project.toSafeObject();
}

// ── List (with pagination, search, filter, sort) ─────────────

export async function listProjects(
  userId: string,
  query: ProjectQueryParams,
): Promise<PaginatedProjects> {
  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  // ── Build filter ─────────────────────────────────────────
  // Return projects the user owns or is a member of
  const ownerOrMember = {
    $or: [
      { owner: new Types.ObjectId(userId) },
      { members: new Types.ObjectId(userId) },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { ...ownerOrMember };

  if (query.status) {
    const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
    filter.status = { $in: statuses };
  }

  if (query.priority) {
    const priorities = query.priority.split(',').map(p => p.trim()).filter(Boolean);
    filter.priority = { $in: priorities };
  }

  if (query.search) {
    // Case-insensitive name search (regex — works without text index on Atlas free tier)
    filter.name = { $regex: query.search.trim(), $options: 'i' };
  }

  // ── Build sort ───────────────────────────────────────────
  // Default: newest first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortMap: Record<string, any> = {
    'createdAt':  { createdAt: 1  },
    '-createdAt': { createdAt: -1 },
    'name':       { name: 1      },
    '-name':      { name: -1     },
    'dueDate':    { dueDate: 1   },
    '-dueDate':   { dueDate: -1  },
    'priority':   { priority: 1  },
    '-priority':  { priority: -1 },
    'updatedAt':  { updatedAt: 1  },
    '-updatedAt': { updatedAt: -1 },
  };
  const sort = sortMap[query.sort ?? '-createdAt'] ?? { createdAt: -1 };

  const [projects, total] = await Promise.all([
    Project.find(filter).sort(sort).skip(skip).limit(limit).lean<IProject[]>(),
    Project.countDocuments(filter),
  ]);

  return {
    projects:   projects.map(p => leanToSafe(p)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}

// ── Get single ───────────────────────────────────────────────

export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<SafeProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  assertAccess(project, userId);
  return project.toSafeObject();
}

// ── Update ────────────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  userId: string,
  body: UpdateProjectBody,
): Promise<SafeProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  assertOwnerOrMember(project, userId);

  // Apply allowed updates
  if (body.name        !== undefined) project.name        = body.name.trim();
  if (body.description !== undefined) project.description = body.description.trim();
  if (body.status      !== undefined) project.status      = body.status;
  if (body.priority    !== undefined) project.priority    = body.priority;
  if (body.color       !== undefined) project.color       = body.color;
  if (body.tags        !== undefined) project.tags        = body.tags;
  if (body.startDate   !== undefined) {
    project.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if (body.dueDate !== undefined) {
    project.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.members !== undefined) {
    project.members = body.members.map(id => new Types.ObjectId(id));
  }

  await project.save();
  return project.toSafeObject();
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  // Only the owner can delete
  assertOwner(project, userId);

  await project.deleteOne();
}

// ── Archive ───────────────────────────────────────────────────

export async function archiveProject(
  projectId: string,
  userId: string,
): Promise<SafeProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  assertOwnerOrMember(project, userId);

  project.status = 'archived' as ProjectStatus;
  await project.save();
  return project.toSafeObject();
}

// ── Authorization helpers ─────────────────────────────────────

function assertAccess(project: IProject, userId: string): void {
  const oid = project.owner.toString();
  const isMember = project.members.some(m => m.toString() === userId);
  if (oid !== userId && !isMember) {
    throw ApiError.forbidden('You do not have access to this project.');
  }
}

function assertOwnerOrMember(project: IProject, userId: string): void {
  assertAccess(project, userId);
}

function assertOwner(project: IProject, userId: string): void {
  if (project.owner.toString() !== userId) {
    throw ApiError.forbidden('Only the project owner can perform this action.');
  }
}

// ── Lean document → SafeProject ──────────────────────────────

function leanToSafe(p: IProject): SafeProject {
  return {
    id:          (p._id as { toString(): string }).toString(),
    owner:       p.owner.toString(),
    name:        p.name,
    description: p.description,
    status:      p.status,
    priority:    p.priority,
    startDate:   p.startDate ? new Date(p.startDate).toISOString() : null,
    dueDate:     p.dueDate   ? new Date(p.dueDate).toISOString()   : null,
    members:     (p.members ?? []).map((m) => m.toString()),
    tags:        p.tags ?? [],
    color:       p.color,
    createdAt:   new Date(p.createdAt).toISOString(),
    updatedAt:   new Date(p.updatedAt).toISOString(),
  };
}
