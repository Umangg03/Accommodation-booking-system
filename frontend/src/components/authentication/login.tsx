import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface LoginForm {
  email: string;
  password: string;
}

interface SignInResponse {
  access_token?: string;
  refresh_token?: string;
  companies?: Company[];
  company?: Company;
  role?: string;
  user?: { name: string; email: string };
  message?: string | string[];
}

interface Company {
  id: number;
  name: string;
}

const Login = () => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [error, setError] = useState("");
  const [isSelectingCompany, setIsSelectingCompany] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const body = isSelectingCompany
        ? { ...form, companyId: Number(selectedCompanyId) }
        : form;
      const response = await fetch(`http://localhost:3000/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: SignInResponse = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Sign-in failed"),
        );
        return;
      }

      if (!isSelectingCompany) {
        if (!result.companies?.length) {
          setError("Your account is not assigned to any companies.");
          return;
        }
        setCompanies(result.companies);
        setSelectedCompanyId(String(result.companies[0].id));
        setIsSelectingCompany(true);
        return;
      }

      if (!result.access_token || !result.refresh_token) {
        setError("The server response did not include the required tokens.");
        return;
      }
      if (!result.company) {
        setError("The server response did not include the selected company.");
        return;
      }
      if (!result.role) {
        setError("The server response did not include the user role.");
        return;
      }

      sessionStorage.setItem("access_token", result.access_token);
      sessionStorage.setItem("refresh_token", result.refresh_token);
      sessionStorage.setItem("company_id", String(result.company.id));
      sessionStorage.setItem("company_name", result.company.name);
      sessionStorage.setItem("user_role", result.role);
      sessionStorage.setItem("user_name", result.user?.name ?? "");
      sessionStorage.setItem("user_email", result.user?.email ?? form.email);
      setForm(() => ({ email: "", password: "" }));
      navigate(result.role.toLowerCase() === "admin" ? "/admin" : "/portal");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  return (
    <>
    <main className="surface-ground flex align-items-center justify-content-between min-h-screen">
      <section className="border-round-xl p-4 md:p-5 w-full md:w-30rem">
        <header className="text-center mb-5">
          <h1 className="text-900 text-2xl font-bold m-0 mb-2">
            {isSelectingCompany ? "Choose a company" : "Welcome back"}
          </h1>
          <p className="text-900 m-0">
            {isSelectingCompany
              ? "Select the company you want to continue to."
              : "Sign in to continue to your account."}
          </p>
        </header>

        <form className="flex flex-column gap-4 p-3" onSubmit={handleSubmit}>
          {!isSelectingCompany ? (
            <>
              <div className="flex flex-column gap-2">
                <label className="text-900 font-medium" htmlFor="email">
                  Email address
                </label>
                <input
                  className="p-3 border-1 surface-border border-round-md"
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter Your email"
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
                <label className="text-900 font-medium" htmlFor="password">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 min-w-0 p-3 border-1 surface-border border-round-md"
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                  <button
                    className="border-1 surface-border border-round-md bg-white px-3 cursor-pointer"
                    type="button"
                    onClick={() =>
                      setIsPasswordVisible((visible) => !visible)
                    }
                  >
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-column gap-2">
              <label className="text-900 font-medium" htmlFor="company-select">
                Company
              </label>
              <select
                className="p-3 border-1 surface-border border-round-md"
                id="company-select"
                required
                value={selectedCompanyId}
                onChange={(event) => setSelectedCompanyId(event.target.value)}
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="w-full p-3 border-1 border-round-md font-semibold cursor-pointer"
            type="submit"
          >
            {isSelectingCompany ? "Continue" : "Sign in"}
          </button>
          {isSelectingCompany && (
            <button
              className="w-full p-3 border-1 border-round-md cursor-pointer"
              type="button"
              onClick={() => {
                setIsSelectingCompany(false);
                setCompanies([]);
                setSelectedCompanyId("");
                setError("");
              }}
            >
              Back
            </button>
          )}
          {error && (
            <p className="text-red-600 m-0" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
          <div className="col-5 align-items-center justify-content-center w-full">
                          <img
                            src="/assets/thailand.jpg"
                            alt="Integration illustration"
                            className="w-full h-auto"
                          />
            </div>
    </main>
    </>
  );
};

export default Login;
