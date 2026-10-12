import { useCallback } from "react";
import { can as hasPermission, normalizeRole } from "./permissions";
import type { Action, Resource } from "./permissions";

export const usePermissions = () => {
  const role = normalizeRole(sessionStorage.getItem("user_role"));
  const can = useCallback(
    (resource: Resource, action: Action) => hasPermission(role, resource, action),
    [role],
  );

  return { role, can };
};
