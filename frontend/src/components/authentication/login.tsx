import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

interface LoginForm {
  email: string;
  password: string;
}

interface Company {
  id: number;
  name: string;
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

const BRAND_NAME = "Lodging";
const REMEMBER_KEY = "remembered_email";

const fieldWrap = "relative flex";
const labelCls = "absolute top-0 left-0 mt-2 ml-3 text-xs text-500";
const inputCls =
  "flex-1 min-w-0 pt-4 pb-2 px-3 border-1 surface-border border-round-md surface-card text-900";
const primaryBtn =
  "bg-teal-600 hover:bg-teal-700 text-white border-none border-round-md px-5 py-3 font-semibold shadow-2";
const outlineBtn =
  "bg-transparent text-teal-600 border-1 border-teal-600 border-round-md px-5 py-3 font-semibold cursor-pointer";

const getRememberedEmail = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
};

const Login = () => {
  const [form, setForm] = useState<LoginForm>(() => ({
    email: getRememberedEmail(),
    password: "",
  }));
  const [rememberMe, setRememberMe] = useState(() => getRememberedEmail() !== "");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [error, setError] = useState("");
  const [isSelectingCompany, setIsSelectingCompany] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

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

      if (!isSelectingCompany && !result.access_token) {
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

      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, form.email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {}

      setForm({ email: "", password: "" });
      navigate("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToCredentials = () => {
    setIsSelectingCompany(false);
    setCompanies([]);
    setSelectedCompanyId("");
    setError("");
  };

  return (
    <main className="surface-ground min-h-screen flex align-items-center justify-content-center p-2 md:p-4">
      <div className="surface-card flex w-full xl:w-10 mx-auto border-4 border-teal-900 border-round-2xl shadow-4 overflow-hidden">
        <section className="w-full lg:w-5 xl:w-4 flex flex-column justify-content-between gap-5 px-4 md:px-6 py-5 md:py-6">
          <div className="flex align-items-center gap-2 text-teal-600 text-xl font-bold">
            <i className="fa-solid fa-bed" aria-hidden="true"></i>
            <span>{BRAND_NAME}</span>
          </div>

          <div>
            <h1 className="text-indigo-900 text-3xl md:text-4xl font-bold m-0 mb-2">
              {isSelectingCompany ? "Choose a company" : "Welcome back!"}
            </h1>
            <p className="text-600 text-sm m-0 mb-5">
              {isSelectingCompany
                ? "Select the company you want to continue to."
                : "Please log in to your account."}
            </p>

            <form className="flex flex-column gap-3" onSubmit={handleSubmit}>
              {!isSelectingCompany ? (
                <>
                  <div className={fieldWrap}>
                    <label className={labelCls} htmlFor="email">
                      Email address
                    </label>
                    <input
                      className={inputCls}
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((cur) => ({ ...cur, email: e.target.value }))
                      }
                    />
                  </div>

                  <div className={fieldWrap}>
                    <label className={labelCls} htmlFor="password">
                      Password
                    </label>
                    <input
                      className={`${inputCls} pr-6`}
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm((cur) => ({ ...cur, password: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 h-full px-3 border-none bg-transparent text-500 cursor-pointer"
                      aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                      onClick={() => setIsPasswordVisible((v) => !v)}
                    >
                      <i
                        className={`fa-solid ${isPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>

                  <div className="flex align-items-center justify-content-between text-sm">
                    <Link
                      className="text-red-500 no-underline"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </>
              ) : (
                <div className={fieldWrap}>
                  <label className={labelCls} htmlFor="company-select">
                    Company
                  </label>
                  <select
                    className={inputCls}
                    id="company-select"
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm m-0" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className={`${primaryBtn} ${
                    isSubmitting ? "opacity-60" : "cursor-pointer"
                  }`}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Please wait..."
                    : isSelectingCompany
                      ? "Continue"
                      : "Login"}
                </button>
                {isSelectingCompany && (
                  <button
                    className={outlineBtn}
                    type="button"
                    onClick={goBackToCredentials}
                  >
                    Back
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="text-500 text-xs line-height-3 m-0">
            By signing in you agree to our terms and confirm that you have read
            our data policy.
          </p>
        </section>

        <aside className="hidden lg:block relative flex-1 bg-teal-900">
          <img
            src="/assets/thailand.jpg"
            alt=""
            className="absolute top-0 left-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        </aside>
      </div>
    </main>
  );
};

export default Login;