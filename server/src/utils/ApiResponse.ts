/**
 * ApiResponse.ts
 * Standardised JSON response envelope for all API endpoints.
 *
 * Success shape:  { success: true,  data: T,       message?: string }
 * Error shape:    { success: false, error: string, errors?: unknown[] }
 */

import { Response } from 'express';

export interface SuccessPayload<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export interface ErrorPayload {
  success: false;
  error: string;
  errors?: unknown[];
}

export class ApiResponse {
  /**
   * Send a 2xx success response.
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
  ): Response {
    const body: SuccessPayload<T> = {
      success: true,
      ...(message && { message }),
      data,
    };
    return res.status(statusCode).json(body);
  }

  /**
   * Send a 201 Created response.
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send a 204 No Content response (no body).
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
