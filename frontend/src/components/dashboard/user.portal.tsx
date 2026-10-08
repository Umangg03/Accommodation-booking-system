import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface Accommodation {
  id: number;
  description: string;
  price_per_night: number;
  accommodation_type?: { name: string };
  location?: { area: string; city: string; country: string };
}

interface Booking {
  id: number;
  check_in: string;
  cheek_out: string;
  status?: { name: string };
  accommodation: Accommodation;
}

interface ApiError {
  message?: string | string[];
}

const API_URL = "http://localhost:3000";
const TODAY = new Date().toISOString().slice(0, 10);

const getErrorMessage = (message: ApiError["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const UserPortal = () => {
  const navigate = useNavigate();
  const companyName = sessionStorage.getItem("company_name");
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] =
    useState<Accommodation | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadPortalData = async () => {
      const accessToken = sessionStorage.getItem("access_token");
      if (!accessToken) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [accommodationResponse, bookingsResponse] = await Promise.all([
          fetch(`${API_URL}/accommodations`),
          fetch(`${API_URL}/bookings`, { headers }),
        ]);
        const accommodationResult: Accommodation[] | ApiError =
          await accommodationResponse.json();
        const bookingResult: Booking[] | ApiError =
          await bookingsResponse.json();

        if (!accommodationResponse.ok) {
          throw new Error(
            getErrorMessage(
              (accommodationResult as ApiError).message,
              "Unable to load accommodations.",
            ),
          );
        }
        if (!Array.isArray(accommodationResult)) {
          throw new Error("The server returned an invalid accommodations response.");
        }
        if (!bookingsResponse.ok) {
          throw new Error(
            getErrorMessage(
              (bookingResult as ApiError).message,
              "Unable to load your bookings.",
            ),
          );
        }
        if (!Array.isArray(bookingResult)) {
          throw new Error("The server returned an invalid bookings response.");
        }

        setAccommodations(accommodationResult);
        setBookings(bookingResult);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the company workspace.",
        );
      }
    };

    void loadPortalData();
  }, [navigate]);

  const signOut = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("company_id");
    sessionStorage.removeItem("company_name");
    sessionStorage.removeItem("user_role");
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("user_email");
    navigate("/");
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccommodation) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          accommodationId: selectedAccommodation.id,
          checkIn,
          checkOut,
          phone,
        }),
      });
      const result: Booking | ApiError = await response.json();

      if (!response.ok) {
        setError(
          getErrorMessage(
            (result as ApiError).message,
            "Unable to create booking.",
          ),
        );
        return;
      }

      if (!("id" in result)) {
        setError("The server returned an invalid booking response.");
        return;
      }

      setBookings((current) => [result, ...current]);
      setSelectedAccommodation(null);
      setCheckIn("");
      setCheckOut("");
      setPhone("");
      setSuccess("Accommodation booked successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  return (
    <main className="surface-ground flex align-items-center justify-content-center gap-8 min-h-screen p-3">
      <section className="surface-card border-round-xl shadow-8 p-4 md:p-5 w-full md:w-8">
        <header className="flex align-items-center justify-content-between gap-3 mb-5">
          <div>
            <h1 className="text-900 text-2xl font-bold m-0 mb-2">
              {companyName || "User Portal"}
            </h1>
            <p className="text-600 m-0">Book an accommodation</p>
          </div>
          <button
            className="p-2 px-3 border-1 border-round-md cursor-pointer"
            type="button"
            onClick={signOut}
          >
            Sign out
          </button>
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

        <section className="flex flex-column gap-3">
          <h2 className="text-900 text-xl font-semibold m-0">
            Accommodations
          </h2>
          {accommodations.length === 0 ? (
            <p className="text-700 m-0">No accommodations are available.</p>
          ) : (
            accommodations.map((accommodation) => (
              <article
                className="surface-ground border-round-lg p-3"
                key={accommodation.id}
              >
                <div className="flex flex-wrap align-items-start justify-content-between gap-3">
                  <div>
                    <h3 className="text-900 text-lg font-semibold mt-0 mb-2">
                      {accommodation.accommodation_type?.name ??
                        `Accommodation ${accommodation.id}`}
                    </h3>
                    <p className="text-700 m-0 mb-2">
                      {accommodation.description}
                    </p>
                    {accommodation.location && (
                      <p className="text-600 m-0">
                        {[
                          accommodation.location.area,
                          accommodation.location.city,
                          accommodation.location.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <p className="text-900 font-semibold m-0 mt-2">
                      {accommodation.price_per_night} per night
                    </p>
                  </div>
                  <button
                    className="p-2 px-3 border-1 border-round-md cursor-pointer"
                    type="button"
                    onClick={() => {
                      setSelectedAccommodation(accommodation);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Book
                  </button>
                </div>

                {selectedAccommodation?.id === accommodation.id && (
                  <form
                    className="flex flex-column gap-3 mt-4"
                    onSubmit={submitBooking}
                  >
                    <div className="flex flex-wrap gap-3">
                      <div className="flex flex-column gap-2 flex-1">
                        <label htmlFor="check-in">Check-in</label>
                        <input
                          className="p-2 border-1 surface-border border-round-md"
                          id="check-in"
                          type="date"
                          min={TODAY}
                          required
                          value={checkIn}
                          onChange={(event) => setCheckIn(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-column gap-2 flex-1">
                        <label htmlFor="check-out">Check-out</label>
                        <input
                          className="p-2 border-1 surface-border border-round-md"
                          id="check-out"
                          type="date"
                          min={checkIn || TODAY}
                          required
                          value={checkOut}
                          onChange={(event) => setCheckOut(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-column gap-2">
                      <label htmlFor="phone">Contact phone</label>
                      <input
                        className="p-2 border-1 surface-border border-round-md"
                        id="phone"
                        type="tel"
                        minLength={7}
                        maxLength={20}
                        required
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="p-2 px-3 border-1 border-round-md cursor-pointer"
                        type="submit"
                      >
                        Confirm booking
                      </button>
                      <button
                        className="p-2 px-3 border-1 border-round-md cursor-pointer"
                        type="button"
                        onClick={() => setSelectedAccommodation(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))
          )}
        </section>

        <section className="flex flex-column gap-3 mt-5">
          <h2 className="text-900 text-xl font-semibold m-0">My bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-700 m-0">You have no bookings yet.</p>
          ) : (
            bookings.map((booking) => (
              <article
                className="surface-ground border-round-lg p-3"
                key={booking.id}
              >
                <h3 className="text-900 text-lg font-semibold m-0 mb-2">
                  {booking.accommodation.accommodation_type?.name ??
                    `Accommodation ${booking.accommodation.id}`}
                </h3>
                <p className="text-700 m-0">
                  {new Date(booking.check_in).toLocaleDateString()} –{" "}
                  {new Date(booking.cheek_out).toLocaleDateString()}
                </p>
                <p className="text-600 m-0 mt-1">
                  Status: {booking.status?.name ?? "Pending"}
                </p>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
};

export default UserPortal;
