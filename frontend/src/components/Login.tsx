import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { csrfToken, updateCsrfToken } from "../csrf";
import { loginUser } from "../config/api";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    const result = await loginUser(username, password, csrfToken);
  
    if (result.success) {
      updateCsrfToken();
      onLoginSuccess(result.data);
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
  
    setLoading(false);
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
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className="mb-4"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-white mb-2">
            Пароль
          </label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="mb-4"
          />
        </div>
        <Button
          type="submit"
          className={`w-full ${loading ? "bg-yellow-600" : "bg-yellow-500 hover:bg-yellow-600"} text-black font-medium border-0`}
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
        </Button>
      </form>
    </div>
  );
};

export default Login;
