import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Don't throw error if no user, just return null
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Call super but don't require authentication
    return super.canActivate(context);
  }
}
