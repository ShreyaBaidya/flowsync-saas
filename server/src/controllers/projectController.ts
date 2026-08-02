import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export async function createProject(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const project = await projectService.createProject(
      req.user.id,
      req.body as projectService.CreateProjectInput,
    );

    ApiResponse.created(res, 'Project created successfully', { project });
  } catch (err) { next(err); }
}

export async function listProjects(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await projectService.listProjects(
      req.user.id,
      req.query as projectService.ProjectQuery,
    );

    ApiResponse.success(res, 'Projects retrieved successfully', result);
  } catch (err) { next(err); }
}

export async function getProject(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const project = await projectService.getProject(
      req.params['id'] as string,
      req.user.id,
    );

    ApiResponse.success(res, 'Project retrieved successfully', { project });
  } catch (err) { next(err); }
}

export async function updateProject(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const project = await projectService.updateProject(
      req.params['id'] as string,
      req.user.id,
      req.body as projectService.UpdateProjectInput,
    );

    ApiResponse.success(res, 'Project updated successfully', { project });
  } catch (err) { next(err); }
}

export async function deleteProject(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await projectService.deleteProject(
      req.params['id'] as string,
      req.user.id,
    );

    ApiResponse.noContent(res);
  } catch (err) { next(err); }
}
