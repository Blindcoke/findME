import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User as UserIcon, LogOut, Archive, Settings, Menu, X } from 'lucide-react';
import tridentUrl from '@/assets/trident.svg';
import { User } from '../models/User';

interface HeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div>
      <div className="absolute top-4 right-4 md:top-6 md:right-10">
        {isAuthenticated ? (
          <>
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="bg-green-900 rounded-full p-2 hover:bg-emerald-700/40 transition-all border-0 
                   focus:outline-none focus:ring-0"
                    aria-label="User menu"
                    onMouseDown={(e) => e.currentTarget.blur()}>
                    <UserIcon
                      size={32}
                      className="text-yellow-500 hover:scale-110 transition-transform"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-emerald-800/50 backdrop-blur-lg text-white border-0 shadow-xl mt-2 rounded-xl w-48">

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-emerald-700/50 cursor-pointer">
                    <Link to="/settings" className="flex items-center gap-2 text-white hover:text-yellow-400">
                      <Settings size={16} className="text-yellow-500" />
                      <span>Налаштування</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-emerald-700/50 cursor-pointer">
                    <Link to={`/captives/user/${user?.id}`} className="flex items-center gap-2 text-white hover:text-yellow-400">
                      <Archive size={16} className="text-yellow-500" />
                      <span>Мої повідомлення</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-emerald-700/50 cursor-pointer"
                    onClick={onLogout}>
                    <LogOut size={16} className="text-yellow-500" />
                    <span className="text-white hover:text-yellow-400">Вийти</span>
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setUserMenuOpen(true)}
                className="bg-green-900 rounded-full p-1 hover:bg-emerald-700/30 transition-colors border-0">
                <UserIcon
                  size={32}
                  className="text-yellow-500 hover:scale-110 transition-transform"
                  strokeWidth={1.5}
                />
              </button>

              {userMenuOpen && (
                <div className="fixed inset-0 z-50 bg-emerald-900/80 backdrop-blur-sm">
                  <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="bg-green-900 absolute top-4 right-4 p-2 hover:bg-emerald-700/30 rounded-full border-0"
                    >
                      <X className="h-8 w-8 text-white hover:text-yellow-500" strokeWidth={1.5} />
                    </button>

                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="px-8 py-4 text-2xl bg-emerald-800/50 hover:bg-emerald-700/50 hover:text-yellow-500 border-0 rounded-xl text-white w-64 text-center transition-all duration-300 backdrop-blur-sm shadow-lg flex items-center justify-center gap-1"
                    >
                      <Settings size={24} className="text-yellow-500" />
                      Налаштування
                    </Link>

                    <Link
                      to="/my-captives"
                      onClick={() => setUserMenuOpen(false)}
                      className="px-8 py-4 text-2xl bg-emerald-800/50 hover:bg-emerald-700/50 hover:text-yellow-500 border-0 rounded-xl text-white w-64 text-center transition-all duration-300 backdrop-blur-sm shadow-lg flex items-center justify-center gap-1"
                    >
                      <Archive size={24} className="text-yellow-500" />
                      Мої оголошення
                    </Link>

                    <button
                      onClick={() => {
                        onLogout();
                        setUserMenuOpen(false);
                      }}
                      className="px-8 py-4 text-2xl bg-emerald-800/50 hover:bg-emerald-700/50 hover:text-yellow-500 border-0 rounded-xl text-white w-64 text-center transition-all duration-300 backdrop-blur-sm shadow-lg flex items-center justify-center gap-1"
                    >
                      <LogOut size={24} className="text-yellow-500" />
                      Вийти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-3">
              <Link
                to="/login"
                className="px-4 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-yellow-500  transition-all duration-300 backdrop-blur-sm shadow-md hover:shadow-emerald-700/25 hover:text-yellow-300"
              >
                Увійти
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-yellow-500 transition-all duration-300 backdrop-blur-sm shadow-md hover:shadow-emerald-700/25 hover:text-yellow-300"
              >
                Реєстрація
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl backdrop-blur-sm transition-colors border-0"
            >
              <Menu className="h-6 w-6 text-white" />
            </button>

            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 bg-emerald-900/80 backdrop-blur-sm">
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-emerald-700/30 rounded-full bg-green-900 border-0"
                  >
                    <X className="h-8 w-8 text-yellow-500" strokeWidth={1.5} />
                  </button>

                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-8 py-4 text-2xl bg-emerald-800/50 hover:bg-emerald-700/50 hover:text-yellow-500 rounded-xl text-white w-64 text-center transition-all duration-300 backdrop-blur-sm shadow-lg"
                  >
                    Увійти
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-8 py-4 text-2xl bg-emerald-800/50 hover:bg-emerald-700/50 hover:text-yellow-500  rounded-xl text-white w-64 text-center transition-all duration-300 backdrop-blur-sm shadow-lg"
                  >
                    Реєстрація
                  </Link>
                </div>
              </div>
            )}
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

        {isHomePage && (
          <Link
            to="/archive"
            className="group flex items-center gap-2 px-6 py-3 bg-emerald-800/50 hover:bg-emerald-700/50 rounded-xl text-white transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-emerald-700/25 hover:text-white"
          >
            <Archive
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="font-medium">Архіви</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;
