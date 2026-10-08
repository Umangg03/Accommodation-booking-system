import { useCallback, useEffect, useState, type FormEvent } from "react";

interface AccommodationType {
  id: number;
  name: string;
}

interface Location {
  id: number;
  area: string;
  city: string;
  country: string;
}

interface Accommodation {
  id: number;
  description: string;
  price_per_night: number;
  accommodation_type: AccommodationType;
  location: Location;
}

interface AccommodationForm {
  description: string;
  price_per_night: string;
  accommodationTypeId: string;
  locationId: string;
}

interface ApiError {
  message?: string | string[];
}

const API_URL = "http://localhost:3000";
const emptyForm: AccommodationForm = {
  description: "",
  price_per_night: "",
  accommodationTypeId: "",
  locationId: "",
};

const errorMessage = (message: ApiError["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const AccommodationsAdmin = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<AccommodationForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [accommodationResponse, typeResponse, locationResponse] =
        await Promise.all([
          fetch(`${API_URL}/accommodations`),
          fetch(`${API_URL}/accommodations/types`),
          fetch(`${API_URL}/location`),
        ]);
      const accommodationResult = await accommodationResponse.json();
      const typeResult = await typeResponse.json();
      const locationResult = await locationResponse.json();

      if (!accommodationResponse.ok) {
        throw new Error(
          errorMessage(
            accommodationResult.message,
            "Unable to load accommodations.",
          ),
        );
      }
      if (!typeResponse.ok) {
        throw new Error(
          errorMessage(typeResult.message, "Unable to load accommodation types."),
        );
      }
      if (!locationResponse.ok) {
        throw new Error(
          errorMessage(locationResult.message, "Unable to load locations."),
        );
      }
      if (
        !Array.isArray(accommodationResult) ||
        !Array.isArray(typeResult) ||
        !Array.isArray(locationResult)
      ) {
        throw new Error("The server returned invalid accommodation data.");
      }

      setAccommodations(accommodationResult);
      setTypes(typeResult);
      setLocations(locationResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load accommodation data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/accommodations${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            ...form,
            price_per_night: Number(form.price_per_night),
            accommodationTypeId: Number(form.accommodationTypeId),
            locationId: Number(form.locationId),
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setError(errorMessage(result.message, "Unable to save accommodation."));
        return;
      }

      resetForm();
      setSuccess(editingId ? "Accommodation updated." : "Accommodation created.");
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  const edit = (accommodation: Accommodation) => {
    setEditingId(accommodation.id);
    setForm({
      description: accommodation.description,
      price_per_night: String(accommodation.price_per_night),
      accommodationTypeId: String(accommodation.accommodation_type.id),
      locationId: String(accommodation.location.id),
    });
    setError("");
    setSuccess("");
  };

  const remove = async (id: number) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/accommodations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
      });
      const result: ApiError = await response.json();
      if (!response.ok) {
        setError(
          errorMessage(result.message, "Unable to delete accommodation."),
        );
        return;
      }

      if (editingId === id) {
        resetForm();
      }
      setSuccess("Accommodation deleted.");
      await loadData();
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
        <header className="text-center mb-5">
          <h1 className="text-900 text-2xl font-bold m-0 mb-2">
            {editingId ? "Update Accommodation" : "Create Accommodation"}
          </h1>
        </header>

        <form className="flex flex-column gap-3 p-3" onSubmit={submit}>
          <div className="flex flex-column gap-2">
            <label htmlFor="accommodation-description">Description</label>
            <input
              className="p-2 border-1 surface-border border-round-md"
              id="accommodation-description"
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="price-per-night">Price per night</label>
            <input
              className="p-2 border-1 surface-border border-round-md"
              id="price-per-night"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price_per_night}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_per_night: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="accommodation-type">Accommodation type</label>
            <select
              className="p-2 border-1 surface-border border-round-md"
              id="accommodation-type"
              required
              value={form.accommodationTypeId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accommodationTypeId: event.target.value,
                }))
              }
            >
              <option value="">Select a type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="accommodation-location">Location</label>
            <select
              className="p-2 border-1 surface-border border-round-md"
              id="accommodation-location"
              required
              value={form.locationId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  locationId: event.target.value,
                }))
              }
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {[location.area, location.city, location.country]
                    .filter(Boolean)
                    .join(", ")}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-600 m-0" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-700 m-0" role="status">
              {success}
            </p>
          )}

          <div className="flex gap-2">
            <button
              className="flex-1 p-3 border-1 border-round-md font-semibold cursor-pointer"
              type="submit"
              disabled={!types.length || !locations.length}
            >
              {editingId ? "Save changes" : "Create"}
            </button>
            {editingId !== null && (
              <button
                className="p-3 border-1 border-round-md cursor-pointer"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="flex flex-column gap-3 mt-5">
          <h2 className="text-900 text-xl font-semibold m-0">
            Accommodations
          </h2>
          {isLoading ? (
            <p className="m-0">Loading accommodations...</p>
          ) : accommodations.length === 0 ? (
            <p className="m-0">No accommodations have been created.</p>
          ) : (
            accommodations.map((accommodation) => (
              <article
                className="surface-ground border-round-lg p-3"
                key={accommodation.id}
              >
                <div className="flex flex-wrap justify-content-between gap-3">
                  <div>
                    <h3 className="text-900 text-lg font-semibold m-0 mb-2">
                      {accommodation.accommodation_type?.name ??
                        `Accommodation ${accommodation.id}`}
                    </h3>
                    <p className="text-700 m-0 mb-2">
                      {accommodation.description}
                    </p>
                    <p className="text-600 m-0">
                      {accommodation.location
                        ? [
                            accommodation.location.area,
                            accommodation.location.city,
                            accommodation.location.country,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "Location not set"}
                    </p>
                    <p className="text-900 font-semibold m-0 mt-2">
                      {accommodation.price_per_night} per night
                    </p>
                  </div>
                  <div className="flex align-items-start gap-2">
                    <button
                      className="p-2 px-3 border-1 border-round-md cursor-pointer"
                      type="button"
                      onClick={() => edit(accommodation)}
                    >
                      Edit
                    </button>
                    <button
                      className="p-2 px-3 border-1 border-round-md cursor-pointer"
                      type="button"
                      onClick={() => void remove(accommodation.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
};

export default AccommodationsAdmin;
