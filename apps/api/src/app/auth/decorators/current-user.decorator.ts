import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthPayload } from '@task-management/data';

export const CurrentUser = createParamDecorator(
  (data: keyof IAuthPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: IAuthPayload = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  }
);
