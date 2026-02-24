// frontend/src/pages/LoginPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { IoLogoIonitron } from "react-icons/io";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState } from "react";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      // Navigation is handled by the context on success
    } catch (error) {
      setIsSubmitting(false); // Re-enable form on failure
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] p-4">
      <div className="w-full max-w-sm p-8 space-y-8 bg-[#1e293b] rounded-xl shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-2xl font-bold text-white">
            <IoLogoIonitron className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
            <p className="text-gray-400">Sign in to access your dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <FaEnvelope className="text-gray-500" />
              </span>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-11 pr-4 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <FaLock className="text-gray-500" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-11 pr-10 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 cursor-pointer text-gray-500 hover:text-white"
              >
                {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
              </span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-blue-500 transition-colors duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging In..." : "Log In"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-400 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
