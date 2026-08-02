import { Response } from 'express';

export class ApiResponse {
  /**
   * Send a 200 OK response.
   */
  static success<T>(
    res: Response,
    message: string,
    data: T,
    statusCode = 200,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send a 201 Created response.
   */
  static created<T>(res: Response, message: string, data: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  /**
   * Send a 204 No Content response.
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
