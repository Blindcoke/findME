import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SearchingPersons from "./components/SearchingPerson";
import InformatedPersons from "./components/InformatedPerson";
import { Card, CardContent } from "./components/ui/card";
import Login from "./components/Login";
import Register from "./components/Register";
import Header from "./components/Header";
import UserSettings from "./components/UserSettings";
import CaptiveDetails from "./components/CaptiveDetails";
import AddCaptiveForm from "./components/AddCaptiveForm";
import Archive from "./components/Archive";
import UserCaptives from "./components/UserCaptives";
import { User } from "./models/User";
import { csrfToken } from "./csrf";
import CaptiveEdit from "./components/CaptiveEdit";
import { fetchUserData, logoutUser } from "./config/api";


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);


  useEffect(() => {
    fetchUser();
  }, []);
  
  const fetchUser = async () => {
    const result = await fetchUserData();
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.data);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };
  
  const handleLoginSuccess = async () => {
    await fetchUser();
  };
  
  const refreshUser = async () => {
    await fetchUser();
  };
  
  const onLogout = async () => {
    const success = await logoutUser(csrfToken);
    if (success) {
      setIsAuthenticated(false);
      setUser(null);
    } else {
      console.error("Failed to logout");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-800">
        <div className="container mx-auto p-4">
          <Header isAuthenticated={isAuthenticated} onLogout={onLogout} user={user} />

          <Routes>
            <Route
              path="/"
              element={
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <Link
                    to="/Searching"
                    className="block transform transition-transform hover:scale-105 aspect-square"
                  >
                    <Card className="h-full bg-emerald-800/50 hover:bg-emerald-700/50 text-white shadow-lg transition-all duration-300 border-0 backdrop-blur-sm">
                      <CardContent className="flex flex-col justify-center items-center h-full text-center p-8">
                      <h2 className="text-3xl font-semibold mb-4">
                        Розшук
                      </h2>
                      <p className="text-lg">
                        Переглянути список зниклих безвісти або додати нову особу
                      </p>
                      <p className="text-base text-emerald-400/80 mt-2">
                        Використовуйте цю вкладку, якщо ви шукаєте людину, яка зникла. Тут можна перевірити, чи вже хтось шукає цю особу, або створити нову заявку про зникнення.
                      </p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link
                    to="/informated"
                    className="block transform transition-transform hover:scale-105 aspect-square"
                  >
                    <Card className="h-full bg-emerald-800/50 hover:bg-emerald-700/50 text-white shadow-lg transition-all duration-300 border-0 backdrop-blur-sm">
                      <CardContent className="flex flex-col justify-center items-center h-full text-center p-8">
                      <h2 className="text-3xl font-semibold mb-4">
                        Є інформація
                      </h2>
                      <p className="text-lg">
                        Переглянути осіб, про яких зібрано дані, або додати нову інформацію
                      </p>
                      <p className="text-base text-emerald-400/80 mt-2">
                        Ця вкладка для тих, хто має будь-яку інформацію про людину — наприклад, бачив її, має фото або знає місце перебування. Ви можете додати ці дані, навіть якщо особа ще не значиться серед зниклих.
                      </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              }
            />
            <Route path="/searching" element={<SearchingPersons isAuthenticated={isAuthenticated} />} />
            <Route path="/informated" element={<InformatedPersons isAuthenticated={isAuthenticated} />} />
            <Route path="/archive" element={<Archive isAuthenticated={isAuthenticated} />} />
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/register" element={<Register onRegisterSuccess={handleLoginSuccess} />} />
            <Route path="/settings" element={<UserSettings user={user} refreshUser={refreshUser} />} />
            <Route path="/searching/:id" element={<CaptiveDetails user={user} />} />
            <Route path="/informated/:id" element={<CaptiveDetails user={user} />} />
            <Route path="/archive/:id" element={<CaptiveDetails user={user} />} />
            <Route path="/captives/:id" element={<CaptiveDetails user={user} />} />
            <Route path="/captives/user/:id" element={<UserCaptives user={user} />} />
            <Route path="/captives/:id/edit" element={<CaptiveEdit user={user} />} />
            <Route path="my-captives" element={<UserCaptives user={user} />} />
            <Route
              path="/informated/add"
              element={<AddCaptiveForm formType="informed" />}
            />
            <Route
              path="/searching/add"
              element={<AddCaptiveForm formType="searching" />}
            />
                        <Route
              path="/archive/add"
              element={<AddCaptiveForm formType="archive" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;


