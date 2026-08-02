/**
 * taskService.ts
 * Business logic for the Task module.
 * Controllers call these functions — no Express types here.
 *
 * Access control:
 *  - Tasks are scoped to a project.
 *  - Any project owner or project member may create, read, and update tasks.
 *  - Only the task creator or the project owner may delete a task.
 */

import { Types } from 'mongoose';
import { Task, ITask } from '../models/Task';
import { Project } from '../models/Project';
import { ApiError } from '../utils/ApiError';
import {
  CreateTaskBody,
  UpdateTaskBody,
  TaskQueryParams,
  SafeTask,
} from '../types/task.types';

// ── Pagination result shape ───────────────────────────────────

export interface PaginatedTasks {
  tasks:      SafeTask[];
  total:      number;
  page:       number;
  totalPages: number;
  limit:      number;
}

// ── Create ────────────────────────────────────────────────────

export async function createTask(
  projectId: string,
  userId: string,
  body: CreateTaskBody,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  // Place new task at the end of the list by default
  let order = body.order ?? 0;
  if (body.order === undefined) {
    const last = await Task.findOne({ project: new Types.ObjectId(projectId) })
      .sort({ order: -1 })
      .lean<ITask>();
    order = last ? last.order + 1 : 0;
  }

  const task = new Task({
    project:     new Types.ObjectId(projectId),
    createdBy:   new Types.ObjectId(userId),
    title:       body.title.trim(),
    description: body.description?.trim() ?? '',
    status:      body.status   ?? 'todo',
    priority:    body.priority ?? 'medium',
    assignee:    body.assignee ? new Types.ObjectId(body.assignee) : null,
    dueDate:     body.dueDate  ? new Date(body.dueDate) : null,
    tags:        body.tags ?? [],
    order,
  });

  await task.save();
  return task.toSafeObject();
}

// ── List (with pagination, search, filter, sort) ─────────────

export async function listTasks(
  projectId: string,
  userId: string,
  query: TaskQueryParams,
): Promise<PaginatedTasks> {
  await assertProjectAccess(projectId, userId);

  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  // ── Build filter ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    project: new Types.ObjectId(projectId),
  };

  if (query.status) {
    const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
    filter.status = { $in: statuses };
  }

  if (query.priority) {
    const priorities = query.priority.split(',').map(p => p.trim()).filter(Boolean);
    filter.priority = { $in: priorities };
  }

  if (query.assignee) {
    filter.assignee = new Types.ObjectId(query.assignee);
  }

  if (query.search) {
    // Case-insensitive title search (regex — consistent with projectService)
    filter.title = { $regex: query.search.trim(), $options: 'i' };
  }

  // ── Build sort ───────────────────────────────────────────
  // Default: manual order ascending
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortMap: Record<string, any> = {
    'order':      { order: 1      },
    '-order':     { order: -1     },
    'createdAt':  { createdAt: 1  },
    '-createdAt': { createdAt: -1 },
    'updatedAt':  { updatedAt: 1  },
    '-updatedAt': { updatedAt: -1 },
    'dueDate':    { dueDate: 1    },
    '-dueDate':   { dueDate: -1   },
    'priority':   { priority: 1   },
    '-priority':  { priority: -1  },
    'title':      { title: 1      },
    '-title':     { title: -1     },
  };
  const sort = sortMap[query.sort ?? 'order'] ?? { order: 1 };

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(limit).lean<ITask[]>(),
    Task.countDocuments(filter),
  ]);

  return {
    tasks:      tasks.map(t => leanToSafe(t)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}

// ── Get single ───────────────────────────────────────────────

export async function getTaskById(
  projectId: string,
  taskId: string,
  userId: string,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found.');
  return task.toSafeObject();
}

// ── Update ────────────────────────────────────────────────────

export async function updateTask(
  projectId: string,
  taskId: string,
  userId: string,
  body: UpdateTaskBody,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found.');

  // Any project member may update tasks
  if (body.title       !== undefined) task.title       = body.title.trim();
  if (body.description !== undefined) task.description = body.description.trim();
  if (body.status      !== undefined) task.status      = body.status;
  if (body.priority    !== undefined) task.priority    = body.priority;
  if (body.tags        !== undefined) task.tags        = body.tags;
  if (body.order       !== undefined) task.order       = body.order;
  if (body.assignee !== undefined) {
    task.assignee = body.assignee ? new Types.ObjectId(body.assignee) : null;
  }
  if (body.dueDate !== undefined) {
    task.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  await task.save();
  return task.toSafeObject();
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteTask(
  projectId: string,
  taskId: string,
  userId: string,
): Promise<void> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  assertMemberOrOwner(project, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found.');

  // Only the task creator or the project owner may delete
  const isProjectOwner  = project.owner.toString() === userId;
  const isTaskCreator   = task.createdBy.toString() === userId;

  if (!isProjectOwner && !isTaskCreator) {
    throw ApiError.forbidden(
      'Only the task creator or project owner can delete this task.',
    );
  }

  await task.deleteOne();
}

// ── Authorization helpers ─────────────────────────────────────

/**
 * Verify the project exists and the user is the owner or a member.
 * Returns the project document for callers that need it.
 */
async function assertProjectAccess(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found.');
  assertMemberOrOwner(project, userId);
  return project;
}

import { IProject } from '../models/Project';

function assertMemberOrOwner(project: IProject, userId: string): void {
  const isOwner  = project.owner.toString() === userId;
  const isMember = project.members.some(m => m.toString() === userId);
  if (!isOwner && !isMember) {
    throw ApiError.forbidden('You do not have access to this project.');
  }
}

// ── Lean document → SafeTask ──────────────────────────────────

function leanToSafe(t: ITask): SafeTask {
  return {
    id:          (t._id as { toString(): string }).toString(),
    project:     t.project.toString(),
    createdBy:   t.createdBy.toString(),
    title:       t.title,
    description: t.description,
    status:      t.status,
    priority:    t.priority,
    assignee:    t.assignee ? t.assignee.toString() : null,
    dueDate:     t.dueDate  ? new Date(t.dueDate).toISOString()  : null,
    tags:        t.tags ?? [],
    order:       t.order,
    createdAt:   new Date(t.createdAt).toISOString(),
    updatedAt:   new Date(t.updatedAt).toISOString(),
  };
}
