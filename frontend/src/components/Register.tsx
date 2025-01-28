import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "./ui/alert";
import { X } from "lucide-react";

const Register = () => {
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
    
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showNotification = (type: 'error' | 'success', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000); // Hide after 5 seconds
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showNotification('error', 'Паролі не співпадають');
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                }),
            });

            if (response.ok) {
                showNotification('success', 'Реєстрація успішна! Перенаправлення на сторінку входу...');
                setTimeout(() => navigate("/login"), 2000);
            } else {
                const data = await response.json();
                showNotification('error', `Помилка реєстрації: ${data.detail || 'Щось пішло не так'}`);
            }
        } catch (error) {
            showNotification('error', "Помилка з'єднання з сервером");
        }
    };

    return (
        <div className="flex items-center justify-center">
            {notification && (
                <div className="fixed top-4 right-4 z-50 max-w-md w-full">
                    <Alert 
                        className={`${
                            notification.type === 'error' 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-green-500 bg-green-50'
                        } relative`}
                    >
                        <AlertDescription className={`${
                            notification.type === 'error' 
                                ? 'text-red-800' 
                                : 'text-green-800'
                        }`}>
                            {notification.message}
                        </AlertDescription>
                        <button 
                            onClick={() => setNotification(null)}
                            className="absolute top-2 right-2"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Alert>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="bg-emerald-700/50 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
                <h2 className="text-2xl text-center font-bold mb-4 text-white">Реєстрація</h2>
                <input
                    type="text"
                    name="first_name"
                    placeholder="Ім'я"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <input
                    type="text"
                    name="last_name"
                    placeholder="Прізвище"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Електронна пошта"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <input
                    type="text"
                    name="username"
                    placeholder="Ім'я користувача"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Підтвердження пароля"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full mb-4 px-4 py-2 border rounded"
                />
                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700"
                >
                    Зареєструватися
                </button>
            </form>
        </div>
    );
};

export default Register;