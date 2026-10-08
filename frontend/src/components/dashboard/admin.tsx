import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface Company {
  id: number;
  name: string;
  address: string;
  industry: string;
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

const Admin = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch(`${API_URL}/companies`);
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

        const result: Company[] | ApiResponse = await response.json();
        if (!response.ok) {
          const message = Array.isArray(result) ? undefined : result.message;
          throw new Error(
            Array.isArray(message)
              ? message.join(", ")
              : (message ?? "Unable to load companies."),
          );
        }

        if (!Array.isArray(usersResult)) {
          throw new Error("The server returned an invalid users response.");
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
            : "Unable to load page data.",
        );
      }
    };

    void loadCompanies();
  }, []);

  // const handleEditUser()=>{

  // }
  // const handleDeleteUser()=>{

  // }
  const signOut = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <>
      <header className="static flex align-items-center justify-content-between mb-5 w-full">
        <h1 className="text-900 text-2xl font-bold m-0 mb-2 p-5">
          Admin Dashboard
        </h1>
        <button
          className="mr-5 p-2 border-round border-none bg-red-700 text-white"
          onClick={signOut}
        >
          Sign out
        </button>
      </header>
      <main className="flex flex-column align-items-center justify-content-center gap-8 h-30rem">
        <div className="data flex flex-row w-screen gap-4 justify-content-center gap-8">
          <div className="userdata">
            <div className="hedding flex align-items-center justify-content-between mb-5 w-full">
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
                onClick={() => navigate("/create-user")}
              >
                <i className="fa-solid fa-plus"></i> Add Users
              </button>
            </div>
            <table className="table-auto border-collapse border-2 border-gray-500 mb-4">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    User Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Email</th>
                  <th className="border border-gray-300 px-4 py-2">Role</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Companies
                  </th>
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
                      <i className="fa-regular fa-pen-to-square"></i>  Edit
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
          <div className="comapnydata flex flex-column">
            <div className="hedding flex align-items-center justify-content-between mb-5 w-full">
              <div>
                <h3 className="text-900 text-xl font-bold m-0 mb-2">
                  Companies
                </h3>
                {users.length === 0 ? (
                  <p className="m-0">No companies are available.</p>
                ) : (
                  <p className="m-0">List of companies:</p>
                )}
              </div>

              <button
                className="p-2 border-round border-none bg-green-700 text-white"
                onClick={() => navigate("/create-company")}
              >
                <i className="fa-solid fa-plus"></i> Add Company
              </button>
            </div>
            <table className="table-auto border-collapse border-2 border-gray-500 mb-4">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    Comapny Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Industry</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Modifications
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="py-1">
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {company.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {company.industry}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button className="mr-2 p-2 border-round border-none bg-primary-700 text-white">
                      <i className="fa-regular fa-pen-to-square"></i>  Edit
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
        </div>
      </main>
    </>
  );
};

export default Admin;
