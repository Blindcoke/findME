import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { User } from "../models/User";
import { useToast } from "../hooks/use-toast";
import { csrfToken } from "../csrf";
import { checkOwnership, updateCaptive } from "../config/api";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";

interface FormData {
    name: string;
    picture: File | null | string;
    status: string;
    person_type: string;
    brigade: string;
    region: string;
    settlement: string;
    date_of_birth: string;
    circumstances: string;
    appearance: string;
}

interface CaptiveEditProps {
    user: User | null;
}

function CaptiveEdit({ user: currentUser }: CaptiveEditProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast(); 

    const [formData, setFormData] = useState<FormData>({
        name: "",
        picture: null,
        status: "searching",
        person_type: "civilian",
        brigade: "",
        region: "",
        settlement: "",
        date_of_birth: "",
        circumstances: "",
        appearance: "",
    });

    const [picturePreview, setPicturePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (!currentUser) {
          setError("Ви повинні бути авторизовані");
          setIsLoading(false);
          return;
        }
      
        const fetchData = async () => {
          setIsLoading(true);
          if (!id) {
            setError("Missing captive ID");
            setIsLoading(false);
            return;
          }
          const result = await checkOwnership(id, Number(currentUser.id));
      
          if (!result.success) {
            setError(result.error || "Unknown error");
            setIsLoading(false);
            return;
          }
      
          const data = result.data;
      
          // Set date for calendar
          if (data.date_of_birth) {
            setBirthDate(new Date(data.date_of_birth));
          }
      
          const formattedDate = data.date_of_birth
            ? new Date(data.date_of_birth).toISOString().split("T")[0]
            : "";
      
          setFormData({
            name: data.name || "",
            picture: data.picture || null,
            status: data.status || "searching",
            person_type: data.person_type || "civilian",
            brigade: data.brigade || "",
            region: data.region || "",
            settlement: data.settlement || "",
            date_of_birth: formattedDate,
            circumstances: data.circumstances || "",
            appearance: data.appearance || "",
          });
      
          if (data.picture && typeof data.picture === "string") {
            setPicturePreview(data.picture);
          }
      
          setIsLoading(false);
        };
      
        fetchData();
      }, [id, currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({
                ...prev,
                picture: file
            }));

            const previewUrl = URL.createObjectURL(file);
            setPicturePreview(previewUrl);
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date: Date | undefined) => {
        setBirthDate(date);
        if (date) {
            const formattedDate = date.toISOString().split("T")[0];
            setFormData(prev => ({
                ...prev,
                date_of_birth: formattedDate
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                date_of_birth: ""
            }));
        }
    };

    const getRedirectUrl = (captiveId: string, status: string) => {
        switch (status) {
            case "informed":
                return `/informated/${captiveId}`;
            case "searching":
                return `/searching/${captiveId}`;
            case "deceased":
                return `/archive/${captiveId}`;
            case "reunited":
                return `/archive/${captiveId}`;
            default:
                return `/captives/${captiveId}`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError("Ви повинні бути авторизовані");
            return;
        }
        
        setIsSaving(true);

        try {
            if (!id) {
                setError("Missing captive ID");
                setIsSaving(false);
                return;
            }
            
            const formDataToSend = new FormData();
            
            formDataToSend.append("name", formData.name);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("person_type", formData.person_type);
            formDataToSend.append("region", formData.region);
            formDataToSend.append("settlement", formData.settlement);
            formDataToSend.append("circumstances", formData.circumstances);
            formDataToSend.append("appearance", formData.appearance);
            
            if (formData.date_of_birth) {
                formDataToSend.append("date_of_birth", formData.date_of_birth);
            }
            
            if (formData.person_type === 'military' && formData.brigade) {
                formDataToSend.append("brigade", formData.brigade);
            }
            
            if (formData.picture instanceof File) {
                formDataToSend.append("picture", formData.picture);
            }

            const response = await updateCaptive(id, csrfToken, formDataToSend);
            if (!response.success) {
              setError(response.error || "Unknown error");
              throw new Error(response.error || 'Не вдалося зберегти дані');
            }

            const savedData = (response as any).data || { id };
            
            toast({
                title: "Запис оновлено",
                description: "Інформацію збережено успішно",
                variant: "success"
            });
            
            navigate(getRedirectUrl(savedData.id, savedData.status));
        } catch (error: any) {
            console.error("Save error:", error);
            setError("Помилка збереження даних: " + error.message);
            toast({
                title: "Помилка",
                description: "Не вдалося зберегти дані: " + error.message,
                variant: "destructive"
            });
            
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-center text-white text-xl py-8">Завантаження...</div>;
    if (error) return <div className="text-center text-red-300 text-xl py-8">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Button
                onClick={() => navigate(-1)}
                className="mb-6 bg-emerald-700 hover:bg-emerald-600 text-white border-0"
            >
                Назад
            </Button>

            <Card className="bg-emerald-900/50 backdrop-blur-lg border-2 border-emerald-700 rounded-2xl">
                <CardContent className="p-8">
                    <h1 className="text-3xl font-bold text-emerald-100 mb-6">
                        Редагувати інформацію
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Ім'я та прізвище
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400"
                                        placeholder="Введіть ім'я та прізвище особи"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="picture" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Фото
                                    </label>
                                    <Input
                                        id="picture"
                                        name="picture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="bg-emerald-800/50 border-emerald-600 text-emerald-100 file:text-emerald-100"
                                    />
                                    {picturePreview && (
                                        <div className="mt-2">
                                            <img 
                                                src={picturePreview} 
                                                alt="Попередній перегляд" 
                                                className="max-h-32 rounded-md border border-emerald-600" 
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Статус
                                    </label>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange("status", value)}
                                    >
                                        <SelectTrigger className="bg-emerald-800/50 border-emerald-600 text-emerald-100">
                                            <SelectValue placeholder="Оберіть статус" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-emerald-800 border-emerald-600">
                                            <SelectItem value="searching" className="text-emerald-100">Розшукується</SelectItem>
                                            <SelectItem value="informed" className="text-emerald-100">Є інформація</SelectItem>
                                            <SelectItem value="deceased" className="text-emerald-100">Помер</SelectItem>
                                            <SelectItem value="reunited" className="text-emerald-100">Возз'єднано</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <label htmlFor="person_type" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Тип особи
                                    </label>
                                    <Select
                                        name="person_type"
                                        value={formData.person_type}
                                        onValueChange={(value) => handleSelectChange("person_type", value)}
                                    >
                                        <SelectTrigger className="bg-emerald-800/50 border-emerald-600 text-emerald-100">
                                            <SelectValue placeholder="Оберіть тип особи" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-emerald-800 border-emerald-600">
                                            <SelectItem value="civilian" className="text-emerald-100">Цивільний</SelectItem>
                                            <SelectItem value="military" className="text-emerald-100">Військовий</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {formData.person_type === 'military' && (
                                    <div>
                                        <label htmlFor="brigade" className="block text-sm font-medium text-emerald-200 mb-1">
                                            Бригада / Підрозділ
                                        </label>
                                        <Input
                                            id="brigade"
                                            name="brigade"
                                            value={formData.brigade}
                                            onChange={handleChange}
                                            className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400"
                                            placeholder="Введіть бригаду або підрозділ"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="region" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Область
                                    </label>
                                    <Input
                                        id="region"
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400"
                                        placeholder="Введіть область"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="settlement" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Населений пункт
                                    </label>
                                    <Input
                                        id="settlement"
                                        name="settlement"
                                        value={formData.settlement}
                                        onChange={handleChange}
                                        className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400"
                                        placeholder="Введіть населений пункт"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-emerald-200 mb-1">
                                        Дата народження
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full bg-emerald-800/50 border-emerald-600 text-emerald-100 hover:bg-emerald-700/50 justify-start text-left font-normal",
                                                    !birthDate && "text-emerald-400"
                                                )}
                                            >
                                                {birthDate ? format(birthDate, "dd.MM.yyyy") : <span>Оберіть дату</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 text-emerald-300" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={birthDate} 
                                                onSelect={handleDateChange} 
                                                initialFocus 
                                                className="text-emerald-100" 
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="appearance" className="block text-sm font-medium text-emerald-200 mb-1">
                                Опис зовнішності
                                <span className="ml-1 text-red-400">*</span>
                            </label>
                            <Textarea
                                id="appearance"
                                name="appearance"
                                value={formData.appearance}
                                onChange={handleChange}
                                className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400 min-h-32"
                                placeholder="Опишіть зовнішність особи"
                            />
                            <p className="text-xs text-emerald-400 mt-1">
                                Приклад: "Чоловік, 45 років, темне коротке волосся з сивиною, карі очі, овальне обличчя з вусами."
                            </p>
                        </div>
                        
                        <div>
                            <label htmlFor="circumstances" className="block text-sm font-medium text-emerald-200 mb-1">
                                Обставини
                            </label>
                            <Textarea
                                id="circumstances"
                                name="circumstances"
                                value={formData.circumstances}
                                onChange={handleChange}
                                className="bg-emerald-800/50 border-emerald-600 text-emerald-100 placeholder:text-emerald-400 min-h-32"
                                placeholder="Опишіть обставини зникнення"
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                                disabled={isSaving}
                            >
                                Скасувати
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                                disabled={isSaving}
                            >
                                {isSaving ? "Збереження..." : "Зберегти зміни"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default CaptiveEdit;