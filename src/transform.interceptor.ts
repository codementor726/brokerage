import {
  NestInterceptor,
  ExecutionContext,
  Injectable,
  CallHandler,
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { instanceToPlain } from 'class-transformer';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';

interface HttpExceptionResponse {
  statusCode: number;
  error: string;
}
interface CustomHttpExceptionResponse extends HttpExceptionResponse {
  path: string;
  method: string;
  timeStamp: Date;
}

const getErrorResponse = (
  status,
  errorMessage,
  req,
): CustomHttpExceptionResponse => ({
  statusCode: status,
  error: errorMessage,
  path: req.url,
  method: req.method,
  timeStamp: new Date(),
});

const getErrorLog = (
  errorResponse: CustomHttpExceptionResponse,
  req: Request,
  exception: unknown,
): string => {
  const { statusCode, error } = errorResponse;
  const { method, url } = req;
  const errorLog = `Response Code: ${statusCode} - Method: ${method} - URL: ${url}\n\n
    ${JSON.stringify(errorResponse)}\n\n
    User: ${JSON.stringify(req['user'] ?? 'Not signed in')}\n\n
    ${exception instanceof HttpException ? exception.stack : error}\n\n`;
  return errorLog;
};
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(map((data) => instanceToPlain(data)));
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  handleCastErrorDB(err) {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new HttpException({ message }, 400);
  }

  handleDuplicateFieldsDB(err: MongoError) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = [
      `Duplicate field value: ${value}. Please use another value!`,
    ];
    return new HttpException({ message }, 400);
  }

  handleValidationErrorDB(err) {
    const message = Object.values(err.errors).map(
      (el) => `${el['message']}: Invalid input data`,
    );

    return new HttpException({ message }, 400);
  }

  catch(exception, host: ArgumentsHost) {
    // return next.handle().pipe(map((data) => instanceToPlain(data)));

    // const ctx = host.switchToHttp();
    // const res: Response = ctx.getResponse<Response>();
    // const req: Request = ctx.getRequest<Request>();

    if (exception instanceof MongoError) {
      if (exception.name === 'CastError')
        return this.handleCastErrorDB(exception);
      else if (exception.name === 'ValidationError')
        return this.handleValidationErrorDB(exception);
    }

    // else if (exception instanceof JsonWebTokenError)
    //   return this.handleJWTError();
    // else if (exception.name === 'TokenExpiredError')
    //   return this.handleJWTExpiredError();

    // switch (exception.code) {
    //   case 11000:
    //     // duplicate exception
    //     this.handleDuplicateFieldsDB(exception);
    //     // do whatever you want here, for instance send error to client
    //     break;
    //   default:
    // }
  }
}
