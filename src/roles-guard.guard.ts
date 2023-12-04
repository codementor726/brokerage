import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { matchRoles } from './utils/utils.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    // for public routes
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // if there is no protect is called in-case
    if (!user) return false;

    return matchRoles(roles, user.role);
  }
}
