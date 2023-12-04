/* eslint-disable prettier/prettier */
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';
import { IUser } from 'src/users/interfaces/user.interface';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): IUser => {
    const req: Request = ctx.switchToHttp().getRequest();

    return req.user as IUser;
    // return <User>req.user;
  },
);

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
