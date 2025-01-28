import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { csrfToken, updateCsrfToken } from "../csrf";

interface User {
    id: number;
    username: string;
    email: string;
}

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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Профіль успішно оновлено!");
                setFormData(prev => ({ ...prev, password: "" }));
                updateCsrfToken();
                await refreshUser();
            } else {
                setError(data.error || "Не вдалося оновити профіль.");
            }
        } catch (err) {
            setError("Щось пішло не так. Спробуйте ще раз.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (!window.confirm("Ви впевнені, що хочете видалити свій акаунт?")) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}/`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
            });

            if (response.ok) {
                alert("Ваш акаунт успішно видалено.");
                navigate("/register");
            } else {
                setError("Не вдалося видалити акаунт.");
            }
        } catch (err) {
            setError("Щось пішло не так. Спробуйте ще раз.");
            console.error(err);
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
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="block text-white mb-2">
                        Електронна пошта
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="password" className="block text-white mb-2">
                        Новий пароль (необов'язково)
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-500 text-black font-medium px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Збереження..." : "Зберегти"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="w-full bg-red-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Видалення..." : "Видалити акаунт"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserSettings;
