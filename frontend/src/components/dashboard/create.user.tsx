import { useEffect, useState, type FormEvent } from "react";

interface Company {
  id: number;
  name: string;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  companyIds: number[];
}

interface ApiResponse {
  message?: string | string[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    role: string;
    description?: string;
  };
  companies: Company[];
}

const API_URL = "http://localhost:3000";

const CreateUser = () => {
  const emptyForm: UserForm = {
    name: "",
    email: "",
    password: "",
    companyIds: [],
  };

  const [isAdd, setIsAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsersAndCompanies = async () => {
    try {
      const [companiesResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/companies`),
        fetch(`${API_URL}/users`),
      ]);

      const companiesResult: Company[] | ApiResponse = await companiesResponse.json();
      const usersResult: User[] | ApiResponse = await usersResponse.json();

      if (!companiesResponse.ok) {
        const message = Array.isArray(companiesResult)
          ? undefined
          : companiesResult.message;

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : (message ?? "Unable to load companies."),
        );
      }

      if (!usersResponse.ok) {
        const message = Array.isArray(usersResult) ? undefined : usersResult.message;

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : (message ?? "Unable to load users."),
        );
      }

      if (!Array.isArray(companiesResult) || !Array.isArray(usersResult)) {
        throw new Error("The server returned invalid user data.");
      }

      setCompanies(companiesResult);
      setUsers(usersResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load user data.",
      );
    }
  };

  useEffect(() => {
    void loadUsersAndCompanies();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedCompanyIds([]);
    setEditingId(null);
    setIsAdd(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = form.email.trim();
    const isDuplicateEmail = users.some(
      (user) =>
        user.email.toLowerCase() === trimmedEmail.toLowerCase() &&
        user.id !== editingId,
    );

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (isDuplicateEmail) {
      setError("A user with this email already exists.");
      return;
    }

    if (selectedCompanyIds.length === 0) {
      setError("Please select at least one company.");
      return;
    }

    if (!editingId && !form.password.trim()) {
      setError("Password is required.");
      return;
    }

    const payload: Partial<UserForm> & {
      email: string;
      companyIds: number[];
    } = {
      ...form,
      email: trimmedEmail,
      companyIds: selectedCompanyIds,
    };

    if (editingId && (!payload.password || !payload.password.trim())) {
      delete payload.password;
    }

    try {
      const response = await fetch(
        editingId ? `${API_URL}/users/${editingId}` : `${API_URL}/users`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ??
                `Unable to ${editingId ? "update" : "create"} user.`),
        );
        return;
      }

      await loadUsersAndCompanies();
      setForm(emptyForm);
      setSelectedCompanyIds([]);
      setEditingId(null);
      setIsAdd(false);
      setSuccess(
        editingId ? "User updated successfully." : "User created successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  const editUser = (user: User) => {
    setIsAdd(true);
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      companyIds: user.companies.map((company) => company.id),
    });
    setSelectedCompanyIds(user.companies.map((company) => company.id));
    setError("");
    setSuccess("");
  };

  const toggleCompany = (companyId: number) => {
    setSelectedCompanyIds((selected) =>
      selected.includes(companyId)
        ? selected.filter((id) => id !== companyId)
        : [...selected, companyId],
    );
  };

  const deleteUser = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete user.");
      }

      await loadUsersAndCompanies();
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
    <>
      <div className="hedding flex align-items-center justify-content-between mb-3 w-full">
        <div>
          <h3 className="text-900 text-xl font-bold m-0 mb-2">Users</h3>
          {users.length === 0 ? (
            <p className="m-0">No users are available.</p>
          ) : (
            <p className="m-0">List of users:</p>
          )}
        </div>

        <button
          className="p-2 border-round border-none bg-green-700 text-white"
          onClick={() => {
            if (isAdd) {
              resetForm();
              return;
            }
            setIsAdd(true);
            setEditingId(null);
            setForm(emptyForm);
            setSelectedCompanyIds([]);
            setError("");
            setSuccess(""); 
          }}
        >
          {isAdd ? "Cancel" : <><i className="fa-solid fa-plus"></i> Add User</>}
        </button>
      </div>
      <div className={isAdd ? "" : "hidden"}>
        <main className="p-5 m-5 gap-8 h-auto">
          <header className="text-center mb-5">
            <h1 className="text-900 text-2xl font-bold m-0 mb-2">
              {editingId ? "Update User" : "Create User"}
            </h1>
          </header>

          <form className="flex flex-column gap-4 p-3" onSubmit={handleSubmit}>
            <div className="flex flex-column gap-2">
              <label htmlFor="name">User Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round w-full"
              />
            </div>

            <div className="flex flex-column gap-2">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round w-full"
              />
            </div>

            <div className="flex flex-column gap-2">
              <label htmlFor="password">Password</label>
              <input
                id="password"
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
                className="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round w-full"
              />
            </div>

            <fieldset className="border-none p-0 m-0">
              <legend className="mb-2">Select companies</legend>
              {companies.length === 0 ? (
                <p className="m-0">No companies are available.</p>
              ) : (
                companies.map((company) => (
                  <label
                    className="flex align-items-center gap-2 py-1"
                    key={company.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(company.id)}
                      onChange={() => toggleCompany(company.id)}
                    />
                    {company.name}
                  </label>
                ))
              )}
            </fieldset>

            {error && (
              <p className="text-red-600 m-0" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-700 m-0" role="status">
                {success}
              </p>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 p-3 border-1 border-round-md font-semibold cursor-pointer"
                type="submit"
                disabled={
                  companies.length === 0 || selectedCompanyIds.length === 0
                }
              >
                {editingId ? "Update" : "Create"}
              </button>
              {editingId !== null && (
                <button
                  className="p-3 border-1 border-round-md cursor-pointer"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </main>
      </div>

      <div className={isAdd ? "hidden" : ""}>
        <table className="table-auto border-collapse border-2 border-gray-500 mb-4 w-full">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">User Name</th>
              <th className="border border-gray-300 px-4 py-2">Email</th>
              <th className="border border-gray-300 px-4 py-2">Role</th>
              <th className="border border-gray-300 px-4 py-2">Companies</th>
              <th className="border border-gray-300 px-4 py-2">
                Modifications
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {user.name}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {user.email}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {user.role?.role}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {user.companies?.map((c) => c.name).join(", ") || "None"}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    className="mr-2 p-2 border-round border-none bg-primary-700 text-white"
                    onClick={() => editUser(user)}
                  >
                    <i className="fa-regular fa-pen-to-square"></i> Edit
                  </button>
                  <button
                    className="p-2 border-round border-none bg-red-700 text-white"
                    onClick={() => void deleteUser(user.id)}
                  >
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CreateUser;
