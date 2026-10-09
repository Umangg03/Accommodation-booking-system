import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AccommodationsAdmin from "./accommodations.admin";
import CreateUser from "./create.user";
import CreateCompany from "./create.company";

const Admin = () => {
  const navigate = useNavigate();
  const [isUser, setIsUser] = useState(true);
  const [isCompany, setIsCompany] = useState(false);
  const [isAccommodation, setIsAccommodation] = useState(false);

  const handleUserView = () => {
    setIsUser((pre) => !pre);
    setIsCompany(false);
    setIsAccommodation(false);
  };
  const handleComapnyView = () => {
    setIsUser(false);
    setIsCompany((pre) => !pre);
    setIsAccommodation(false);
  };
  const handleAccommodationView = () => {
    setIsUser(false);
    setIsCompany(false);
    setIsAccommodation((pre) => !pre);
  };
  const signOut = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <>
      <header className="static flex align-items-center justify-content-between m-2 w-full">
        <h1 className="text-900 text-2xl font-bold">Admin Dashboard</h1>
      </header>

      <div className="grid nested-grid">
        <div className="col-2">
          <div>
            <div className="sidebar border-1 border-round border-top-none w-18rem flex flex-column align-items-center">
              <div className="links mt-5">
                <ul className="w-15rem h-auto flex justify-content-center align-items-center flex-wrap">
                  <li
                    className="w-12rem h-2rem bg-yellow-200 flex justify-content-center gap-3 align-items-center m-2 cursor-pointer"
                    onClick={handleUserView}
                  >
                    <i className="fa-solid fa-users"></i>Users
                  </li>
                  <li
                    className="w-12rem h-2rem bg-yellow-200 flex justify-content-center gap-3 align-items-center m-2 cursor-pointer"
                    onClick={handleComapnyView}
                  >
                    <i className="fa-solid fa-building"></i> Companies
                  </li>
                  <li
                    className="w-12rem h-2rem bg-yellow-200 flex justify-content-center gap-3 align-items-center m-2 cursor-pointer"
                    onClick={handleAccommodationView}
                  >
                    <i className="fa-solid fa-bed"></i> Accommodations
                  </li>
                </ul>
              </div>

              <div className="mt-auto mb-1 p-3 border-round w-15rem text-center">
                <button
                  className="cursor-pointer p-2 w-4 border-none border-round"
                  onClick={signOut}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-9 gap-5">
          <div className={isUser ? "" : "hidden"}>
            <CreateUser />
          </div>
          <div className={isCompany ? "" : "hidden"}>
            <CreateCompany />
          </div>
          <div className={isAccommodation ? "" : "hidden"}>
            <AccommodationsAdmin />
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
