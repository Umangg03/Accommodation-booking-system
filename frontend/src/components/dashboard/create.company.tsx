import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, API_URL } from "../../lib/api";
import { usePermissions } from "../../auth/usePermissions";

interface Company {
  id: number;
  name: string;
  address: string;
  industry: string;
}

interface CompanyForm {
  name: string;
  address: string;
  industry: string;
}

interface ApiResponse {
  message?: string | string[];
}

const EMPTY_FORM: CompanyForm = { name: "", address: "", industry: "" };

const getErrorMessage = (message: ApiResponse["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const CreateCompany = () => {
  const { can } = usePermissions();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCompanies = async () => {
    const response = await apiFetch(`${API_URL}/companies`);
    const result: Company[] | ApiResponse = await response.json();
    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          Array.isArray(result) ? undefined : result.message,
          "Unable to load companies.",
        ),
      );
    }
    if (!Array.isArray(result)) {
      throw new Error("The server returned invalid company data.");
    }
    setCompanies(result);
  };

  useEffect(() => {
    void loadCompanies()
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load companies.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormVisible(false);
    setError("");
    setSuccess("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const name = form.name.trim();
    const address = form.address.trim();
    const industry = form.industry.trim();
    if (!name || !address || !industry) {
      setError("Please complete all company details.");
      return;
    }
    if (
      companies.some(
        (company) =>
          company.name.toLowerCase() === name.toLowerCase() &&
          company.id !== editingId,
      )
    ) {
      setError("A company with this name already exists.");
      return;
    }

    try {
      const response = await apiFetch(
        `${API_URL}/companies${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, industry }),
        },
      );
      const result: ApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result.message,
            `Unable to ${editingId ? "update" : "create"} company.`,
          ),
        );
      }
      await loadCompanies();
      setForm(EMPTY_FORM);
      setEditingId(null);
      setIsFormVisible(false);
      setSuccess(
        editingId
          ? "Company updated successfully."
          : "Company created successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save company.",
      );
    }
  };

  const editCompany = (company: Company) => {
    setForm({
      name: company.name,
      address: company.address,
      industry: company.industry,
    });
    setEditingId(company.id);
    setIsFormVisible(true);
    setError("");
    setSuccess("");
  };

  const deleteCompany = async (company: Company) => {
    if (!window.confirm(`Delete company ${company.name}?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API_URL}/companies/${company.id}`, {
        method: "DELETE",
      });
      const result: ApiResponse = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(result.message, "Unable to delete company."));
      }
      await loadCompanies();
      setSuccess("Company deleted successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete company.",
      );
    }
  };

  return (
    <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
      <header className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-900 text-xl font-bold m-0 mb-2">Companies</h2>
          <p className="text-600 m-0">
            {companies.length === 0
              ? "No companies are available."
              : `${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        {can("companies", "create") && (
          <button
            className="p-2 px-3 border-round border-none bg-green-700 text-white cursor-pointer sm:w-auto"
            type="button"
            onClick={() => {
              if (isFormVisible) {
                resetForm();
                return;
              }
              setForm(EMPTY_FORM);
              setEditingId(null);
              setIsFormVisible(true);
              setError("");
              setSuccess("");
            }}
          >
            {isFormVisible ? "Cancel" : "Add company"}
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
            {editingId ? "Edit company" : "Create company"}
          </h3>
          <div className="flex flex-column gap-2">
            <label htmlFor="company-name">Company name</label>
            <input
              id="company-name"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="company-address">Address</label>
            <textarea
              id="company-address"
              rows={2}
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="company-industry">Industry</label>
            <input
              id="company-industry"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.industry}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  industry: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-column sm:flex-row gap-2">
            <button
              className="flex-1 p-2 border-1 border-round-md cursor-pointer"
              type="submit"
            >
              {editingId ? "Save changes" : "Create company"}
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
        <p className="m-0">Loading companies...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  "Company",
                  "Address",
                  "Industry",
                  ...(can("companies", "update") || can("companies", "delete")
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
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {company.name}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {company.address}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {company.industry}
                  </td>
                  {(can("companies", "update") ||
                    can("companies", "delete")) && (
                    <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                      <div className="flex flex-column sm:flex-row gap-2">
                        {can("companies", "update") && (
                          <button
                            className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => editCompany(company)}
                          >
                            Edit
                          </button>
                        )}
                        {can("companies", "delete") && (
                          <button
                            className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => void deleteCompany(company)}
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

export default CreateCompany;
