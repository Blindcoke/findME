import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { User } from "../models/User";
import { csrfToken, updateCsrfToken } from "../csrf";
import { updateUserProfile, deleteUserAccount } from "../config/api";

interface FormData {
    username: string;
    email: string;
    password: string;
}

interface UserSettingsProps {
    user: User | null;
    refreshUser: () => Promise<void>;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user, refreshUser }) => {
    const [formData, setFormData] = useState<FormData>({
        username: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                password: "",
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

    try {
        const result = await updateUserProfile(Number(user.id), formData, csrfToken);
        if (result.success) {
            setSuccess("Профіль успішно оновлено!");
            setFormData(prev => ({ ...prev, password: "" }));
            updateCsrfToken();
            await refreshUser();
        } else {
            setError(result.error || null);
        }
        } catch (err) {
        console.error(err);
        setError("Щось пішло не так. Спробуйте ще раз.");
        } finally {
        setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (!window.confirm("Ви впевнені, що хочете видалити свій акаунт?")) return;
        
        setIsLoading(true);
        try {
            const result = await deleteUserAccount(Number(user.id), csrfToken);
            if (result.success) {
            alert("Ваш акаунт успішно видалено.");
            navigate("/register");
            } else {
            setError(result.error || null);
            }
        } catch (err) {
            console.error(err);
            setError("Щось пішло не так. Спробуйте ще раз.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center">
                <div className="bg-emerald-700/50 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
                    <p className="text-white text-center">Будь ласка, увійдіть, щоб отримати доступ до налаштувань.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center">
          <form
            onSubmit={handleUpdate}
            className="bg-emerald-700/50 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full"
          >
            <h2 className="text-white text-3xl font-semibold mb-6 text-center">
              Налаштування
            </h2>
      
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
      
            <div className="mb-4">
              <label htmlFor="username" className="block text-white mb-2">
                Ім'я користувача
              </label>
              <Input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="mb-4"
              />
            </div>
      
            <div className="mb-4">
              <label htmlFor="email" className="block text-white mb-2">
                Електронна пошта
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="mb-4"
              />
            </div>
      
            <div className="mb-6">
              <label htmlFor="password" className="block text-white mb-2">
                Новий пароль (необов'язково)
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="mb-4"
              />
            </div>
      
            <div className="space-y-4">
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-medium border-0 rounded-xl py-2 
                          bg-gradient-to-r from-orange-400 to-yellow-500 
                          hover:from-orange-500 hover:to-yellow-600 
                          transition-all duration-200 shadow-md 
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Збереження..." : "Зберегти"}
              </Button>

              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="w-full text-white font-medium border-0 rounded-xl py-2 
                          bg-gradient-to-r from-red-500 to-pink-600 
                          hover:from-red-600 hover:to-pink-500 
                          transition-all duration-200 shadow-md 
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Видалення..." : "Видалити акаунт"}
              </Button>

            </div>
          </form>
        </div>
      );
};

export default UserSettings;
