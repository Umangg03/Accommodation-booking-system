import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../lib/api";

interface ResetPasswordResponse {
  message?: string | string[];
}

interface ResetPasswordForm {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_FORM: ResetPasswordForm = {
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ForgotPassword = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result: ResetPasswordResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : (result.message ?? "Unable to update password."),
        );
      }
      sessionStorage.clear();
      setForm(EMPTY_FORM);
      setSuccess(result.message ?? "Password updated successfully.");
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

  return (
    <main className="surface-ground min-h-screen flex align-items-center justify-content-center p-3">
      <section className="surface-card border-1 surface-border border-round-xl shadow-3 p-4 w-full md:w-30rem">
        <div className="flex align-items-center gap-2 text-teal-600 text-xl font-bold mb-4">
          <i className="fa-solid fa-bed" aria-hidden="true"></i>
          <span>Lodging</span>
        </div>
        <h1 className="text-indigo-900 text-2xl font-bold m-0 mb-2">
          Reset password
        </h1>
        <p className="text-600 text-sm m-0 mb-4">
          Enter your email and current password to choose a new password.
        </p>

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

        <form className="flex flex-column gap-3" onSubmit={submit}>
          <label className="flex flex-column gap-2" htmlFor="reset-email">
            Email
            <input
              id="reset-email"
              className="p-2 border-1 surface-border border-round-md"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-column gap-2" htmlFor="current-password">
            Current password
            <input
              id="current-password"
              className="p-2 border-1 surface-border border-round-md"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
          </label>
          <label className="flex flex-column gap-2" htmlFor="new-password">
            New password
            <input
              id="new-password"
              className="p-2 border-1 surface-border border-round-md"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={form.newPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
            />
          </label>
          <label className="flex flex-column gap-2" htmlFor="confirm-password">
            Confirm new password
            <input
              id="confirm-password"
              className="p-2 border-1 surface-border border-round-md"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
            />
          </label>
          <button
            className="bg-teal-600 text-white border-none border-round-md p-3 font-semibold cursor-pointer"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
        <Link className="block text-teal-700 no-underline mt-4" to="/">
          Back to sign in
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;
