//pages/SignUpPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { IoLogoIonitron } from "react-icons/io";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const SignUpPage = () => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: "", // Add username to state
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear the specific error when user starts typing
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username.trim()) {
      errors.username = "Username is required.";
    }

    if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        // Pass username to the signup function
        await signup(username, email, password);
      } catch (err) {
        setIsSubmitting(false);
      }
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
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400">Join us to start your first project</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <FaUser className="text-gray-500" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Choose a public username"
                value={username}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            {formErrors.username && (
              <p className="mt-1 text-xs text-red-400">{formErrors.username}</p>
            )}
          </div>
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
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
            )}
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
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-10 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 cursor-pointer text-gray-500 hover:text-white"
              >
                {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
              </span>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-xs text-red-400">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <FaLock className="text-gray-500" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-10 text-white bg-[#0f172a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 cursor-pointer text-gray-500 hover:text-white"
              >
                {showConfirmPassword ? (
                  <AiOutlineEye />
                ) : (
                  <AiOutlineEyeInvisible />
                )}
              </span>
            </div>
            {formErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-blue-500 transition-colors duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-400">
          Have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
