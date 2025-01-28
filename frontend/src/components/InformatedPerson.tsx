import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { Disclosure } from "@headlessui/react";

interface Captive {
  id: number;
  name?: string;
  picture?: string;
  person_type: string;
  brigade?: string;
  date_of_birth?: string;
  status: string;
  region?: string;
  settlement?: string;
  circumstances?: string;
  appearance?: string;
  last_update?: string;
  user: {
    username: string;
    email: string;
  };
}

interface InformatedPersonsProps {
  isAuthenticated: boolean;
}

const InformatedPersons: React.FC<InformatedPersonsProps> = ({ }) => {
  const [captives, setCaptives] = useState<Captive[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    personType: "",
    region: "",
    status: "informed",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    brigade: "",
    circumstances: "",
    appearance: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCaptives = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/captives/?status=informed`,
          { credentials: "include" }
        );
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setCaptives(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to load data");
        setIsLoading(false);
      }
    };
  
    fetchCaptives();
  }, []);

  const filteredCaptives = captives.filter((captive) => {
    const matchesSearch = captive.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    const matchesFilters = (
      (!filters.personType || captive.person_type === filters.personType) &&
      (!filters.region || captive.region?.toLowerCase().includes(filters.region.toLowerCase())) &&
      (!filters.brigade || captive.brigade?.toLowerCase().includes(filters.brigade.toLowerCase())) &&
      (!filters.circumstances || captive.circumstances?.toLowerCase().includes(filters.circumstances.toLowerCase())) &&
      (!filters.appearance || captive.appearance?.toLowerCase().includes(filters.appearance.toLowerCase()))
    );

    const captiveDate = captive.date_of_birth ? new Date(captive.date_of_birth) : null;
    const matchesDateRange = (
      (!filters.startDate || (captiveDate && captiveDate >= filters.startDate)) &&
      (!filters.endDate || (captiveDate && captiveDate <= filters.endDate))
    );

    return matchesSearch && matchesFilters && matchesDateRange;
  });

  if (isLoading) return <div className="text-center text-white text-xl py-8">Завантаження...</div>;
  if (error) return <div className="text-center text-red-300 text-xl py-8">{error}</div>;


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <Input
            type="text"
            placeholder="Пошук за ім'ям"
            className="w-full bg-emerald-800/30 border-2 border-emerald-700 text-white placeholder-emerald-300 rounded-xl h-14 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Link to="/informated/add" className="w-full md:w-auto">
            <Button className="w-full border-0 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-lg font-semibold shadow-lg transition-all">
              Додати особу
            </Button>
          </Link>
        </div>

        {/* Advanced Filters - Now using Disclosure for expand/collapse */}
        <Disclosure>
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="w-full bg-emerald-800/40 hover:bg-emerald-700/40 border-2 border-emerald-700 text-emerald-100 rounded-xl h-12 text-lg">
                <MixerHorizontalIcon className="mr-2 h-5 w-5 inline-block" />
                {open ? 'Приховати розширений пошук' : 'Розширений пошук'}
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

                    <Input
                      placeholder="Опис зовнішності"
                      className="bg-emerald-800/30 border-2 border-emerald-700 text-white"
                      value={filters.appearance}
                      onChange={(e) => setFilters({ ...filters, appearance: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <Select
                      value={filters.personType}
                      onValueChange={(value) => setFilters({ ...filters, personType: value })}
                    >
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

                    {filters.personType === 'military' && (
                      <Input
                        placeholder="Номер бригади"
                        className="bg-emerald-800/20 border-2 border-emerald-600 text-emerald-100 placeholder-emerald-400 focus:border-emerald-500 rounded-xl"
                        value={filters.brigade}
                        onChange={(e) => setFilters({ ...filters, brigade: e.target.value })}
                      />
                    )}

                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="bg-emerald-800/20 hover:bg-emerald-700/30 border-2 border-emerald-600 text-emerald-100 w-full justify-start rounded-xl"
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
                            className="bg-emerald-800/20 hover:bg-emerald-700/30 border-2 border-emerald-600 text-emerald-100 w-full justify-start rounded-xl"
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
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCaptives.map((captive) => (
          <Link
            to={`/informated/${captive.id}`}
            key={captive.id}
            className="hover:scale-[1.02] transition-transform duration-300"
          >
            <Card
              key={captive.id}
              className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 hover:from-emerald-800/60 hover:to-emerald-700/60 border-2 border-emerald-700/30 backdrop-blur-sm rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
            >
              <CardContent className="p-6 space-y-4">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-100">
                      {captive.name || "Невідома особа"}
                    </h3>
                    <p className="text-sm text-emerald-400">
                      Додав: <span className="font-semibold text-emerald-300">{captive.user?.username || 'Unknown User'}</span>
                    </p>
                  </div>
                  {captive.picture && (
                    <img
                      src={captive.picture}
                      alt={captive.name || "Фото"}
                      className="w-16 h-16 object-cover rounded-full border-2 border-emerald-600/50 shadow-lg"
                    />
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-500/80 to-purple-600/80 rounded-full text-sm font-medium text-white shadow-md">
                    {captive.status === 'informed' ? 'Є інформація' : ''}
                  </span>
                  <span className="px-3 py-1 bg-emerald-700/50 rounded-full text-sm text-emerald-100">
                    {captive.person_type === 'military' ? 'Військовий' : 'Цивільний'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 text-emerald-100">
                  {captive.person_type === 'military' && captive.brigade && (
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-400">Бригада:</span>
                      <span className="font-medium">{captive.brigade}</span>
                    </p>
                  )}

                  {(captive.region || captive.settlement) && (
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-400">Місце:</span>
                      <span className="font-medium">
                        {[captive.region, captive.settlement].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  )}

                  {captive.date_of_birth && (
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-400">Дата нар.:</span>
                      <span className="font-medium">
                        {new Date(captive.date_of_birth).toLocaleDateString()}
                      </span>
                    </p>
                  )}

                  {captive.last_update && (
                    <p className="text-xs text-emerald-400/80 mt-4">
                      Оновлено: {new Date(captive.last_update).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

          </Link>
        ))}
      </div>
    </div>
  );
};

export default InformatedPersons;