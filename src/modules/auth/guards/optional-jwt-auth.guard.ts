import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try to authenticate but don't fail if no token
    try {
      await super.canActivate(context);
    } catch {
      // Ignore authentication errors - allow request to proceed
    }
    return true;
  }

  handleRequest(err: any, user: any) {
    // Don't throw error if no user, just return null
    // This allows the request to proceed without authentication
    return user || null;
  }
}
