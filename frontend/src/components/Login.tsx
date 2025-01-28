import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { csrfToken, updateCsrfToken } from "../csrf";

interface User {
  id: number;
  username: string;
  email: string;
}

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getCsrfFromCookie = (): string | null => {
    const name = "csrftoken=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");

    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Start loading spinner
    try {
      const response = await fetch("http://localhost:8000/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (response.ok) {
        const newCsrfToken = getCsrfFromCookie();

        if (newCsrfToken) {
          updateCsrfToken();
        } else {
          console.warn("No CSRF token found in cookies after login");
        }

        const userData = await response.json(); // Get user data from the response
        onLoginSuccess(userData); // Pass the user data to the parent
        navigate("/");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-emerald-700/50 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full"
      >
        <h2 className="text-white text-3xl font-semibold mb-6 text-center">
          Вхід
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="username" className="block text-white mb-2">
            Логін
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-white mb-2">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full ${
            loading ? "bg-yellow-600" : "bg-yellow-500 hover:bg-yellow-600"
          } text-black font-medium px-4 py-2 rounded-lg`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Завантаження...
            </span>
          ) : (
            "Увійти"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
