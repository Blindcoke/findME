import { useState, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon, MixerHorizontalIcon, MagnifyingGlassIcon, ImageIcon, Cross2Icon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { Disclosure } from "@headlessui/react";
import { csrfToken } from "../csrf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Filters {
    personType: string;
    region: string;
    status: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    brigade: string;
    circumstances: string;
    appearance: string;
}

interface SearchProps {
    filters: Filters;
    setFilters: (filters: Filters) => void;
    setCaptives: (captives: any[]) => void;
    resetCaptives: () => void;
}

const Search = ({ filters, setFilters, setCaptives, resetCaptives }: SearchProps) => {
    const [appearanceInput, setAppearanceInput] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showAlternativeSearch, setShowAlternativeSearch] = useState(false);
    const [activeTab, setActiveTab] = useState<"appearance" | "photo">("appearance");

    const handleAppearanceSearch = async () => {
        if (!appearanceInput) return;
      
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/appearance_search/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-CSRFToken": csrfToken || '',
            },
            credentials: "include",
            body: JSON.stringify({
              appearance: appearanceInput,
              status: filters.status,
            }),
          });
      
          if (!response.ok) {
            throw new Error("Failed to search by appearance");
          }
      
          const data = await response.json();
          setCaptives(data);
          setFilters({ ...filters, appearance: appearanceInput });
      
        } catch (error) {
          console.error("Error during appearance search:", error);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setPhotoFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoSearch = async () => {
        if (!photoFile) return;
        
        setIsUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('status', filters.status);
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/photo_search/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken || '',
                },
                credentials: "include",
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error("Failed to search by photo");
            }
            
            const data = await response.json();
            setCaptives(data);
            
        } catch (error) {
            console.error("Error during photo search:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const clearPhotoUpload = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetSearch = () => {
        setAppearanceInput("");
        clearPhotoUpload();
        setFilters({ ...filters, appearance: "" });
        resetCaptives();
        setShowAlternativeSearch(false);
    };

    return (
        <div className="space-y-6">
            <Disclosure>
                {({ open }) => (
                    <>
                        <Disclosure.Button className="w-full bg-emerald-800/40 hover:bg-emerald-700/40 border-2 border-emerald-700 text-emerald-100 rounded-xl h-12 text-lg hover:border-emerald-600">
                            <MixerHorizontalIcon className="mr-2 h-5 w-5 inline-block" />
                            {open ? "Приховати розширений пошук" : "Розширений пошук"}
                        </Disclosure.Button>

                        <Disclosure.Panel className="pt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Область"
                                        className="bg-emerald-800/30 border-2 border-emerald-700 text-white"
                                        value={filters.region}
                                        onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                                    />

                                    <Input
                                        placeholder="Обставини"
                                        className="bg-emerald-800/30 border-2 border-emerald-700 text-white"
                                        value={filters.circumstances}
                                        onChange={(e) => setFilters({ ...filters, circumstances: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Select value={filters.personType} onValueChange={(value) => setFilters({ ...filters, personType: value })}>
                                        <SelectTrigger className="bg-emerald-800/20 hover:bg-emerald-700/30 border-2 border-emerald-600 text-emerald-100 rounded-xl">
                                            <SelectValue placeholder="Тип особи" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 text-emerald-100">
                                            <SelectItem className="hover:bg-emerald-700/50 focus:bg-emerald-600" value="military">
                                                Військовий
                                            </SelectItem>
                                            <SelectItem className="hover:bg-emerald-700/50 focus:bg-emerald-600" value="civilian">
                                                Цивільний
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {filters.personType === "military" && (
                                        <Input
                                            placeholder="Номер бригади"
                                            className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 placeholder-emerald-400 focus:border-emerald-500 rounded-xl"
                                            value={filters.brigade || ""}
                                            onChange={(e) => setFilters({ ...filters, brigade: e.target.value })}
                                        />
                                    )}

                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="bg-emerald-800/20 hover:bg-emerald-700/30 border-2 border-emerald-600 text-emerald-100 w-full justify-start rounded-xl hover:border-emerald-500"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-300" />
                                                    {filters.startDate ? format(filters.startDate, "dd.MM.y") : "Від"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 text-emerald-100">
                                                <Calendar
                                                    mode="single"
                                                    selected={filters.startDate}
                                                    onSelect={(date) => setFilters({ ...filters, startDate: date })}
                                                    className="rounded-xl"
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="bg-emerald-800/20 hover:bg-emerald-700/30 border-2 border-emerald-600 text-emerald-100 w-full justify-start rounded-xl hover:border-emerald-500"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-300" />
                                                    {filters.endDate ? format(filters.endDate, "dd.MM.y") : "До"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="bg-emerald-800/80 backdrop-blur-lg border-2 border-emerald-600 text-emerald-100">
                                                <Calendar
                                                    mode="single"
                                                    selected={filters.endDate}
                                                    onSelect={(date) => setFilters({ ...filters, endDate: date })}
                                                    className="rounded-xl"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>

            {!showAlternativeSearch && (
                <div 
                    className="bg-green-900/30 border-2 border-green-600 text-green-100 rounded-xl p-4 mt-6 flex items-center cursor-pointer hover:bg-green-900/40 transition-colors"
                    onClick={() => setShowAlternativeSearch(true)}
                    >
                    <InfoCircledIcon className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" />
                    <p className="text-green-200">
                        Не маєте необхідних даних для пошуку? Спробуйте пошук за описом зовнішності або фото.
                    </p>
                </div>
            )}

            {showAlternativeSearch && (
                <div className="mt-6 border-2 border-green-600 rounded-2xl bg-green-900/20 p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-green-200 font-semibold text-lg">Альтернативні методи пошуку</h3>
                        <Button 
                            onClick={resetSearch} 
                            variant="outline" 
                            className="border-0 bg-green-700 hover:bg-green-800/50 hover:text-white sm:rounded-xl transition-colors duration-200 px-4 py-1 shadow-sm">
                            Закрити
                        </Button>
                    </div>
                    
                    <Tabs 
                        value={activeTab} 
                        onValueChange={(value) => setActiveTab(value as "appearance" | "photo")} 
                        className="w-full">
                        <TabsList className="flex w-full mb-6 bg-green-900/40 border border-green-700 rounded-full overflow-hidden">
                            <TabsTrigger
                                value="appearance"
                                className="w-1/2 px-4 py-2 text-center text-sm font-medium text-green-200 transition-all duration-300 ease-in-out 
                                        data-[state=active]:bg-green-700 data-[state=active]:text-white data-[state=inactive]:bg-green-300/10 rounded-l-full border-0">
                                Пошук за описом
                            </TabsTrigger>
                            <TabsTrigger
                                value="photo"
                                className="w-1/2 px-4 py-2 text-center text-sm font-medium text-green-200 transition-all duration-300 ease-in-out 
                                        data-[state=active]:bg-green-700 data-[state=active]:text-white data-[state=inactive]:bg-green-300/10 rounded-r-full border-0">
                                Пошук за фото
                            </TabsTrigger>
                        </TabsList>


                        <TabsContent value="appearance" className="mt-0">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Опишіть зовнішність людини..."
                                        className="bg-green-800/30 border-2 border-green-700 text-white flex-grow rounded-xl"
                                        value={appearanceInput}
                                        onChange={(e) => setAppearanceInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAppearanceSearch()}/>
                                    <Button 
                                        onClick={handleAppearanceSearch}
                                        className="bg-green-600 hover:bg-green-500 rounded-xl"
                                        disabled={!appearanceInput}>
                                        <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                                    </Button>
                                </div>
                                <p className="text-green-300 text-sm">
                                    Опишіть зовнішність детально: зріст, колір волосся, особливі прикмети, тощо
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="photo" className="mt-0">
                            <div className="space-y-4">
                                {!photoPreview ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer h-64 flex items-center justify-center border-2 border-dashed border-green-500 bg-green-900/20 rounded-xl hover:bg-green-900/30 transition-colors">
                                        <div className="text-center">
                                            <ImageIcon className="h-12 w-12 mx-auto text-green-400 mb-3" />
                                            <p className="text-green-200">Клацніть щоб завантажити фото</p>
                                            <p className="text-green-400 text-sm mt-1">або перетягніть фото сюди</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="h-64 rounded-xl overflow-hidden bg-green-900/20 border-2 border-green-500">
                                            <img 
                                                src={photoPreview} 
                                                alt="Uploaded preview" 
                                                className="w-full h-full object-contain"/>
                                        </div>
                                        <Button 
                                            onClick={clearPhotoUpload}
                                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 rounded-full p-1 w-8 h-8 flex items-center justify-center">
                                            <Cross2Icon className="h-4 w-4 text-white" />
                                        </Button>
                                    </div>
                                )}
                                
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                    className="hidden"/>
                                
                                <Button 
                                    onClick={handlePhotoSearch}
                                    disabled={!photoFile || isUploading}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl h-12">
                                    {isUploading ? "Пошук..." : "Знайти за фотографією"}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

        </div>
    );
};

export default Search;