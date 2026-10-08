import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import type { ReactNode } from "react";
import Admin from '../components/dashboard/admin.tsx'
import  Login  from '../components/authentication/login.tsx'
import CreateCompany from "../components/dashboard/create.company.tsx";
import CreateUser from "../components/dashboard/create.user.tsx";
import UserPortal from "../components/dashboard/user.portal.tsx";
import AccommodationsAdmin from "../components/dashboard/accommodations.admin.tsx";

function RequireRole({
  role,
  children,
}: {
  role: "admin" | "user";
  children: ReactNode;
}) {
  const isSignedIn = Boolean(sessionStorage.getItem("access_token"));
  const currentRole = sessionStorage.getItem("user_role")?.toLowerCase();
  const isAllowed =
    isSignedIn &&
    (role === "admin" ? currentRole === "admin" : currentRole !== "admin");

  return isAllowed ? <>{children}</> : <Navigate to="/" replace />;
}

function AppLayout() {
  const role = sessionStorage.getItem("user_role")?.toLowerCase();
  const isSignedIn = Boolean(sessionStorage.getItem("access_token"));

  return (
    <>
      <nav className="flex  justify-content-center gap-4 p-4 bg-gray-200">
        {!isSignedIn && <Link to="/">Login</Link>}
        {isSignedIn && role === "admin" && (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <Link to="/create-company">Create Company</Link>
            <Link to="/create-user">Create User</Link>
            <Link to="/accommodations">Accommodations</Link>
          </>
        )}
        {isSignedIn && role !== "admin" && <Link to="/portal">User Portal</Link>}
      </nav>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Login/> },
      {
        path: "/admin",
        element: (
          <RequireRole role="admin">
            <Admin />
          </RequireRole>
        ),
      },
      {
        path: "/create-company",
        element: (
          <RequireRole role="admin">
            <CreateCompany />
          </RequireRole>
        ),
      },
      {
        path: "/create-user",
        element: (
          <RequireRole role="admin">
            <CreateUser />
          </RequireRole>
        ),
      },
      {
        path: "/accommodations",
        element: (
          <RequireRole role="admin">
            <AccommodationsAdmin />
          </RequireRole>
        ),
      },
      {
        path: "/portal",
        element: (
          <RequireRole role="user">
            <UserPortal />
          </RequireRole>
        ),
      },
    ],
  },
]);

const route = () => <RouterProvider router={router} />;

export default route;