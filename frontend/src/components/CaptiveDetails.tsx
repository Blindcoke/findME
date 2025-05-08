import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { fetchCaptiveById, deleteCaptiveById } from "../config/api";
import { csrfToken } from "../csrf";

interface User {
    id: string;
    username: string;
    email: string;
}

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
        id: string;
        username: string;
        email: string;
    };
}

interface CaptiveDetailsProps {
    user: User | null;
}

const CaptiveDetails: React.FC<CaptiveDetailsProps> = ({ user: currentUser }) => {
    const [showContact, setShowContact] = useState(false);
    const [captive, setCaptive] = useState<Captive | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const getCurrentSection = () => {
        const path = location.pathname;
        if (path.includes("/searching/")) return "searching";
        if (path.includes("/informated/")) return "informed";
        if (path.includes("/archive/")) return "archive";
        if (path.includes("/captives/")) return "captives";
    };

    const section = getCurrentSection();
    const isOwner = currentUser?.id === captive?.user?.id;


    useEffect(() => {
        const fetchData = async () => {
          setIsLoading(true);
          if (id) {
            const result = await fetchCaptiveById(id);
            if (result.success) {
              setCaptive(result.data);
            } else {
              setError(result.error || "Unknown error");
            }
          } else {
            setError("No ID provided");
          }
          setIsLoading(false);
        };
      
        fetchData();
      }, [id]);
      
    const handleEdit = () => {
    navigate(`/captives/${captive?.id}/edit/`);
    };
    
    const handleDelete = async () => {
        if (!captive || !captive.id) {
            setError("Особу для видалення не знайдено");
            return;
        }
        
        if (!window.confirm("Ви впевнені, що хочете видалити цю особу? Ця дія незворотна.")) return;

        setIsDeleting(true);
        const result = await deleteCaptiveById(captive.id, csrfToken);

        if (result.success) {
            if (currentUser) {
            navigate(`/captives/user/${currentUser.id}`);
            } else {
            navigate(section ? {
                informed: "/informated",
                searching: "/searching",
                archive: "/archive",
                captives: "/captives"
            }[section] : "/captives");
            }
        } else {
            setError(result.error || "Помилка при видаленні");
            setIsDeleting(false);
        }
    };

    const getBackUrl = () => {
        switch (section) {
            case "informed":
                return "/informated";
            case "searching":
                return "/searching";
            case "archive":
                return "/archive";
            default:
                return -1;
        }
    };

    if (isLoading) return <div className="text-center text-white text-xl py-8">Завантаження...</div>;
    if (error) return <div className="text-center text-red-300 text-xl py-8">{error}</div>;
    if (!captive) return <div className="text-center text-emerald-300 text-xl py-8">Особу не знайдено</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <Button
                    onClick={() => {
                        const backUrl = getBackUrl();
                        if (backUrl === -1) {
                            navigate(-1);
                        } else {
                            navigate(backUrl);
                        }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white"
                >
                    Назад
                </Button>

                {isOwner && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleEdit}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
                            disabled={isDeleting}
                        >
                            <Pencil className="h-4 w-4" />
                            Редагувати
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-500 text-white flex items-center gap-2"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Видалення..." : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Видалити
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

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
                                ) : captive.status === 'deceased' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-gray-700/80 to-red-900/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                                        Загинув(-ла)
                                    </span>
                                ) : captive.status === 'reunited' ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/80 to-cyan-600/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                                        Зустрів(-ла) рідних
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
                                <div className="space-y-2 text-emerald-100 mt-2">
                                    <div className="flex min-w-0 items-center">
                                        <strong className="flex-shrink-0">Інформатор:</strong>
                                        <a
                                            href={`/captives/user/${captive.user.id}`}
                                            className="ml-2 truncate min-w-0 flex-1 text-emerald-300 hover:underline"
                                        >
                                            {captive.user.username}
                                        </a>
                                    </div>

                                    <div className="flex min-w-0 items-center">
                                        <strong className="flex-shrink-0">Email:</strong>
                                        <a
                                            href={`mailto:${captive.user.email}`}
                                            className="ml-2 truncate min-w-0 flex-1 text-emerald-300 hover:underline"
                                        >
                                            {captive.user.email}
                                        </a>
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