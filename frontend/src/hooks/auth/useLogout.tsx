import { useContext } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { AuthContext } from "../../context/AuthContext";

export const useLogout = (): (() => void) => {
    const authContext = useContext(AuthContext);
    
    // Tarik setIsAuthenticated dan setUser dari context
    const { setIsAuthenticated, setUser } = authContext!;
    const navigate = useNavigate();

    const logout = (): void => {
        // Hapus data dari cookie
        Cookies.remove("token");
        Cookies.remove("user");

        // Bersihkan state di memory
        setIsAuthenticated(false);
        setUser(null); 

        // Tendang ke halaman login
        navigate("/login");
    };

    return logout;
};