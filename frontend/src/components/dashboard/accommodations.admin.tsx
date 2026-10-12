import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch, API_URL } from "../../lib/api";
import { ACCOMMODATIONS_CHANGED_EVENT } from "../../lib/app-events";
import { usePermissions } from "../../auth/usePermissions";

interface AccommodationType {
  id: number;
  name: string;
  description: string;
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

interface AccommodationTypeForm {
  name: string;
  description: string;
}

interface LocationForm {
  area: string;
  city: string;
  country: string;
}

interface ApiError {
  message?: string | string[];
}

const emptyForm: AccommodationForm = {
  description: "",
  price_per_night: "",
  accommodationTypeId: "",
  locationId: "",
};
const emptyTypeForm: AccommodationTypeForm = { name: "", description: "" };
const emptyLocationForm: LocationForm = { area: "", city: "", country: "" };

const errorMessage = (message: ApiError["message"], fallback: string) =>
  Array.isArray(message) ? message.join(", ") : (message ?? fallback);

const AccommodationsAdmin = () => {
  const { can } = usePermissions();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<AccommodationForm>(emptyForm);
  const [typeForm, setTypeForm] =
    useState<AccommodationTypeForm>(emptyTypeForm);
  const [locationForm, setLocationForm] =
    useState<LocationForm>(emptyLocationForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdd, setIsAdd] = useState(false);
  const [isTypeFormVisible, setIsTypeFormVisible] = useState(false);
  const [isLocationFormVisible, setIsLocationFormVisible] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsAdd(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
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
      setSuccess(
        editingId ? "Accommodation updated." : "Accommodation created.",
      );
      await loadData();
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  const edit = (accommodation: Accommodation) => {
    setIsAdd(true);
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
      const response = await apiFetch(`${API_URL}/accommodations/${id}`, {
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
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    }
  };

  const submitType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `${API_URL}/accommodations/types${editingTypeId ? `/${editingTypeId}` : ""}`,
        {
          method: editingTypeId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: typeForm.name.trim(),
            description: typeForm.description.trim(),
          }),
        },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(result.message, "Unable to save type."));
      }
      setTypeForm(emptyTypeForm);
      setEditingTypeId(null);
      setIsTypeFormVisible(false);
      setSuccess(
        editingTypeId ? "Accommodation type updated." : "Accommodation type created.",
      );
      await loadData();
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save accommodation type.",
      );
    }
  };

  const editType = (type: AccommodationType) => {
    setTypeForm({ name: type.name, description: type.description });
    setEditingTypeId(type.id);
    setIsTypeFormVisible(true);
    setError("");
    setSuccess("");
  };

  const removeType = async (type: AccommodationType) => {
    if (!window.confirm(`Delete accommodation type ${type.name}?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `${API_URL}/accommodations/types/${type.id}`,
        { method: "DELETE" },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(result.message, "Unable to delete type."));
      }
      setSuccess("Accommodation type deleted.");
      await loadData();
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete accommodation type.",
      );
    }
  };

  const submitLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `${API_URL}/location${editingLocationId ? `/${editingLocationId}` : ""}`,
        {
          method: editingLocationId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area: locationForm.area.trim(),
            city: locationForm.city.trim(),
            country: locationForm.country.trim(),
          }),
        },
      );
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(result.message, "Unable to save location."));
      }
      setLocationForm(emptyLocationForm);
      setEditingLocationId(null);
      setIsLocationFormVisible(false);
      setSuccess(
        editingLocationId ? "Location updated." : "Location created.",
      );
      await loadData();
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save location.",
      );
    }
  };

  const editLocation = (location: Location) => {
    setLocationForm({
      area: location.area,
      city: location.city,
      country: location.country,
    });
    setEditingLocationId(location.id);
    setIsLocationFormVisible(true);
    setError("");
    setSuccess("");
  };

  const removeLocation = async (location: Location) => {
    if (!window.confirm(`Delete location ${location.city}?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API_URL}/location/${location.id}`, {
        method: "DELETE",
      });
      const result: ApiError = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(result.message, "Unable to delete location."));
      }
      setSuccess("Location deleted.");
      await loadData();
      window.dispatchEvent(new Event(ACCOMMODATIONS_CHANGED_EVENT));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete location.",
      );
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [accommodationResponse, typeResponse, locationResponse] =
        await Promise.all([
          apiFetch(`${API_URL}/accommodations`),
          apiFetch(`${API_URL}/accommodations/types`),
          apiFetch(`${API_URL}/location`),
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
          errorMessage(
            typeResult.message,
            "Unable to load accommodation types.",
          ),
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

  return (
    <section className="surface-card border-1 surface-border border-round-lg p-3 md:p-4">
      <header className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-900 text-xl font-bold m-0 mb-2">Accommodations</h2>
          <p className="text-600 m-0">
            {accommodations.length === 0
              ? "No accommodations are available."
              : `${accommodations.length} accommodation${accommodations.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {can("accommodations", "create") && <button
          className="p-2 px-3 border-round border-none bg-green-700 text-white cursor-pointer sm:w-auto"
          type="button"
          onClick={() => {
            if (isAdd) {
              resetForm();
              return;
            }
            setIsAdd(true);
            setEditingId(null);
            setForm(emptyForm);
            setError("");
            setSuccess("");
          }}
        >
          {isAdd ? (
            "Cancel"
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> Add Accommodation
            </>
          )}
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
      <main className={isAdd ? "w-full max-w-30rem mx-auto" : "hidden"}>
        <header className="text-center mb-5">
          <h1 className="text-900 text-2xl font-bold m-0 mb-2">
            {editingId ? "Update Accommodation" : "Create Accommodation"}
          </h1>
        </header>
        <form className="flex flex-column gap-3 p-3" onSubmit={submit}>
          <div className="flex flex-column gap-2">
            <label htmlFor="accommodation-description">Description</label>
            <input
              className="block p-2 border-1 surface-border border-round-md"
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
              className="block p-2 border-1 surface-border border-round-md"
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
              className="block p-2 border-1 surface-border border-round-md"
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
              className="block p-2 border-1 surface-border border-round-md"
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

          <div className="flex flex-column sm:flex-row gap-2">
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
      </main>
      <div className={isAdd ? "hidden" : ""}>
        <section className="flex flex-column gap-3 mt-5">
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
                <div className="flex flex-column sm:flex-row flex-wrap justify-content-between gap-3">
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
                  {(can("accommodations", "update") ||
                    can("accommodations", "delete")) && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    {can("accommodations", "update") && <button
                      className="p-2 px-3 border-1 border-round-md cursor-pointer flex-1 sm:flex-none"
                      type="button"
                      onClick={() => edit(accommodation)}
                    >
                      Edit
                    </button>}
                    {can("accommodations", "delete") && <button
                      className="p-2 px-3 border-1 border-round-md cursor-pointer flex-1 sm:flex-none"
                      type="button"
                      onClick={() => void remove(accommodation.id)}
                    >
                      Delete
                    </button>}
                  </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
      <div className="grid mt-2">
        <section className="col-12 lg:col-6">
          <div className="surface-ground border-round-md p-3">
            <header className="flex align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="text-900 text-lg font-semibold m-0">
                  Accommodation types
                </h3>
                <p className="text-600 m-0 mt-1">
                  {types.length} type{types.length === 1 ? "" : "s"}
                </p>
              </div>
              {can("accommodations", "create") && (
                <button
                  className="p-2 border-round border-none bg-green-700 text-white cursor-pointer"
                  type="button"
                  onClick={() => {
                    setTypeForm(emptyTypeForm);
                    setEditingTypeId(null);
                    setIsTypeFormVisible((visible) => !visible);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {isTypeFormVisible ? "Close" : "Add type"}
                </button>
              )}
            </header>
            {isTypeFormVisible && (
              <form
                className="surface-card border-round-md p-3 mb-3 flex flex-column gap-2"
                onSubmit={submitType}
              >
                <label htmlFor="type-name">Name</label>
                <input
                  id="type-name"
                  className="block p-2 border-1 surface-border border-round-md"
                  required
                  value={typeForm.name}
                  onChange={(event) =>
                    setTypeForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <label htmlFor="type-description">Description</label>
                <textarea
                  id="type-description"
                  className="block p-2 border-1 surface-border border-round-md"
                  required
                  value={typeForm.description}
                  onChange={(event) =>
                    setTypeForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 p-2 border-1 border-round-md cursor-pointer"
                    type="submit"
                  >
                    {editingTypeId ? "Save changes" : "Create type"}
                  </button>
                  <button
                    className="p-2 border-1 border-round-md cursor-pointer"
                    type="button"
                    onClick={() => {
                      setTypeForm(emptyTypeForm);
                      setEditingTypeId(null);
                      setIsTypeFormVisible(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="flex flex-column gap-2">
              {types.length === 0 ? (
                <p className="text-600 m-0">No accommodation types yet.</p>
              ) : (
                types.map((type) => (
                  <article
                    className="surface-card border-1 surface-border border-round-md p-2 flex flex-column sm:flex-row justify-content-between gap-2"
                    key={type.id}
                  >
                    <div>
                      <p className="text-900 font-semibold m-0">{type.name}</p>
                      <p className="text-600 m-0 mt-1">{type.description}</p>
                    </div>
                    {(can("accommodations", "update") ||
                      can("accommodations", "delete")) && (
                      <div className="flex gap-2">
                        {can("accommodations", "update") && (
                          <button
                            className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => editType(type)}
                          >
                            Edit
                          </button>
                        )}
                        {can("accommodations", "delete") && (
                          <button
                            className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => void removeType(type)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="col-12 lg:col-6">
          <div className="surface-ground border-round-md p-3">
            <header className="flex align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="text-900 text-lg font-semibold m-0">Locations</h3>
                <p className="text-600 m-0 mt-1">
                  {locations.length} location{locations.length === 1 ? "" : "s"}
                </p>
              </div>
              {can("accommodations", "create") && (
                <button
                  className="p-2 border-round border-none bg-green-700 text-white cursor-pointer"
                  type="button"
                  onClick={() => {
                    setLocationForm(emptyLocationForm);
                    setEditingLocationId(null);
                    setIsLocationFormVisible((visible) => !visible);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {isLocationFormVisible ? "Close" : "Add location"}
                </button>
              )}
            </header>
            {isLocationFormVisible && (
              <form
                className="surface-card border-round-md p-3 mb-3 flex flex-column gap-2"
                onSubmit={submitLocation}
              >
                <label htmlFor="location-area">Area</label>
                <input
                  id="location-area"
                  className="block p-2 border-1 surface-border border-round-md"
                  required
                  value={locationForm.area}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
                />
                <label htmlFor="location-city">City</label>
                <input
                  id="location-city"
                  className="block p-2 border-1 surface-border border-round-md"
                  required
                  value={locationForm.city}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                />
                <label htmlFor="location-country">Country</label>
                <input
                  id="location-country"
                  className="block p-2 border-1 surface-border border-round-md"
                  required
                  value={locationForm.country}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 p-2 border-1 border-round-md cursor-pointer"
                    type="submit"
                  >
                    {editingLocationId ? "Save changes" : "Create location"}
                  </button>
                  <button
                    className="p-2 border-1 border-round-md cursor-pointer"
                    type="button"
                    onClick={() => {
                      setLocationForm(emptyLocationForm);
                      setEditingLocationId(null);
                      setIsLocationFormVisible(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="flex flex-column gap-2">
              {locations.length === 0 ? (
                <p className="text-600 m-0">No locations yet.</p>
              ) : (
                locations.map((location) => (
                  <article
                    className="surface-card border-1 surface-border border-round-md p-2 flex flex-column sm:flex-row justify-content-between gap-2"
                    key={location.id}
                  >
                    <p className="text-900 m-0">
                      {[location.area, location.city, location.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {(can("accommodations", "update") ||
                      can("accommodations", "delete")) && (
                      <div className="flex gap-2">
                        {can("accommodations", "update") && (
                          <button
                            className="p-2 border-round border-none bg-primary-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => editLocation(location)}
                          >
                            Edit
                          </button>
                        )}
                        {can("accommodations", "delete") && (
                          <button
                            className="p-2 border-round border-none bg-red-700 text-white cursor-pointer"
                            type="button"
                            onClick={() => void removeLocation(location)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default AccommodationsAdmin;
