import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon, MixerHorizontalIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { Disclosure } from "@headlessui/react";
import { csrfToken } from "../csrf";

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
    const [showAppearanceSearch, setShowAppearanceSearch] = useState(false);
    const [appearanceInput, setAppearanceInput] = useState("");

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

            <Button 
                onClick={() => {
                    if (showAppearanceSearch) {
                        setAppearanceInput("");
                        setFilters({ ...filters, appearance: "" });
                        resetCaptives();
                    }
                    setShowAppearanceSearch(!showAppearanceSearch);
                }}
                className="w-full bg-emerald-700/60 hover:bg-emerald-700/80 text-emerald-100 rounded-xl h-12 text-base font-medium"
            >
                {showAppearanceSearch ? "Приховати" : "Пошук за описом зовнішності"}
            </Button>
            
            {showAppearanceSearch && (
                <div className="mt-4 flex gap-2">
                    <Input
                        placeholder="Опишіть зовнішність людини..."
                        className="bg-emerald-800/30 border-2 border-emerald-700 text-white flex-grow rounded-xl"
                        value={appearanceInput}
                        onChange={(e) => setAppearanceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAppearanceSearch()}
                    />
                    <Button 
                        onClick={handleAppearanceSearch}
                        className="bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                        disabled={!appearanceInput}
                    >
                        <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Search;