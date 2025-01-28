import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, LogOut, Archive, Settings } from "lucide-react";
import tridentUrl from "@/assets/trident.svg";

const Header: React.FC<{ isAuthenticated: boolean, onLogout: () => void }> = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div>
      <div className="absolute top-6 right-6">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <User
                size={32}
                className="text-yellow-500 hover:scale-110 transition-transform cursor-pointer"
                strokeWidth={1.5}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-emerald-800/50 backdrop-blur-sm text-white border-0 shadow-lg mt-2 mr-2 rounded-xl">
              <DropdownMenuItem className="hover:bg-emerald-700/50 cursor-pointer focus:bg-emerald-700/50 gap-2">
                <Link to="/settings" className="flex items-center gap-2 text-white hover:text-white">
                  <Settings size={16} className="text-yellow-500" />
                  <span>Налаштування</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-emerald-700/50 cursor-pointer focus:bg-emerald-700/50 gap-2" onClick={onLogout}>
                <LogOut size={16} className="text-yellow-500" />
                <a className="text-white hover:text-white">
                  <span>Вийти</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-4 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-white transition-all duration-300 backdrop-blur-sm"
            >
              Увійти
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-white transition-all duration-300 backdrop-blur-sm"
            >
              Реєстрація
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mb-12 pt-8">
        <Link to="/" className="block w-24 mb-8">
          <img
            src={tridentUrl}
            className="w-full h-full hover:scale-105 transform transition-transform"
            alt="Trident"
          />
        </Link>

        {isHomePage && isAuthenticated && (
          <Link
            to="/archive"
            className="group flex items-center gap-2 px-6 py-3 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-white transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-emerald-700/25"
          >
            <Archive size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Архіви</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;