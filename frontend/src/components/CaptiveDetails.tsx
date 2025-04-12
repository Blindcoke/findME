import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

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
    circumstances?: string;
    appearance?: string;
    last_update?: string;
    user: {
        username: string;
        email: string;
    };
}

function CaptiveDetails() {
    const [showContact, setShowContact] = useState(false);
    const [captive, setCaptive] = useState<Captive | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCaptive = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/captives/${id}/`,
                    { credentials: "include" }
                );

                if (!response.ok) throw new Error('Не вдалося завантажити дані');

                const data = await response.json();
                setCaptive(data);
                setIsLoading(false);
            } catch (error) {
                console.error("Fetch error:", error);
                setError("Помилка завантаження даних");
                setIsLoading(false);
            }
        };

        fetchCaptive();
    }, [id]);

    if (isLoading) return <div className="text-center text-white text-xl py-8">Завантаження...</div>;
    if (error) return <div className="text-center text-red-300 text-xl py-8">{error}</div>;
    if (!captive) return <div className="text-center text-emerald-300 text-xl py-8">Особу не знайдено</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Button
                onClick={() => navigate(-1)}
                className="mb-6 bg-emerald-700 hover:bg-emerald-600 text-white border-0"
            >
                Назад
            </Button>

            <Card className="bg-emerald-900/50 backdrop-blur-lg border-2 border-emerald-700 rounded-2xl">
                <CardContent className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start min-w-0">
                        {captive.picture && (
                            <img
                                src={captive.picture}
                                alt={captive.name || "Фото"}
                                className="w-full md:w-96 h-96 object-cover rounded-2xl border-2 border-emerald-600/50 flex-shrink-0"
                            />
                        )}

                        <div className="flex-1 min-w-0 space-y-4">
                            <h1 className="text-3xl font-bold text-emerald-100 break-words">
                                {captive.name || "Невідома особа"}
                            </h1>

                            <div className="flex flex-wrap gap-2">
                                {captive.status === 'informed' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-pink-500/80 to-purple-600/80 rounded-full text-sm font-medium text-white truncate">
                                        Є інформація
                                    </span>
                                ) : captive.status === 'searching' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/80 to-emerald-600/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                                        Розшукується
                                    </span>
                                ) : null}
                                <span className="px-3 py-1 bg-emerald-700/50 rounded-full text-sm text-emerald-100 truncate">
                                    {captive.person_type === 'military' ? 'Військовий' : 'Цивільний'}
                                </span>
                            </div>

                            <div className="space-y-3 text-emerald-100">
                                {captive.person_type === 'military' && captive.brigade && (
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Бригада:</strong>
                                        <span className="ml-2 break-words min-w-0 flex-1">{captive.brigade}</span>
                                    </div>
                                )}
                                {(captive.region || captive.settlement) && (
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Місце:</strong>
                                        <span className="ml-2 break-words min-w-0 flex-1">
                                            {[captive.region, captive.settlement].filter(Boolean).join(", ")}
                                        </span>
                                    </div>
                                )}
                                {captive.date_of_birth && (
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Дата народження:</strong>
                                        <span className="ml-2 truncate min-w-0 flex-1">
                                            {new Date(captive.date_of_birth).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {captive.circumstances && (
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Обставини:</strong>
                                        <span className="ml-2 break-words min-w-0 flex-1">{captive.circumstances}</span>
                                    </div>
                                )}
                                {captive.appearance && (
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Опис зовнішності:</strong>
                                        <span className="ml-2 break-words min-w-0 flex-1">{captive.appearance}</span>
                                    </div>
                                )}
                                <div className="flex min-w-0">
                                    <strong className="flex-shrink-0 text-sm text-emerald-400">Оновлено:</strong>
                                    <span className="ml-2 truncate min-w-0 flex-1 text-sm text-emerald-400">
                                        {new Date(captive.last_update || '').toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            
                            <Button
                                onClick={() => setShowContact(!showContact)}
                                className={`${captive.status === 'informed'
                                    ? 'bg-purple-600 hover:bg-purple-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                    } text-white border-0`}
                            >
                                {showContact ? 'Приховати контакти' : 'Звʼязатися з інформатором'}
                            </Button>

                            {showContact && (
                                <div className="space-y-2 text-emerald-100">
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Інформатор:</strong>
                                        <span className="ml-2 truncate min-w-0 flex-1">{captive.user.username}</span>
                                    </div>
                                    <div className="flex min-w-0">
                                        <strong className="flex-shrink-0">Email:</strong>
                                        <span className="ml-2 truncate min-w-0 flex-1">{captive.user.email}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default CaptiveDetails;