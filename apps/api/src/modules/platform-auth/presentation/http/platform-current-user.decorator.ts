import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformJwtUser } from './platform-jwt-user';

export const PlatformCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PlatformJwtUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: PlatformJwtUser }>();
    return request.user;
  },
);
