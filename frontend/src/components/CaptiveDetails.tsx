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
                className="mb-6 bg-emerald-700 hover:bg-emerald-600 text-white"
            >
                Назад
            </Button>

            <Card className="bg-emerald-900/50 backdrop-blur-lg border-2 border-emerald-700 rounded-2xl">
                <CardContent className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {captive.picture && (
                            <img
                                src={captive.picture}
                                alt={captive.name || "Фото"}
                                className="w-full md:w-96 h-96 object-cover rounded-2xl border-2 border-emerald-600/50"
                            />
                        )}

                        <div className="flex-1 space-y-4">
                            <h1 className="text-3xl font-bold text-emerald-100">
                                {captive.name || "Невідома особа"}
                            </h1>

                            <div className="flex flex-wrap gap-2">
                                {captive.status === 'informed' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-pink-500/80 to-purple-600/80 rounded-full text-sm font-medium text-white">
                                        Є інформація
                                    </span>
                                ) : captive.status === 'searching' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/80 to-emerald-600/80 rounded-full text-sm font-medium text-white shadow-md">
                                        Розшукується
                                    </span>
                                ) : null}
                                <span className="px-3 py-1 bg-emerald-700/50 rounded-full text-sm text-emerald-100">
                                    {captive.person_type === 'military' ? 'Військовий' : 'Цивільний'}
                                </span>
                            </div>

                            <div className="space-y-3 text-emerald-100">
                                {captive.person_type === 'military' && captive.brigade && (
                                    <p><strong>Бригада:</strong> {captive.brigade}</p>
                                )}
                                {(captive.region || captive.settlement) && (
                                    <p><strong>Місце:</strong> {[captive.region, captive.settlement].filter(Boolean).join(", ")}</p>
                                )}
                                {captive.date_of_birth && (
                                    <p><strong>Дата народження:</strong> {new Date(captive.date_of_birth).toLocaleDateString()}</p>
                                )}
                                {captive.circumstances && (
                                    <p><strong>Обставини:</strong> {captive.circumstances}</p>
                                )}
                                {captive.appearance && (
                                    <p><strong>Опис зовнішності:</strong> {captive.appearance}</p>
                                )}
                                <p className="text-sm text-emerald-400">
                                    <strong>Оновлено:</strong> {new Date(captive.last_update || '').toLocaleString()}
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowContact(!showContact)}
                                className={`${captive.status === 'informed'
                                        ? 'bg-purple-600 hover:bg-purple-500'
                                        : 'bg-emerald-600 hover:bg-emerald-500'
                                    } text-white`}>
                                {showContact ? 'Приховати контакти' : 'Звʼязатися з інформатором'}
                            </Button>

                            {showContact && (
                                <div className="space-y-2 text-emerald-100">
                                    <p><strong>Інформатор:</strong> {captive.user.username}</p>
                                    <p><strong>Email:</strong> {captive.user.email}</p>
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