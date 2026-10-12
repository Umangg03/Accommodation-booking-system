import { permissionMatrix, type Action, type Resource } from "../../auth/permissions";

const ROLES = ["ADMIN", "MANAGER", "USER"] as const;
const RESOURCE_LABELS: Record<Resource | "permissions", string> = {
  companies: "Companies",
  users: "Users",
  accommodations: "Accommodations, types, and locations",
  customers: "Customers",
  bookings: "Bookings",
  permissions: "Permissions Page",
};
const ACTION_LABELS: Record<Action, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  confirm: "Confirm",
  cancel: "Cancel",
};

const rows = Object.entries(permissionMatrix).flatMap(
  ([resource, actions]) =>
    Object.entries(actions).map(([action, allowedRoles]) => ({
      resource: resource as Resource,
      action: action as Action,
      allowedRoles,
    })),
);

const PermissionsAdmin = () => (
  <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
    <header className="mb-3">
      <h2 className="text-900 text-xl font-bold m-0 mb-2">Role permissions</h2>
      <p className="text-600 m-0">
        Permissions currently configured for each company role.
      </p>
    </header>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {["Page or resource", "Action", "Admin", "Manager", "User"].map(
              (heading) => (
                <th
                  className="border-1 border-solid surface-border p-2 md:px-4 md:py-2 text-left"
                  key={heading}
                  scope="col"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ resource, action, allowedRoles }) => (
            <tr key={`${resource}-${action}`}>
              <th
                className="border-1 border-solid surface-border p-2 md:px-4 md:py-2 text-left font-medium"
                scope="row"
              >
                {RESOURCE_LABELS[resource]}
              </th>
              <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                {ACTION_LABELS[action]}
              </td>
              {ROLES.map((role) => (
                <td
                  className="border-1 border-solid surface-border p-2 md:px-4 md:py-2"
                  key={role}
                >
                  {allowedRoles.includes(role) ? "Allowed" : "Not allowed"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PermissionsAdmin;
