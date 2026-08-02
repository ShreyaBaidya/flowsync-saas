import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export async function createTask(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const task = await taskService.createTask(
      req.params['projectId'] as string,
      req.user.id,
      req.body as taskService.CreateTaskInput,
    );

    ApiResponse.created(res, 'Task created successfully', { task });
  } catch (err) { next(err); }
}

export async function listTasks(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await taskService.listTasks(
      req.params['projectId'] as string,
      req.user.id,
      req.query as taskService.TaskQuery,
    );

    ApiResponse.success(res, 'Tasks retrieved successfully', result);
  } catch (err) { next(err); }
}

export async function getTask(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const task = await taskService.getTask(
      req.params['projectId'] as string,
      req.params['id'] as string,
      req.user.id,
    );

    ApiResponse.success(res, 'Task retrieved successfully', { task });
  } catch (err) { next(err); }
}

export async function updateTask(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const task = await taskService.updateTask(
      req.params['projectId'] as string,
      req.params['id'] as string,
      req.user.id,
      req.body as taskService.UpdateTaskInput,
    );

    ApiResponse.success(res, 'Task updated successfully', { task });
  } catch (err) { next(err); }
}

export async function deleteTask(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await taskService.deleteTask(
      req.params['projectId'] as string,
      req.params['id'] as string,
      req.user.id,
    );

    ApiResponse.noContent(res);
  } catch (err) { next(err); }
}
