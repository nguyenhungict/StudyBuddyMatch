import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    console.error('Unhandled exception:', exception);

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: 'Lỗi hệ thống, vui lòng thử lại sau',
      errorCode: 'INTERNAL_SERVER_ERROR',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
