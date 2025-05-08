import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { X } from "lucide-react";
import { registerUser } from "../config/api";
import { updateCsrfToken } from "../csrf";

interface User {
  id: number;
  username: string;
  email: string;
}

interface RegisterProps {
  onRegisterSuccess: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        email: "",
    });
    
    const [notification, setNotification] = useState<{
        type: 'error' | 'success';
        message: string;
    } | null>(null);
    
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showNotification = (type: 'error' | 'success', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        showNotification('error', 'Паролі не співпадають');
        return;
      }
      setLoading(true);

      try {                
        const response = await registerUser({
          username: formData.username,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        });

        if (response.success) {
          showNotification('success', 'Реєстрація успішна! Перенаправлення на головну сторінку...');
          updateCsrfToken();
          if (response.data) {
            onRegisterSuccess(response.data);
          }
          
          setTimeout(() => navigate("/"), 2000);
        } else {
          showNotification('error', `Помилка реєстрації: ${response.error || 'Щось пішло не так'}`);
        }
      } catch {
        showNotification('error', "Помилка з'єднання з сервером");
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="flex items-center justify-center">
          {notification && (
            <div className="fixed top-4 right-4 z-50 max-w-md w-full">
              <Alert
                className={`${
                  notification.type === "error"
                    ? "border-red-500 bg-red-50"
                    : "border-green-500 bg-green-50"
                } relative shadow-lg transition-all duration-300 ease-in-out`}
              >
                <AlertDescription
                  className={`${
                    notification.type === "error"
                      ? "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  {notification.message}
                </AlertDescription>
                <button
                  onClick={() => setNotification(null)}
                  className="absolute top-2 right-2 hover:bg-green-500 rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            </div>
          )}
      
          <form
            onSubmit={handleSubmit}
            className="bg-emerald-700/50 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full"
          >
            <h2 className="text-2xl text-center font-bold mb-4 text-white">
              Реєстрація
            </h2>
      
            <Input
              type="text"
              name="first_name"
              placeholder="Ім'я"
              value={formData.first_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="text"
              name="last_name"
              placeholder="Прізвище"
              value={formData.last_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="email"
              name="email"
              placeholder="Електронна пошта"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="text"
              name="username"
              placeholder="Логін (Латиницею)"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Підтвердження пароля"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="mb-4"
            />
      
            <Button
              type="submit"
              className={`w-full ${loading ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"} border-0`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex justify-center items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                "Зареєструватися"
              )}
            </Button>
          </form>
        </div>
      );
};

export default Register;