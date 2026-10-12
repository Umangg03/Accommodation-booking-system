import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, API_URL } from "../../lib/api";
import { usePermissions } from "../../auth/usePermissions";
import type { Role } from "../../auth/permissions";

interface Company {
  id: number;
  name: string;
}

interface CompanyRole {
  companyId: number;
  role: Role;
}

interface User {
  id: number;
  name: string;
  email: string;
  companies: Company[];
  companyRoles: CompanyRole[];
}

interface UserForm {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse {
  message?: string | string[];
}

const EMPTY_FORM: UserForm = { name: "", email: "", password: "" };
const ROLES: Exclude<Role, "ADMIN">[] = ["USER", "MANAGER"];

const getErrorMessage = (message: ApiResponse["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const CreateUser = () => {
  const { can } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [companyRoles, setCompanyRoles] = useState<Record<number, Role>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const [companiesResponse, usersResponse] = await Promise.all([
      apiFetch(`${API_URL}/companies`),
      apiFetch(`${API_URL}/users`),
    ]);
    const [companiesResult, usersResult] = await Promise.all([
      companiesResponse.json() as Promise<Company[] | ApiResponse>,
      usersResponse.json() as Promise<User[] | ApiResponse>,
    ]);

    if (!companiesResponse.ok) {
      throw new Error(
        getErrorMessage(
          Array.isArray(companiesResult) ? undefined : companiesResult.message,
          "Unable to load companies.",
        ),
      );
    }
    if (!usersResponse.ok) {
      throw new Error(
        getErrorMessage(
          Array.isArray(usersResult) ? undefined : usersResult.message,
          "Unable to load users.",
        ),
      );
    }
    if (!Array.isArray(companiesResult) || !Array.isArray(usersResult)) {
      throw new Error("The server returned invalid user data.");
    }
    setCompanies(companiesResult);
    setUsers(usersResult);
  };

  useEffect(() => {
    void loadData()
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedCompanyIds([]);
    setCompanyRoles({});
    setEditingId(null);
    setIsFormVisible(false);
    setError("");
    setSuccess("");
  };

  const toggleCompany = (companyId: number) => {
    setSelectedCompanyIds((selected) =>
      selected.includes(companyId)
        ? selected.filter((id) => id !== companyId)
        : [...selected, companyId],
    );
    setCompanyRoles((current) => ({
      ...current,
      [companyId]: current[companyId] ?? "USER",
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim();
    if (!form.name.trim() || !email) {
      setError("Name and email are required.");
      return;
    }
    if (
      users.some(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() &&
          user.id !== editingId,
      )
    ) {
      setError("A user with this email already exists.");
      return;
    }
    if (selectedCompanyIds.length === 0) {
      setError("Select at least one company.");
      return;
    }
    if (!editingId && !form.password.trim()) {
      setError("Password is required.");
      return;
    }

    const payload: {
      name: string;
      email: string;
      password?: string;
      companyIds: number[];
      companyRoles: CompanyRole[];
    } = {
      name: form.name.trim(),
      email,
      companyIds: selectedCompanyIds,
      companyRoles: selectedCompanyIds.map((companyId) => ({
        companyId,
        role: companyRoles[companyId] ?? "USER",
      })),
    };
    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      const response = await apiFetch(
        `${API_URL}/users${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result: ApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result.message,
            `Unable to ${editingId ? "update" : "create"} user.`,
          ),
        );
      }

      await loadData();
      setIsFormVisible(false);
      setForm(EMPTY_FORM);
      setSelectedCompanyIds([]);
      setCompanyRoles({});
      setSuccess(
        editingId ? "User updated successfully." : "User created successfully.",
      );
      setEditingId(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save user.",
      );
    }
  };

  const editUser = (user: User) => {
    const assignedCompanies = user.companies.map(({ id }) => id);
    setForm({ name: user.name, email: user.email, password: "" });
    setSelectedCompanyIds(assignedCompanies);
    setCompanyRoles(
      Object.fromEntries(
        user.companyRoles.map(({ companyId, role }) => [companyId, role]),
      ),
    );
    setEditingId(user.id);
    setIsFormVisible(true);
    setError("");
    setSuccess("");
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API_URL}/users/${user.id}`, {
        method: "DELETE",
      });
      const result: ApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(result.message, "Unable to delete user."));
      }
      await loadData();
      setSuccess("User deleted successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete user.",
      );
    }
  };

  return (
    <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
      <header className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-900 text-xl font-bold m-0 mb-2">Users</h2>
          <p className="text-600 m-0">
            {users.length === 0
              ? "No users are available."
              : `${users.length} user${users.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {can("users", "create") && (
          <button
            className="p-2 px-3 border-round border-none bg-green-700 text-white cursor-pointer sm:w-auto"
            type="button"
            onClick={() => {
              if (isFormVisible) {
                resetForm();
                return;
              }
              setForm(EMPTY_FORM);
              setSelectedCompanyIds([]);
              setCompanyRoles({});
              setEditingId(null);
              setIsFormVisible(true);
              setError("");
              setSuccess("");
            }}
          >
            {isFormVisible ? "Cancel" : "Add user"}
          </button>
        )}
      </header>

      {error && (
        <p className="text-red-600 m-0 mb-3" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-700 m-0 mb-3" role="status">
          {success}
        </p>
      )}

      {isFormVisible && (
        <form
          className="surface-ground border-round-md p-3 md:p-4 mb-4 flex flex-column gap-3 max-w-30rem mx-auto"
          onSubmit={submit}
        >
          <h3 className="text-900 text-lg font-semibold m-0">
            {editingId ? "Edit user" : "Create user"}
          </h3>
          <div className="flex flex-column gap-2">
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              autoComplete="email"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="user-password">
              {editingId ? "New password (optional)" : "Password"}
            </label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              required={!editingId}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </div>
          <fieldset className="border-none p-0 m-0">
            <legend className="text-900 font-semibold mb-2">
              Company assignments
            </legend>
            <div className="flex flex-column gap-2">
              {companies.map((company) => (
                <div
                  className="surface-card border-1 surface-border border-round-md p-2 flex flex-column md:flex-row md:align-items-center justify-content-between gap-3"
                  key={company.id}
                >
                  <label className="flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(company.id)}
                      onChange={() => toggleCompany(company.id)}
                    />
                    {company.name}
                  </label>
                  {selectedCompanyIds.includes(company.id) && (
                    <fieldset className="border-none p-0 m-0 flex align-items-center flex-wrap gap-3">
                      <legend className="text-600 text-sm">
                        Role in {company.name}
                      </legend>
                      {companyRoles[company.id] === "ADMIN" && (
                        <span className="text-600 text-sm">
                          Existing role: ADMIN
                        </span>
                      )}
                      {ROLES.map((role) => (
                        <label
                          className="flex align-items-center gap-2 cursor-pointer"
                          htmlFor={`company-role-${company.id}-${role}`}
                          key={role}
                        >
                          <input
                            id={`company-role-${company.id}-${role}`}
                            type="radio"
                            name={`company-role-${company.id}`}
                            value={role}
                            checked={companyRoles[company.id] === role}
                            onChange={() =>
                              setCompanyRoles((current) => ({
                                ...current,
                                [company.id]: role,
                              }))
                            }
                          />
                          {role === "USER" ? "User" : "Manager"}
                        </label>
                      ))}
                    </fieldset>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-column sm:flex-row gap-2">
            <button
              className="flex-1 p-2 border-1 border-round-md cursor-pointer"
              type="submit"
              disabled={!companies.length || !selectedCompanyIds.length}
            >
              {editingId ? "Save changes" : "Create user"}
            </button>
            <button
              className="p-2 border-1 border-round-md cursor-pointer"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="m-0">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  "Name",
                  "Email",
                  "Company roles",
                  ...(can("users", "update") || can("users", "delete")
                    ? ["Actions"]
                    : []),
                ].map((heading) => (
                  <th
                    className="border-1 border-solid surface-border p-2 md:px-4 md:py-2 text-left"
                    key={heading}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {user.name}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {user.email}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {user.companies
                      .map((company) => {
                        const role = user.companyRoles.find(
                          (assignment) => assignment.companyId === company.id,
                        )?.role;
                        return `${company.name}: ${role ?? "USER"}`;
                      })
                      .join(", ") || "No assigned companies"}
                  </td>
                  {(can("users", "update") || can("users", "delete")) && (
                    <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                      <div className="flex flex-column sm:flex-row gap-2">
                        {can("users", "update") && (
                          <button
                            className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => editUser(user)}
                          >
                            Edit
                          </button>
                        )}
                        {can("users", "delete") && (
                          <button
                            className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => void deleteUser(user)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CreateUser;
