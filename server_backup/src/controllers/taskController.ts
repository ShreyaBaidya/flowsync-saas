/**
 * taskController.ts
 * HTTP layer for the Task module.
 * Validates inputs, calls taskService, sends standardised responses.
 *
 * Routes handled:
 *   POST   /api/v1/projects/:projectId/tasks          — create task
 *   GET    /api/v1/projects/:projectId/tasks          — list tasks (paginated/filtered/sorted)
 *   GET    /api/v1/projects/:projectId/tasks/:id      — get single task
 *   PUT    /api/v1/projects/:projectId/tasks/:id      — update task
 *   DELETE /api/v1/projects/:projectId/tasks/:id      — delete task
 */

import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { CreateTaskBody, UpdateTaskBody, TaskQueryParams } from '../types/task.types';

// ── POST /projects/:projectId/tasks ───────────────────────────

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const body = req.body as CreateTaskBody;

    if (!body.title?.trim()) {
      throw ApiError.badRequest('Task title is required.');
    }

    const task = await taskService.createTask(
      req.params['projectId'],
      req.user.sub,
      body,
    );

    ApiResponse.created(res, { task }, 'Task created successfully.');
  } catch (err) {
    next(err);
  }
}

// ── GET /projects/:projectId/tasks ────────────────────────────

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const query = req.query as TaskQueryParams;
    const result = await taskService.listTasks(
      req.params['projectId'],
      req.user.sub,
      query,
    );

    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
}

// ── GET /projects/:projectId/tasks/:id ────────────────────────

export async function getTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const task = await taskService.getTaskById(
      req.params['projectId'],
      req.params['id'],
      req.user.sub,
    );

    ApiResponse.success(res, { task });
  } catch (err) {
    next(err);
  }
}

// ── PUT /projects/:projectId/tasks/:id ────────────────────────

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const body = req.body as UpdateTaskBody;
    const task = await taskService.updateTask(
      req.params['projectId'],
      req.params['id'],
      req.user.sub,
      body,
    );

    ApiResponse.success(res, { task }, 'Task updated successfully.');
  } catch (err) {
    next(err);
  }
}

// ── DELETE /projects/:projectId/tasks/:id ─────────────────────

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await taskService.deleteTask(
      req.params['projectId'],
      req.params['id'],
      req.user.sub,
    );

    ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}
