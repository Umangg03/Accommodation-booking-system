import { useState, type FormEvent } from "react";

interface CompanyForm {
  name: string;
  address: string;
  industry: string;
}

interface ApiResponse {
  message?: string | string[];
}

const CreateCompany = () => {
  const [form, setForm] = useState<CompanyForm>({
    name: "",
    address: "",
    industry: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

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

  return (
    <main className="surface-ground flex align-items-center justify-content-center gap-8 min-h-screen">
      <div className="Company">
        <section className="surface-card border-round-xl shadow-8 p-4 md:p-5 w-full md:w-30rem">
          <header className="text-center mb-5">
            <h1 className="text-900 text-2xl font-bold m-0 mb-2">
              Create Company
            </h1>
          </header>

          <form className="flex flex-column gap-4 p-3" onSubmit={handleSubmit}>
            <div className="flex flex-column gap-2">
              <label htmlFor="company-name">Company Name</label>
              <input
                id="company-name"
                type="text"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
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
            >
              Create
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default CreateCompany;
