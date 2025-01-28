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
import { csrfToken } from "./csrf";

interface User {
  id: number;
  username: string;
  email: string;
}



const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);


  const fetchUserData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/me/`, {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const onLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/logout/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        console.error("Failed to logout");
      }
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLoginSuccess = async () => {
    await fetchUserData();
  };

  const refreshUser = async () => {
    await fetchUserData();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-800">
        <div className="container mx-auto p-4">
          <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

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
                          Розшукові оголошення
                        </h2>
                        <p className="text-lg">
                          Переглянути оголошення або додати розшукувану особу
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
                          Переглянути осіб, про яких маються дані, або додати інформацію
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
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<UserSettings user={user} refreshUser={refreshUser} />} />
            <Route path="/informated/:id" element={<CaptiveDetails />} />
            <Route
              path="/informated/add"
              element={<AddCaptiveForm formType="informed" />}
            />
            <Route
              path="/searching/add"
              element={<AddCaptiveForm formType="searching" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;


