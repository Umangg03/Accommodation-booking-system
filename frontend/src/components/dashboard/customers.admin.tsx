import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch, API_URL } from "../../lib/api";
import { CUSTOMERS_CHANGED_EVENT } from "../../lib/app-events";
import { usePermissions } from "../../auth/usePermissions";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  companies: Company[];
}

interface Company {
  id: number;
  name: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  companyIds: number[];
}

interface ApiError {
  message?: string | string[];
}

const EMPTY_FORM: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  companyIds: [],
};

const getErrorMessage = (message: ApiError["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const CustomersAdmin = () => {
  const { role, can } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCustomers = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      throw new Error("Sign in is required to manage customers.");
    }
    const response = await apiFetch(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result: Customer[] | ApiError = await response.json();
    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          Array.isArray(result) ? undefined : result.message,
          "Unable to load customers.",
        ),
      );
    }
    if (!Array.isArray(result)) {
      throw new Error("The server returned invalid customer data.");
    }
    setCustomers(result);
    if (role === "ADMIN") {
      const companiesResponse = await apiFetch(`${API_URL}/companies`);
      const companiesResult: Company[] | ApiError =
        await companiesResponse.json();
      if (!companiesResponse.ok) {
        throw new Error(
          getErrorMessage(
            Array.isArray(companiesResult)
              ? undefined
              : companiesResult.message,
            "Unable to load companies.",
          ),
        );
      }
      if (!Array.isArray(companiesResult)) {
        throw new Error("The server returned invalid company data.");
      }
      setCompanies(companiesResult);
    } else {
      setCompanies([]);
    }
  }, [role]);

  useEffect(() => {
    void loadCustomers().catch((requestError: unknown) => {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customers.",
      );
    });
  }, [loadCustomers]);

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
    if (role === "ADMIN" && form.companyIds.length === 0) {
      setError("Assign the customer to at least one company.");
      return;
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Sign in is required to manage customers.");
      return;
    }

    try {
      const response = await apiFetch(
        `${API_URL}/customers${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            ...(role === "ADMIN" ? { companyIds: form.companyIds } : {}),
          }),
        },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result.message,
            `Unable to ${editingId ? "update" : "create"} customer.`,
          ),
        );
      }

      await loadCustomers();
      window.dispatchEvent(new Event(CUSTOMERS_CHANGED_EVENT));
      setIsFormVisible(false);
      setForm(EMPTY_FORM);
      setSuccess(
        editingId
          ? "Customer updated successfully."
          : "Customer created successfully.",
      );
      setEditingId(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save customer.",
      );
    }
  };

  const edit = (customer: Customer) => {
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      companyIds: customer.companies.map((company) => company.id),
    });
    setEditingId(customer.id);
    setIsFormVisible(true);
    setError("");
    setSuccess("");
  };

  const remove = async (customer: Customer) => {
    if (!window.confirm(`Delete customer ${customer.name}?`)) {
      return;
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Sign in is required to manage customers.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API_URL}/customers/${customer.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(result.message, "Unable to delete customer."),
        );
      }
      await loadCustomers();
      window.dispatchEvent(new Event(CUSTOMERS_CHANGED_EVENT));
      setSuccess("Customer deleted successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete customer.",
      );
    }
  };

  return (
    <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
      <header className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-900 text-xl font-bold m-0 mb-2">Customers</h2>
          <p className="text-600 m-0">
            {customers.length === 0
              ? "No customers are available."
              : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {can("customers", "create") && <button
          className="p-2 px-3 border-round border-none bg-green-700 text-white cursor-pointer sm:w-auto"
          type="button"
          onClick={() => {
            if (isFormVisible) {
              resetForm();
            } else {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setIsFormVisible(true);
              setError("");
              setSuccess("");
            }
          }}
        >
          {isFormVisible ? "Cancel" : "Add customer"}
        </button>}
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
            {editingId ? "Edit customer" : "Create customer"}
          </h3>
          <div className="flex flex-column gap-2">
            <label htmlFor="customer-name">Name</label>
            <input
              id="customer-name"
              className="block p-2 border-1 surface-border border-round-md"
              required
              maxLength={120}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="customer-email">Email</label>
            <input
              id="customer-email"
              type="email"
              autoComplete="email"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="customer-phone">Phone</label>
            <input
              id="customer-phone"
              type="tel"
              className="block p-2 border-1 surface-border border-round-md"
              minLength={7}
              maxLength={20}
              required
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </div>
          {role === "ADMIN" && (
            <fieldset className="flex flex-column gap-2 border-1 surface-border border-round-md p-3">
              <legend className="text-900 font-semibold px-1">
                Companies this customer belongs to
              </legend>
              <p className="text-600 m-0">
                Customer contact details are shared with every linked company.
              </p>
              {companies.map((company) => (
                <label
                  className="flex align-items-center gap-2"
                  key={company.id}
                >
                  <input
                    type="checkbox"
                    checked={form.companyIds.includes(company.id)}
                    onChange={() => {
                      setForm((current) => ({
                        ...current,
                        companyIds: current.companyIds.includes(company.id)
                          ? current.companyIds.filter(
                              (companyId) => companyId !== company.id,
                            )
                          : [...current.companyIds, company.id],
                      }));
                    }}
                  />
                  {company.name}
                </label>
              ))}
              {companies.length === 0 && (
                <p className="text-600 m-0">No companies are available.</p>
              )}
            </fieldset>
          )}
          <div className="flex flex-column sm:flex-row gap-2">
            <button
              className="flex-1 p-2 border-1 border-round-md cursor-pointer"
              type="submit"
            >
              {editingId ? "Save changes" : "Create customer"}
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Company",
                ...(can("customers", "update") || can("customers", "delete")
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
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                  {customer.name}
                </td>
                <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                  {customer.email}
                </td>
                <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                  {customer.phone}
                </td>
                <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                  {customer.companies.map((company) => company.name).join(", ") ||
                    "No company assigned"}
                </td>
                {(can("customers", "update") || can("customers", "delete")) && (
                <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                  <div className="flex flex-column sm:flex-row gap-2">
                    {can("customers", "update") && <button
                      className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                      type="button"
                      onClick={() => edit(customer)}
                    >
                      Edit
                    </button>}
                    {can("customers", "delete") && <button
                      className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                      type="button"
                      onClick={() => void remove(customer)}
                    >
                      Delete
                    </button>}
                  </div>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CustomersAdmin;
