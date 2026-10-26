import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * Injects the authenticated user, or a single property of it:
 * `@CurrentUser('id') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;

    return property ? user?.[property] : user;
  },
);
