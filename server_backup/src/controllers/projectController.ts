/**
 * projectController.ts
 * HTTP layer for the Project module.
 * Validates inputs, calls projectService, sends standardised responses.
 *
 * Routes handled:
 *   POST   /api/v1/projects              — create
 *   GET    /api/v1/projects              — list (paginated, filtered, sorted)
 *   GET    /api/v1/projects/:id          — get single
 *   PUT    /api/v1/projects/:id          — full update
 *   DELETE /api/v1/projects/:id          — delete (owner only)
 *   PATCH  /api/v1/projects/:id/archive  — archive
 */

import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import {
  CreateProjectBody,
  UpdateProjectBody,
  ProjectQueryParams,
} from '../types/project.types';

// ── POST /projects ────────────────────────────────────────────

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const body = req.body as CreateProjectBody;

    if (!body.name?.trim()) {
      throw ApiError.badRequest('Project name is required.');
    }

    const project = await projectService.createProject(req.user.sub, body);
    ApiResponse.created(res, { project }, 'Project created successfully.');
  } catch (err) {
    next(err);
  }
}

// ── GET /projects ─────────────────────────────────────────────

export async function listProjects(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const query = req.query as ProjectQueryParams;
    const result = await projectService.listProjects(req.user.sub, query);

    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
}

// ── GET /projects/:id ─────────────────────────────────────────

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const project = await projectService.getProjectById(
      req.params['id'],
      req.user.sub,
    );

    ApiResponse.success(res, { project });
  } catch (err) {
    next(err);
  }
}

// ── PUT /projects/:id ─────────────────────────────────────────

export async function updateProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const body = req.body as UpdateProjectBody;
    const project = await projectService.updateProject(
      req.params['id'],
      req.user.sub,
      body,
    );

    ApiResponse.success(res, { project }, 'Project updated successfully.');
  } catch (err) {
    next(err);
  }
}

// ── DELETE /projects/:id ──────────────────────────────────────

export async function deleteProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await projectService.deleteProject(req.params['id'], req.user.sub);
    ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /projects/:id/archive ───────────────────────────────

export async function archiveProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const project = await projectService.archiveProject(
      req.params['id'],
      req.user.sub,
    );

    ApiResponse.success(res, { project }, 'Project archived.');
  } catch (err) {
    next(err);
  }
}
