import { Types } from 'mongoose';
import { Task, ITask, SafeTask } from '../models/Task';
import { Project, IProject } from '../models/Project';
import { ApiError } from '../utils/ApiError';

// ── Input shapes ──────────────────────────────────────────────

export interface CreateTaskInput {
  title:        string;
  description?: string;
  status?:      string;
  priority?:    string;
  assignee?:    string | null;
  dueDate?:     string | null;
  tags?:        string[];
  order?:       number;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskListResult {
  tasks:      SafeTask[];
  total:      number;
  page:       number;
  totalPages: number;
}

export interface TaskQuery {
  page?:     string;
  limit?:    string;
  status?:   string;
  priority?: string;
  search?:   string;
  assignee?: string;
}

// ── Access guard ──────────────────────────────────────────────

async function assertProjectAccess(
  projectId: string,
  userId: string,
): Promise<IProject> {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  const isOwner  = project.owner.toString() === userId;
  const isMember = project.members.some((m) => m.toString() === userId);

  if (!isOwner && !isMember) {
    throw ApiError.forbidden('You do not have access to this project');
  }

  return project;
}

// ── Service functions ─────────────────────────────────────────

export async function createTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  // Place new task at end by default
  let order = input.order ?? 0;
  if (input.order === undefined) {
    const last = await Task.findOne({ project: new Types.ObjectId(projectId) })
      .sort({ order: -1 })
      .lean<ITask>();
    order = last ? last.order + 1 : 0;
  }

  const task = await Task.create({
    project:     new Types.ObjectId(projectId),
    createdBy:   new Types.ObjectId(userId),
    title:       input.title.trim(),
    description: input.description?.trim() ?? '',
    status:      input.status   ?? 'todo',
    priority:    input.priority ?? 'medium',
    assignee:    input.assignee ? new Types.ObjectId(input.assignee) : null,
    dueDate:     input.dueDate  ? new Date(input.dueDate) : null,
    tags:        input.tags ?? [],
    order,
  });

  return task.toSafeObject();
}

export async function listTasks(
  projectId: string,
  userId: string,
  query: TaskQuery,
): Promise<TaskListResult> {
  await assertProjectAccess(projectId, userId);

  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    project: new Types.ObjectId(projectId),
  };

  if (query.status)   filter['status']   = query.status;
  if (query.priority) filter['priority'] = query.priority;
  if (query.assignee) filter['assignee'] = new Types.ObjectId(query.assignee);
  if (query.search)   filter['title']    = { $regex: query.search.trim(), $options: 'i' };

  const [docs, total] = await Promise.all([
    Task.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    tasks:      docs.map((t) => t.toSafeObject()),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTask(
  projectId: string,
  taskId: string,
  userId: string,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found');
  return task.toSafeObject();
}

export async function updateTask(
  projectId: string,
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<SafeTask> {
  await assertProjectAccess(projectId, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found');

  if (input.title       !== undefined) task.title       = input.title.trim();
  if (input.description !== undefined) task.description = input.description.trim();
  if (input.status      !== undefined) task.status      = input.status as ITask['status'];
  if (input.priority    !== undefined) task.priority    = input.priority as ITask['priority'];
  if (input.tags        !== undefined) task.tags        = input.tags;
  if (input.order       !== undefined) task.order       = input.order;
  if (input.assignee !== undefined) {
    task.assignee = input.assignee ? new Types.ObjectId(input.assignee) : null;
  }
  if (input.dueDate !== undefined) {
    task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  await task.save();
  return task.toSafeObject();
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  userId: string,
): Promise<void> {
  const project = await assertProjectAccess(projectId, userId);

  const task = await Task.findOne({
    _id:     new Types.ObjectId(taskId),
    project: new Types.ObjectId(projectId),
  });

  if (!task) throw ApiError.notFound('Task not found');

  // Only task creator or project owner may delete
  const isOwner   = project.owner.toString() === userId;
  const isCreator = task.createdBy.toString() === userId;

  if (!isOwner && !isCreator) {
    throw ApiError.forbidden('Only the task creator or project owner can delete this task');
  }

  await task.deleteOne();
}
