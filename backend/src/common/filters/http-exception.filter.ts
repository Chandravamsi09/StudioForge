import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP_EXCEPTION');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'An unexpected internal server error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        error = (res as any).error || error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    const tenantId = (request as any).tenantId || request.headers['x-tenant-id'] || 'anonymous';

    const errorResponse = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      tenantId,
    };

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - Status ${status} - Error: ${JSON.stringify(message)}`);
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - Status ${status} - Client Error: ${JSON.stringify(message)}`);
    }

    response.status(status).json(errorResponse);
  }
}
