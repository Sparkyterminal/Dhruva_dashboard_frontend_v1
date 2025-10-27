import React from "react";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { logout } from "../../reducers/users";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Welcome to Home
        </h1>
        <p className="text-gray-500 mb-8 text-center">
          Easily manage your requirements using the actions below.
        </p>
        <div className="flex flex-col space-y-4 w-full">
          <button
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded shadow transition duration-200"
            onClick={() => navigate("/user/sendrequest")}
          >
            Send Requirements
          </button>
          <button
            className="bg-white border border-indigo-400 hover:bg-indigo-100 text-indigo-600 font-semibold py-3 px-6 rounded shadow transition duration-200"
            onClick={() => navigate("/user/viewrequests")}
          >
            View All Requirements
          </button>
          {/* Logout Button */}
          <button
            className="bg-red-600 hover:bg-red-800 text-white font-semibold py-3 px-6 rounded shadow transition duration-200 flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogoutOutlined className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
