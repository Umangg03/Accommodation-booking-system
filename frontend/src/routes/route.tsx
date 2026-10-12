import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import type { ReactNode } from "react";
import Dashboard from "../components/dashboard/Dashboard";
import Login from "../components/authentication/login";
import NotFound from "../components/dashboard/not-found";
import ForgotPassword from "../components/authentication/forgot-password";

function RequireAuth({ children }: { children: ReactNode }) {
  return sessionStorage.getItem("access_token") ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  { path: "/admin", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <NotFound /> },
]);

const Route = () => <RouterProvider router={router} />;

export default Route;
