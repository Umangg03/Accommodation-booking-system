export type Role = "ADMIN" | "MANAGER" | "USER";
export type Resource =
  | "companies"
  | "users"
  | "accommodations"
  | "customers"
  | "bookings";
export type Action =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "confirm"
  | "cancel";

export type DashboardPage = Resource;

const permissionMap: Record<
  Resource,
  Partial<Record<Action, readonly Role[]>>
> = {
  companies: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    update: ["ADMIN"],
    delete: ["ADMIN"],
  },
  users: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    update: ["ADMIN"],
    delete: ["ADMIN"],
  },
  accommodations: {
    view: ["ADMIN", "MANAGER", "USER"],
    create: ["ADMIN"],
    update: ["ADMIN"],
    delete: ["ADMIN"],
  },
  customers: {
    view: ["ADMIN", "MANAGER", "USER"],
    create: ["ADMIN", "MANAGER", "USER"],
    update: ["ADMIN", "MANAGER"],
    delete: ["ADMIN"],
  },
  bookings: {
    view: ["ADMIN", "MANAGER", "USER"],
    create: ["ADMIN", "MANAGER", "USER"],
    update: ["ADMIN", "MANAGER"],
    confirm: ["ADMIN", "MANAGER"],
    cancel: ["ADMIN", "MANAGER"],
  },
  permissions: {
    view: ["ADMIN"],
  },
};

export const permissionMatrix = permissionMap;

export const normalizeRole = (role: unknown): Role | null => {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toUpperCase();
  return normalized === "ADMIN" ||
    normalized === "MANAGER" ||
    normalized === "USER"
    ? normalized
    : null;
};

export const can = (
  role: Role | null | undefined,
  resource: Resource,
  action: Action,
): boolean =>
  role ? (permissionMap[resource][action]?.includes(role) ?? false) : false;

export const firstViewablePage = (
  role: Role | null | undefined,
): DashboardPage | null =>
  ([
    "users",
    "companies",
    "accommodations",
    "customers",
    "bookings",
    "permissions",
  ] as const)
    .find((resource) => can(role, resource, "view")) ?? null;
