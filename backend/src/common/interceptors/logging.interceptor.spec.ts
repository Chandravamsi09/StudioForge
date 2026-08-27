import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor (Phase 11+)', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should intercept request and execute next handler', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/api/v1/builds',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };
    const mockResponse = { statusCode: 200 };

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };

    const mockCallHandler: any = {
      handle: () => of({ data: 'ok' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ data: 'ok' });
        done();
      },
    });
  });
});
