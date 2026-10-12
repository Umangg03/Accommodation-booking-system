import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firstViewablePage } from "../../auth/permissions";
import { usePermissions } from "../../auth/usePermissions";
import AccommodationsAdmin from "./accommodations.admin";
import BookingsAdmin from "./bookings.admin";
import CustomersAdmin from "./customers.admin";
import CreateUser from "./create.user";
import CreateCompany from "./create.company";
import PermissionsAdmin from "./permissions.admin";

const btnBase =
  "border-none border-round-md p-3 w-full flex align-items-center justify-content-center lg:justify-content-start gap-2 cursor-pointer white-space-nowrap";

const ROLE_LABELS = {
  ADMIN: "Super Admin",
  MANAGER: "Company Manager",
  USER: "Company User",
} as const;

const Dashboard = () => {
  const navigate = useNavigate();
  const { role, can } = usePermissions();
  const firstPage = firstViewablePage(role);
  const [isUser, setIsUser] = useState(firstPage === "users");
  const [isCompany, setIsCompany] = useState(firstPage === "companies");
  const [isAccommodation, setIsAccommodation] = useState(
    firstPage === "accommodations",
  );
  const [isCustomer, setIsCustomer] = useState(firstPage === "customers");
  const [isBooking, setIsBooking] = useState(firstPage === "bookings");
  const [isPermissions, setIsPermissions] = useState(false);

  const handleUserView = () => {
    setIsUser(true);
    setIsCompany(false);
    setIsAccommodation(false);
    setIsCustomer(false);
    setIsBooking(false);
    setIsPermissions(false);
  };
  const handleCompanyView = () => {
    setIsUser(false);
    setIsCompany(true);
    setIsAccommodation(false);
    setIsCustomer(false);
    setIsBooking(false);
    setIsPermissions(false);
  };
  const handleAccommodationView = () => {
    setIsUser(false);
    setIsCompany(false);
    setIsAccommodation(true);
    setIsCustomer(false);
    setIsBooking(false);
    setIsPermissions(false);
  };
  const handleCustomerView = () => {
    setIsUser(false);
    setIsCompany(false);
    setIsAccommodation(false);
    setIsCustomer(true);
    setIsBooking(false);
    setIsPermissions(false);
  };
  const handleBookingView = () => {
    setIsUser(false);
    setIsCompany(false);
    setIsAccommodation(false);
    setIsCustomer(false);
    setIsBooking(true);
    setIsPermissions(false);
  };
  const handlePermissionsView = () => {
    setIsUser(false);
    setIsCompany(false);
    setIsAccommodation(false);
    setIsCustomer(false);
    setIsBooking(false);
    setIsPermissions(true);
  };
  const signOut = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const btnClass = (active: boolean) =>
    `${btnBase} ${active ? "bg-primary text-white" : "surface-ground"}`;
  const companyName = sessionStorage.getItem("company_name") ?? "Company";

  return (
    <div className="surface-ground min-h-screen">
      <header className="surface-card border-bottom-1 surface-border flex align-items-center justify-content-between gap-3 p-3 md:p-4">
        <div>
          <h1 className="text-900 text-2xl font-bold m-0">Dashboard</h1>
          <p className="text-600 m-0 mt-1">
            {companyName} - {role ? ROLE_LABELS[role] : "Unknown role"}
          </p>
        </div>
        <button
          className="surface-card text-900 border-1 surface-border border-round-md px-3 py-2 cursor-pointer"
          type="button"
          onClick={signOut}
        >
          Logout
        </button>
      </header>

      <div className="p-2 md:p-3">
        <div className="grid">
          <aside className="col-12 lg:col-2">
            <nav
              aria-label="Dashboard sections"
              className="surface-card border-1 surface-border border-round-md p-2"
            >
              <ul className="list-none p-0 m-0 flex flex-wrap lg:flex-column gap-2">
                {can("users", "view") && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isUser)}
                      onClick={handleUserView}
                      type="button"
                    >
                      <i className="fa-solid fa-users" aria-hidden="true"></i>
                      Users
                    </button>
                  </li>
                )}
                {can("companies", "view") && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isCompany)}
                      onClick={handleCompanyView}
                      type="button"
                    >
                      <i className="fa-solid fa-building" aria-hidden="true"></i>
                      Companies
                    </button>
                  </li>
                )}
                {can("accommodations", "view") && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isAccommodation)}
                      onClick={handleAccommodationView}
                      type="button"
                    >
                      <i className="fa-solid fa-bed" aria-hidden="true"></i>
                      Accommodations
                    </button>
                  </li>
                )}
                {can("customers", "view") && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isCustomer)}
                      onClick={handleCustomerView}
                      type="button"
                    >
                      <i
                        className="fa-solid fa-user-group"
                        aria-hidden="true"
                      ></i>
                      Customers
                    </button>
                  </li>
                )}
                {can("bookings", "view") && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isBooking)}
                      onClick={handleBookingView}
                      type="button"
                    >
                      <i
                        className="fa-solid fa-calendar-check"
                        aria-hidden="true"
                      ></i>
                      Bookings
                    </button>
                  </li>
                )}
                {role === "ADMIN" && (
                  <li className="flex-1 lg:flex-none">
                    <button
                      className={btnClass(isPermissions)}
                      onClick={handlePermissionsView}
                      type="button"
                    >
                      <i
                        className="fa-solid fa-shield-halved"
                        aria-hidden="true"
                      ></i>
                      Permissions
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </aside>

          <section className="col-12 lg:col-10 min-w-0">
            {firstPage === null && (
              <p className="surface-card border-1 surface-border border-round-md p-3 text-red-600">
                This account does not have access to any dashboard pages.
              </p>
            )}
            {can("users", "view") && (
              <div className={isUser ? "" : "hidden"}>
                <CreateUser />
              </div>
            )}
            {can("companies", "view") && (
              <div className={isCompany ? "" : "hidden"}>
                <CreateCompany />
              </div>
            )}
            {can("accommodations", "view") && (
              <div className={isAccommodation ? "" : "hidden"}>
                <AccommodationsAdmin />
              </div>
            )}
            {can("customers", "view") && (
              <div className={isCustomer ? "" : "hidden"}>
                <CustomersAdmin />
              </div>
            )}
            {can("bookings", "view") && (
              <div className={isBooking ? "" : "hidden"}>
                <BookingsAdmin />
              </div>
            )}
            {role === "ADMIN" && (
              <div className={isPermissions ? "" : "hidden"}>
                <PermissionsAdmin />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
