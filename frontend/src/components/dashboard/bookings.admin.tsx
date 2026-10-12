import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch, API_URL } from "../../lib/api";
import {
  ACCOMMODATIONS_CHANGED_EVENT,
  CUSTOMERS_CHANGED_EVENT,
} from "../../lib/app-events";
import { usePermissions } from "../../auth/usePermissions";

interface Customer {
  id: number;
  name: string;
  email: string;
  companies: Company[];
}

interface Company {
  id: number;
  name: string;
}

interface Accommodation {
  id: number;
  accommodation_type?: { name: string };
  description: string;
  location?: { city: string; country: string };
}

interface BookingStatus {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  check_in: string;
  cheek_out: string;
  customer: Customer | null;
  company: Company | null;
  accommodation: Accommodation | null;
  status: BookingStatus | null;
}

interface BookingForm {
  companyId: string;
  customerId: string;
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  statusId: string;
}

interface ApiError {
  message?: string | string[];
}

const TODAY = new Date().toISOString().slice(0, 10);
const EMPTY_FORM: BookingForm = {
  companyId: "",
  customerId: "",
  accommodationId: "",
  checkIn: "",
  checkOut: "",
  statusId: "",
};

const getErrorMessage = (message: ApiError["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const toDateInput = (value: string) =>
  new Date(value).toISOString().slice(0, 10);

const getStatusName = (booking: Booking) => booking.status?.name ?? "Unknown";

const BookingsAdmin = () => {
  const { role, can } = usePermissions();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      throw new Error("Sign in is required to manage bookings.");
    }
    const headers = { Authorization: `Bearer ${token}` };
    const [
      bookingsResponse,
      customersResponse,
      accommodationsResponse,
      statusesResponse,
    ] = await Promise.all([
      apiFetch(`${API_URL}/bookings`, { headers }),
      can("customers", "view")
        ? apiFetch(`${API_URL}/customers`, { headers })
        : Promise.resolve(null),
      apiFetch(`${API_URL}/accommodations`),
      apiFetch(`${API_URL}/bookings/statuses`, { headers }),
    ]);
    const [
      bookingsResult,
      customersResult,
      accommodationsResult,
      statusesResult,
    ] = await Promise.all([
      bookingsResponse.json() as Promise<Booking[] | ApiError>,
      customersResponse
        ? (customersResponse.json() as Promise<Customer[] | ApiError>)
        : Promise.resolve([] as Customer[]),
      accommodationsResponse.json() as Promise<Accommodation[] | ApiError>,
      statusesResponse.json() as Promise<BookingStatus[] | ApiError>,
    ]);
    const responses = [
      [bookingsResponse, bookingsResult, "Unable to load bookings."],
      [
        accommodationsResponse,
        accommodationsResult,
        "Unable to load accommodations.",
      ],
      [statusesResponse, statusesResult, "Unable to load booking statuses."],
    ] as const;
    for (const [response, result, fallback] of responses) {
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            Array.isArray(result) ? undefined : result.message,
            fallback,
          ),
        );
      }
      if (!Array.isArray(result)) {
        throw new Error("The server returned invalid booking data.");
      }
    }
    if (!Array.isArray(customersResult)) {
      throw new Error("The server returned invalid customer data.");
    }

    if (role === "ADMIN") {
      const companiesResponse = await apiFetch(`${API_URL}/companies`, {
        headers,
      });
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

    setBookings(bookingsResult);
    setCustomers(customersResult);
    setAccommodations(accommodationsResult);
    setStatuses(statusesResult);
  }, [can, role]);

  useEffect(() => {
    void loadData()
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load bookings.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [loadData]);

  useEffect(() => {
    const refreshAccommodations = () => {
      void loadData().catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to refresh accommodations for bookings.",
        );
      });
    };
    window.addEventListener(
      ACCOMMODATIONS_CHANGED_EVENT,
      refreshAccommodations,
    );
    return () =>
      window.removeEventListener(
        ACCOMMODATIONS_CHANGED_EVENT,
        refreshAccommodations,
      );
  }, [loadData]);

  useEffect(() => {
    const refreshBookings = () => {
      void loadData().catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to refresh customers for bookings.",
        );
      });
    };
    window.addEventListener(CUSTOMERS_CHANGED_EVENT, refreshBookings);
    return () =>
      window.removeEventListener(CUSTOMERS_CHANGED_EVENT, refreshBookings);
  }, [loadData]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormVisible(false);
    setError("");
    setSuccess("");
  };

  const beginCreate = () => {
    setForm({
      ...EMPTY_FORM,
      statusId: String(
        statuses.find((status) => status.name.toLowerCase() === "pending")
          ?.id ??
          statuses[0]?.id ??
          "",
      ),
    });
    setEditingId(null);
    setIsFormVisible(true);
    setError("");
    setSuccess("");
  };

  const edit = (booking: Booking) => {
    if (!booking.customer || !booking.accommodation || !booking.status) {
      setError("This booking is missing required details and cannot be edited.");
      return;
    }
    setForm({
      companyId: String(booking.company?.id ?? ""),
      customerId: String(booking.customer.id),
      accommodationId: String(booking.accommodation.id),
      checkIn: toDateInput(booking.check_in),
      checkOut: toDateInput(booking.cheek_out),
      statusId: String(booking.status.id),
    });
    setEditingId(booking.id);
    setIsFormVisible(true);
    setError("");
    setSuccess("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Sign in is required to manage bookings.");
      return;
    }
    try {
      const response = await apiFetch(
        `${API_URL}/bookings${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(role === "ADMIN" ? { companyId: Number(form.companyId) } : {}),
            customerId: Number(form.customerId),
            accommodationId: Number(form.accommodationId),
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            ...(role === "ADMIN" ? { statusId: Number(form.statusId) } : {}),
          }),
        },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result.message,
            `Unable to ${editingId ? "update" : "create"} booking.`,
          ),
        );
      }
      await loadData();
      setIsFormVisible(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setSuccess(
        editingId
          ? "Booking updated successfully."
          : "Booking created successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save booking.",
      );
    }
  };

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking #${booking.id}?`)) {
      return;
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Sign in is required to manage bookings.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API_URL}/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(result.message, "Unable to cancel booking."));
      }
      await loadData();
      setSuccess("Booking canceled successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel booking.",
      );
    }
  };

  const confirmBooking = async (booking: Booking) => {
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `${API_URL}/bookings/${booking.id}/confirm`,
        { method: "PATCH" },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(result.message, "Unable to confirm booking."),
        );
      }
      await loadData();
      setSuccess(`Booking #${booking.id} confirmed successfully.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to confirm booking.",
      );
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const query = filterText.trim().toLowerCase();
    if (!query) return true;
    return [
      booking.customer?.name,
      booking.company?.name,
      booking.accommodation?.accommodation_type?.name,
      booking.accommodation?.description,
      booking.accommodation?.location?.city,
      getStatusName(booking),
      String(booking.id),
    ].some((value) => value?.toLowerCase().includes(query));
  });
  const availableCustomers =
    role === "ADMIN"
      ? customers.filter((customer) =>
          customer.companies.some(
            (company) => String(company.id) === form.companyId,
          ),
        )
      : customers;

  return (
    <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
      <header className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-900 text-xl font-bold m-0 mb-2">Bookings</h2>
          <p className="text-600 m-0">
            {bookings.length === 0
              ? "No bookings are available."
              : `Showing ${filteredBookings.length} of ${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {can("bookings", "create") && <button
          className="p-2 px-3 border-round border-none bg-green-700 text-white cursor-pointer sm:w-auto"
          type="button"
          onClick={() => (isFormVisible ? resetForm() : beginCreate())}
        >
          {isFormVisible ? "Cancel" : "Add booking"}
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

      <div className="flex flex-column gap-2 mb-3">
        <label htmlFor="booking-filter">Filter bookings</label>
        <input
          id="booking-filter"
          className="block p-2 border-1 surface-border border-round-md w-full md:w-20rem"
          type="search"
          placeholder="Customer, company, accommodation, status, or ID"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
        />
      </div>

      {isFormVisible && (
        <form
          className="surface-ground border-round-md p-3 md:p-4 mb-4 flex flex-column gap-3 max-w-30rem mx-auto"
          onSubmit={submit}
        >
          <h3 className="text-900 text-lg font-semibold m-0">
            {editingId ? "Edit booking" : "Create booking"}
          </h3>
          {role === "ADMIN" && (
            <div className="flex flex-column gap-2">
              <label htmlFor="booking-company">Company</label>
              <select
                id="booking-company"
                className="block p-2 border-1 surface-border border-round-md"
                required
                value={form.companyId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    companyId: event.target.value,
                    customerId: "",
                  }))
                }
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-column gap-2">
            <label htmlFor="booking-customer">Customer</label>
            <select
              id="booking-customer"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.customerId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customerId: event.target.value,
                }))
              }
            >
              <option value="">Select a customer</option>
              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="booking-accommodation">Accommodation</label>
            <select
              id="booking-accommodation"
              className="block p-2 border-1 surface-border border-round-md"
              required
              value={form.accommodationId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accommodationId: event.target.value,
                }))
              }
            >
              <option value="">Select an accommodation</option>
              {accommodations.map((accommodation) => (
                <option key={accommodation.id} value={accommodation.id}>
                  {accommodation.accommodation_type?.name ??
                    `Accommodation ${accommodation.id}`}
                  {accommodation.location?.city
                    ? ` - ${accommodation.location.city}, ${accommodation.location.country}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-column sm:flex-row gap-3">
            <div className="flex flex-column gap-2 flex-1">
              <label htmlFor="booking-check-in">Check-in</label>
              <input
                id="booking-check-in"
                className="block p-2 border-1 surface-border border-round-md"
                type="date"
                min={editingId ? undefined : TODAY}
                required
                value={form.checkIn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    checkIn: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-column gap-2 flex-1">
              <label htmlFor="booking-check-out">Check-out</label>
              <input
                id="booking-check-out"
                className="block p-2 border-1 surface-border border-round-md"
                type="date"
                min={editingId ? undefined : form.checkIn || TODAY}
                required
                value={form.checkOut}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    checkOut: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          {role === "ADMIN" ? (
            <div className="flex flex-column gap-2">
              <label htmlFor="booking-status">Status</label>
              <select
                id="booking-status"
                className="block p-2 border-1 surface-border border-round-md"
                required
                value={form.statusId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    statusId: event.target.value,
                  }))
                }
              >
                <option value="">Select a status</option>
                {statuses
                  .filter((status) => status.name.toLowerCase() !== "canceled")
                  .map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <p className="text-600 m-0">
              New bookings are submitted with Pending status for manager review.
            </p>
          )}
          <div className="flex flex-column sm:flex-row gap-2">
            <button
              className="flex-1 p-2 border-1 border-round-md cursor-pointer"
              type="submit"
              disabled={
                !availableCustomers.length ||
                !accommodations.length ||
                !statuses.length ||
                (role === "ADMIN" && !form.companyId)
              }
            >
              {editingId ? "Save changes" : "Create booking"}
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
        <p className="m-0">Loading bookings...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  "Customer",
                  "Company",
                  "Accommodation",
                  "Check-in",
                  "Check-out",
                  "Status",
                  ...(can("bookings", "update") ||
                  can("bookings", "confirm") ||
                  can("bookings", "cancel")
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
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {booking.customer?.name ?? "Customer unavailable"}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {booking.company?.name ?? "Company unavailable"}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {booking.accommodation?.accommodation_type?.name ??
                      (booking.accommodation
                        ? `Accommodation ${booking.accommodation.id}`
                        : "Accommodation unavailable")}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {new Date(booking.check_in).toLocaleDateString()}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {new Date(booking.cheek_out).toLocaleDateString()}
                  </td>
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    {getStatusName(booking)}
                  </td>
                  {(can("bookings", "update") ||
                    can("bookings", "confirm") ||
                    can("bookings", "cancel")) && (
                  <td className="border-1 border-solid surface-border p-2 md:px-4 md:py-2">
                    <div className="flex flex-column sm:flex-row gap-2">
                      {can("bookings", "confirm") &&
                        getStatusName(booking).toLowerCase() === "pending" && (
                          <button
                            className="p-2 border-round border-none bg-green-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => void confirmBooking(booking)}
                          >
                            Confirm
                          </button>
                        )}
                      {can("bookings", "update") &&
                        getStatusName(booking).toLowerCase() !== "canceled" && (
                        <button
                        className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                        type="button"
                        onClick={() => edit(booking)}
                      >
                        Edit
                        </button>
                      )}
                      {can("bookings", "cancel") &&
                        getStatusName(booking).toLowerCase() !== "canceled" && (
                      <button
                        className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                        type="button"
                        onClick={() => void cancelBooking(booking)}
                      >
                        Cancel
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

export default BookingsAdmin;
