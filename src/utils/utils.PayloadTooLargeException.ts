import {
  ExceptionFilter,
  PayloadTooLargeException,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(PayloadTooLargeException)
export class PayloadTooLargeExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      status: 'fail',
      message: {
        error: [
          'error: ' + exception.message + ' should not be greater than 5 mb',
        ],
      },
      statusCode: status,
    });
  }
}
