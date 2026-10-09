import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface CompanyForm {
  name: string;
  address: string;
  industry: string;
}

interface ApiResponse {
  message?: string | string[];
}

interface Company {
  id: number;
  name: string;
  address: string;
  industry: string;
}
const API_URL = "http://localhost:3000";

const CreateCompany = () => {
  const [isAdd, setIsAdd] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<CompanyForm>({
    name: "",
    address: "",
    industry: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsAdd((pre) => !pre);

    try {
      const response = await fetch("http://localhost:3000/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Unable to create company."),
        );
        return;
      }

      setForm({ name: "", address: "", industry: "" });
      setSuccess("Company created successfully.");
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
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load page data.",
        );
      }
    };

    void loadCompanies();
  }, [handleSubmit]);

  return (
    <>
      <div className="accommodationData w-full h-screen">
        <div className="comapnydata flex flex-column">
          <div className="hedding flex align-items-center justify-content-between mb-3">
            <div>
              <h3 className="text-900 text-xl font-bold m-0 mb-2">Companies</h3>
              {companies.length === 0 ? (
                <p className="m-0">No companies are available.</p>
              ) : (
                <p className="m-0">List of companies:</p>
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
                  <i className="fa-solid fa-plus"></i> Add Company
                </>
              )}
            </button>
          </div>
          <div className={isAdd ? "" : "hidden"}>
            <main className=" gap-8 m-5">
              <header className="text-center mb-5">
                <h1 className="text-900 text-2xl font-bold m-0 mb-2">
                  Create Company
                </h1>
              </header>

              <form
                className="flex flex-column gap-4 p-3"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-column gap-2">
                  <label htmlFor="company-name">Company Name</label>
                  <input
                    id="company-name"
                    type="text"
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
                  <label htmlFor="company-address">Address</label>
                  <textarea
                    id="company-address"
                    rows={2}
                    required
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round w-full"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label htmlFor="company-industry">Industry</label>
                  <input
                    id="company-industry"
                    type="text"
                    required
                    value={form.industry}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        industry: event.target.value,
                      }))
                    }
                    className="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round w-full"
                  />
                </div>

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
                  onClick={() => setIsAdd(true)}
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
                  <th className="border border-gray-300 px-4 py-2">
                    Comapny Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Address</th>
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
                      {company.address}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {company.industry}
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
        </div>
      </div>
    </>
  );
};

export default CreateCompany;
