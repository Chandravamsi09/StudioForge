import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP_REQUEST');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${method}] ${url} ${statusCode} - ${duration}ms [IP: ${ip}] [UA: ${userAgent.substring(0, 40)}]`,
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.warn(`[${method}] ${url} FAILED in ${duration}ms: ${err.message}`);
        },
      }),
    );
  }
}
