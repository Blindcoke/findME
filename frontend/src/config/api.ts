// config/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export const getCsrfFromCookie = (): string | null => {
    const name = "csrftoken=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");
  
    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }
    return null;
  };

export const fetchUserData = async () => {
  try {
    const response = await fetch(`${API_URL}/me/`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Unauthorized");

    const userData = await response.json();
    return { success: true, data: userData };
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return { success: false, data: null };
  }
};

export const logoutUser = async (csrfToken: string) => {
  try {
    const response = await fetch(`${API_URL}/logout/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to logout:", error);
    return false;
  }
};

  
export const loginUser = async (
  username: string,
  password: string,
  csrfToken: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (response.ok) {
      const userData = await response.json();
      return { success: true, data: userData };
    }
    
    const errorData = await response.json();
    return { success: false, error: errorData.error || "Invalid credentials" };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
};

export const registerUser = async (formData: {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
}): Promise<{ success: boolean; data?: any; error?: string; autoLoginSuccess?: boolean }> => {
  try {
    // First fetch to ensure we have a fresh CSRF token
    await fetch(`${API_URL}/`, { credentials: "include" });
    const csrfToken = getCsrfFromCookie();
    
    const response = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || ""
      },
      body: JSON.stringify(formData),
      credentials: "include", 
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Не вдалося зареєструватися" };
    }

    // Get a fresh CSRF token for login
    await fetch(`${API_URL}/`, { credentials: "include" });
    const loginCsrfToken = getCsrfFromCookie();
    if (!loginCsrfToken) {
      return { success: true, data, autoLoginSuccess: false };
    }
    
    // Attempt automatic login after successful registration
    const loginResult = await loginUser(formData.username, formData.password, loginCsrfToken);
    
    // Return full user data from login for state update
    return { 
      success: true,
      autoLoginSuccess: loginResult.success,
      data: loginResult.data || data,  // Prioritize login data for user state
      error: loginResult.success ? undefined : loginResult.error
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Помилка реєстрації" };
  }
};


type FormType = "informed" | "searching" | "archive";

export const submitCaptiveForm = async (
    values: Record<string, any>,
    csrfToken: string,
    formatDate: (date: Date) => string | null,
    formType: FormType
    ): Promise<{ success: boolean; redirectPath?: string; error?: string }> => {
    try {
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
        if (key === "date_of_birth") {
            const formattedDate = formatDate(value as Date);
            if (formattedDate) formData.append(key, formattedDate);
        } else if (value) {
            formData.append(key, value instanceof File ? value : value.toString());
        }
        });

        const response = await fetch(`${API_URL}/captives/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
        credentials: "include",
        });

        if (!response.ok) throw new Error("Submission failed");

        const redirectPathMap: Record<FormType, string> = {
        informed: "/informated",
        searching: "/searching",
        archive: "/archive",
        };

        return { success: true, redirectPath: redirectPathMap[formType] };
    } catch (err) {
        console.error(err);
        return {
        success: false,
        error: "Не вдалося відправити форму. Будь ласка, спробуйте ще раз.",
        };
    }
};


export const fetchCaptivesByStatus = async (
    status: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(
        `${API_URL}/captives/?status=${encodeURIComponent(status)}`,
        { credentials: "include" }
      );
  
      if (!response.ok) throw new Error("Failed to fetch captives");
  
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Fetch captives error:", error);
      return { success: false, error: "Failed to load data" };
    }
};

export const fetchCaptiveById = async (
    id: string | number
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const response = await fetch(
        `${API_URL}/captives/${id}/`,
        { credentials: "include" }
        );

        if (!response.ok) throw new Error("Не вдалося завантажити дані");

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Fetch captive error:", error);
        return { success: false, error: "Помилка завантаження даних" };
    }
};
  
export const deleteCaptiveById = async (
    id: string | number,
    csrfToken: string
    ): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(
        `${API_URL}/captives/${id}/`,
        {
            method: "DELETE",
            headers: {
            "X-CSRFToken": csrfToken,
            },
            credentials: "include",
        }
        );

        if (!response.ok) throw new Error("Не вдалося видалити особу");

        return { success: true };
    } catch (error) {
        console.error("Delete captive error:", error);
        return { success: false, error: "Помилка видалення особи" };
    }
};


export const checkOwnership = async (
    id: string | number,
    currentUserId: number
    ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    forbidden?: boolean;
    }> => {
    try {
        const response = await fetch(
        `${API_URL}/captives/${id}/`,
        { credentials: "include" }
        );

        if (!response.ok) throw new Error("Не вдалося завантажити дані");

        const data = await response.json();

        if (data.user.id !== currentUserId) {
        return {
            success: false,
            forbidden: true,
            error: "У вас немає прав редагувати цей запис",
        };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Fetch error:", error);
        return {
        success: false,
        error: "Помилка завантаження даних",
        };
    }
};


export const updateCaptive = async (
    id: string | number,
    csrfToken: string,
    formData: FormData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(
        `${API_URL}/captives/${id}/`,
        {
          method: "PATCH",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: formData,
        }
      );
  
      if (!response.ok) throw new Error("Не вдалося оновити запис");
  
      return { success: true };
    } catch (error) {
      console.error("Update error:", error);
      return { success: false, error: "Помилка оновлення запису" };
    }
};

export const searchByAppearance = async (
    csrfToken: string,
    appearance: string,
    status: string
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const response = await fetch(
        `${API_URL}/appearance_search/`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ appearance, status }),
        }
        );

        const data = await response.json();

        if (!response.ok) {
        return { success: false, error: "Failed to search by appearance" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Appearance search error:", error);
        return { success: false, error: "Помилка пошуку за описом" };
    }
};
  
export const searchByPhoto = async (
    csrfToken: string,
    photoFile: File,
    status: string
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const formData = new FormData();
        formData.append("photo", photoFile);
        formData.append("status", status);

        const response = await fetch(
        `${API_URL}/photo_search/`,
        {
            method: "POST",
            headers: {
            "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: formData,
        }
        );

        const data = await response.json();

        if (!response.ok) {
        return { success: false, error: "Failed to search by photo" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Photo search error:", error);
        return { success: false, error: "Помилка пошуку за фото" };
    }
};


export const fetchCaptivesByUserId = async (
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(
        `${API_URL}/captives/?user_id=${userId}`,
        { credentials: "include" }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        return { success: false, error: "Не вдалося завантажити дані про осіб" };
      }
  
      return { success: true, data };
    } catch (error) {
      console.error("Fetch captives by user error:", error);
      return { success: false, error: "Помилка завантаження даних" };
    }
};


export const updateUserProfile = async (
    userId: number,
    formData: { username: string; email: string; password?: string },
    csrfToken: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password || undefined,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || "Не вдалося оновити профіль." };
      }
    } catch (err) {
      console.error("Update user profile error:", err);
      return { success: false, error: "Щось пішло не так. Спробуйте ще раз." };
    }
};


export const deleteUserAccount = async (
    userId: number,
    csrfToken: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      });
  
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: "Не вдалося видалити акаунт." };
      }
    } catch (err) {
      console.error("Delete user account error:", err);
      return { success: false, error: "Щось пішло не так. Спробуйте ще раз." };
    }
};