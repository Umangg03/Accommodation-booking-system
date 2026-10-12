export type Role = 'ADMIN' | 'MANAGER' | 'USER';
export type Resource =
  | 'companies'
  | 'users'
  | 'accommodations'
  | 'customers'
  | 'bookings'
  | 'permissions';
export type Action =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'confirm'
  | 'cancel';

const permissionMap: Record<
  Resource,
  Partial<Record<Action, readonly Role[]>>
> = {
  companies: {
    view: ['ADMIN'],
    create: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },
  users: {
    view: ['ADMIN'],
    create: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },
  accommodations: {
    view: ['ADMIN', 'MANAGER', 'USER'],
    create: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },
  customers: {
    view: ['ADMIN', 'MANAGER', 'USER'],
    create: ['ADMIN', 'MANAGER', 'USER'],
    update: ['ADMIN', 'MANAGER'],
    delete: ['ADMIN'],
  },
  bookings: {
    view: ['ADMIN', 'MANAGER', 'USER'],
    create: ['ADMIN', 'MANAGER', 'USER'],
    update: ['ADMIN', 'MANAGER'],
    confirm: ['ADMIN', 'MANAGER'],
    cancel: ['ADMIN', 'MANAGER'],
  },
  permissions: {
    view: ['ADMIN'],
  },
};

export const permissionMatrix = permissionMap;

export function normalizeRole(role: unknown): Role | undefined {
  if (typeof role !== 'string') {
    return undefined;
  }

  const normalized = role.trim().toUpperCase();
  return normalized === 'ADMIN' ||
    normalized === 'MANAGER' ||
    normalized === 'USER'
    ? normalized
    : undefined;
}

export function can(
  role: unknown,
  resource: Resource,
  action: Action,
): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole
    ? (permissionMap[resource][action]?.includes(normalizedRole) ?? false)
    : false;
}
