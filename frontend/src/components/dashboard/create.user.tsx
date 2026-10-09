import { useEffect, useState, type FormEvent } from "react";

interface Company {
  id: number;
  name: string;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
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
  const [isAdd, setIsAdd] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsAdd((pre) => !pre);

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyIds: selectedCompanyIds }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok) {
        setError(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Unable to create user."),
        );
        return;
      }

      setForm({ name: "", email: "", password: "" });
      setSelectedCompanyIds([]);
      setSuccess("User created successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  useEffect(() => { 
    const loadCompanies = async () => {
      try {
        const response = await fetch(`${API_URL}/companies`);
        const result: Company[] | ApiResponse = await response.json();
        const usersResponse = await fetch(`${API_URL}/users`);
        const usersResult: User[] | ApiResponse = await usersResponse.json();

        if (!usersResponse.ok) {
          const message = Array.isArray(usersResult)
            ? undefined
            : usersResult.message;

          throw new Error(
            Array.isArray(message)
              ? message.join(", ")
              : (message ?? "Unable to load users."),
          );
        }

        if (!Array.isArray(usersResult)) {
          throw new Error("The server returned an invalid users response.");
        }

        if (!response.ok) {
          const message = Array.isArray(result) ? undefined : result.message;
          throw new Error(
            Array.isArray(message)
              ? message.join(", ")
              : (message ?? "Unable to load companies."),
          );
        }
        if (!Array.isArray(result)) {
          throw new Error("The server returned an invalid companies response.");
        }
        setCompanies(result);
        setUsers(usersResult);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load companies.",
        );
      }
    };

    void loadCompanies();
  }, [handleSubmit]);

  const toggleCompany = (companyId: number) => {
    setSelectedCompanyIds((selected) =>
      selected.includes(companyId)
        ? selected.filter((id) => id !== companyId)
        : [...selected, companyId],
    );
  };

  return (
    <>
      <div className="hedding flex align-items-center justify-content-between mb-3 w-full">
        <div>
          <h3 className="text-900 text-xl font-bold m-0 mb-2">  Users</h3>
          {users.length === 0 ? (
            <p className="m-0">No users are available.</p>
          ) : (
            <p className="m-0">List of users:</p>
          )}
        </div>

        <button
          className="p-2 border-round border-none bg-green-700 text-white"
          onClick={() => setIsAdd((pre) => !pre)}
        >
          {isAdd ? (
            "Cancel"
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> Add User
            </>
          )}
        </button>
      </div>
      <div className={isAdd ? "" : "hidden"}>
        <main className="p-5 m-5 gap-8 h-auto">
          <header className="text-center mb-5">
            <h1 className="text-900 text-2xl font-bold m-0 mb-2">
              Create User
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
                required
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

            <button
              className="w-full p-3 border-1 border-round-md font-semibold cursor-pointer"
              type="submit"
              disabled={
                companies.length === 0 || selectedCompanyIds.length === 0
              }
            >
              Create
            </button>
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
                  <button className="mr-2 p-2 border-round border-none bg-primary-700 text-white">
                    <i className="fa-regular fa-pen-to-square"></i> Edit
                  </button>
                  <button className="p-2 border-round border-none bg-red-700 text-white">
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
