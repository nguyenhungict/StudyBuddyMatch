import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
// 1. Giữ lại import Prisma namespace
import { Prisma } from '@prisma/client'; 
// 2. Thêm import trực tiếp lớp lỗi từ submodule của Prisma
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// 3. Sử dụng trực tiếp lớp lỗi trong decorator @Catch
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  // 4. Sử dụng kiểu đã import trực tiếp cho tham số exception
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Lỗi cơ sở dữ liệu';
    let errorCode = `PRISMA_${exception.code}`;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu bị trùng, vi phạm ràng buộc unique';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Vi phạm ràng buộc khóa ngoại';
        break;
      default:
        break;
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