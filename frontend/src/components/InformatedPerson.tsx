import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Search from "./Search";
import { CaptiveCard } from './CaptiveCard';


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

const InformatedPersons: React.FC<InformatedPersonsProps> = ({ isAuthenticated }) => {
  const [captives, setCaptives] = useState<Captive[]>([]);
  const [originalCaptives, setOriginalCaptives] = useState<Captive[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isAppearanceSearch, setIsAppearanceSearch] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };
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

  const handleSetCaptives = (data: Captive[]) => {
    setCaptives(data);
    setIsAppearanceSearch(true);
  };

  const resetCaptives = () => {
    setCaptives(originalCaptives);
    setIsAppearanceSearch(false);
  };

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
        setOriginalCaptives(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to load data");
        setIsLoading(false);
      }
    };
  
    fetchCaptives();
  }, []);

  const filteredCaptives = isAppearanceSearch 
    ? captives
    : captives.filter((captive) => {
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="bg-emerald-900/30 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center mb-4 sm:mb-6">
          <Input
            type="text"
            placeholder="Пошук за ім'ям"
            className="w-full bg-emerald-800/30 border-2 border-emerald-700 text-white placeholder-emerald-300 rounded-lg sm:rounded-xl h-12 sm:h-14 text-base sm:text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="relative w-full sm:w-auto">
            <Link to={isAuthenticated ? "/informated/add" : "#"} className="w-full" onClick={handleClick}>
              <Button className="w-full border-0 h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg sm:rounded-xl text-base sm:text-lg font-semibold shadow-md transition-all">
                Додати особу
              </Button>
            </Link>
            
            {showMessage && (
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white p-2 rounded text-sm sm:text-base shadow-lg">
                Ви повинні бути авторизовані, щоб додати особу!
              </div>
            )}
          </div>
        </div>
        <Search filters={filters} setFilters={setFilters} setCaptives={handleSetCaptives} resetCaptives={resetCaptives} />
        
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCaptives.map((captive) => (
          <CaptiveCard
            key={captive.id}
            captive={captive}
            linkTo={`/informated/${captive.id}`}
          />
        ))}
      </div>
    </div>
  );
};

export default InformatedPersons;