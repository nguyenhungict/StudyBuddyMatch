import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      typeof exception.getStatus === 'function'
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse() as
      | string
      | { message?: string | string[]; error?: string; [key: string]: any };

    let message: string | string[] = 'Đã xảy ra lỗi';
    let errorCode = 'HTTP_ERROR';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      if (exceptionResponse.message) {
        message = exceptionResponse.message;
      }
      if (exceptionResponse['errorCode']) {
        errorCode = String(exceptionResponse['errorCode']);
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
