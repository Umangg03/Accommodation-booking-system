import { SetMetadata } from '@nestjs/common';
import type { Action, Resource } from './permissions';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, { resource, action });
