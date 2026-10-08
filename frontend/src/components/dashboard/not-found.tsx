import { Link } from "react-router-dom";

const NotFound = () => {
  const isSignedIn = Boolean(sessionStorage.getItem("access_token"));
  const role = sessionStorage.getItem("user_role")?.toLowerCase();
  const dashboardPath = role === "admin" ? "/admin" : "/portal";

  return (
    <main className="surface-ground flex align-items-center justify-content-center min-h-screen p-3 md:p-5">
      <section
        aria-labelledby="not-found-title"
        className="surface-card border-round-2xl shadow-4 p-4 md:p-6 w-full md:w-8 lg:w-6 text-center"
      >
        <div
          aria-hidden="true"
          className="surface-ground border-circle flex align-items-center justify-content-center mx-auto mb-4"
          style={{ width: "6rem", height: "6rem" }}
        >
          <span className="text-primary text-5xl font-bold">?</span>
        </div>

        <p className="text-primary font-bold text-sm letter-spacing-1 mb-2">
          ERROR 404
        </p>
        <h1
          id="not-found-title"
          className="text-900 font-bold text-3xl md:text-5xl mt-0 mb-3"
        >
          This page wandered off
        </h1>
        <p className="text-600 text-lg line-height-3 mx-auto mt-0 mb-5" style={{ maxWidth: "30rem" }}>
          The link may be broken, or the page may have moved. Let’s get you back
          to somewhere familiar.
        </p>

        <div className="flex flex-column sm:flex-row justify-content-center gap-3">
          <Link
            to={isSignedIn ? dashboardPath : "/"}
            className="bg-primary text-white no-underline border-round-md font-semibold px-4 py-3 transition-colors transition-duration-150 hover:bg-primary-600"
          >
            {isSignedIn ? "Go to dashboard" : "Back to login"}
          </Link>
          <Link
            to="/"
            className="surface-card text-color no-underline border-1 surface-border border-round-md font-semibold px-4 py-3 transition-colors transition-duration-150 hover:surface-ground"
          >
            Go to home
          </Link>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
