import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CaptiveCard from "./CaptiveCard";
import { Button } from "./ui/button";
import { User } from "../models/User";
import { fetchCaptivesByUserId } from "../config/api";

interface Captive {
    id: string;
    name?: string;
    picture?: string;
    status?: string;
    person_type?: string;
    brigade?: string;
    region?: string;
    settlement?: string;
    date_of_birth?: string;
    last_update?: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

interface UserCaptivesProps {
    user: User | null;
}

const UserCaptives: React.FC<UserCaptivesProps> = ({ user: currentUser }) => {
    const [captives, setCaptives] = useState<Captive[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const isOwner = currentUser && currentUser.id == id;
    useEffect(() => {
        const fetchUserAndCaptives = async () => {
          if (id) {
            const result = await fetchCaptivesByUserId(id);
            if (result.success && result.data) {
              setCaptives(result.data);
            } else {
              console.error(result.error);
              setError(result.error || "Помилка завантаження даних");
            }
          } else {
            setError("ID користувача не вказано");
          }
          setIsLoading(false);
        };
      
        fetchUserAndCaptives();
      }, [id]);

    if (isLoading) return <div className="text-center text-white text-xl py-8">Завантаження...</div>;
    if (error) return <div className="text-center text-red-300 text-xl py-8">{error}</div>;
    if (!currentUser) return <div className="text-center text-emerald-300 text-xl py-8">Користувача не знайдено</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <Button
                    onClick={() => navigate(-1)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white border-0"
                >
                    Назад
                </Button>
            </div>

            <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-100 mb-2">
                {isOwner
                    ? "Мої додані особи"
                    : captives.length > 0
                        ? `Особи додані користувачем ${captives[0].user.username}`
                        : "Особи цього користувача"
                }
            </h1>
                <p className="text-emerald-200">
                    {`Загальна кількість: ${captives.length}`}
                </p>
            </div>

            {captives.length === 0 ? (
                <div className="text-center text-emerald-300 text-xl py-8">
                    {isOwner 
                        ? "Ви ще не додали жодної особи." 
                        : "Цей користувач ще не додав жодної особи."}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {captives.map(captive => (
                        <CaptiveCard 
                            key={captive.id}
                            captive={captive}
                            linkTo={`/captive/${captive.id}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default UserCaptives;