import Cookies from 'js-cookie';

// Sesuaikan interface User dengan struktur Golang kita
interface User {
    id: number;
    name: string;
    role: string;
    outlet_id?: number;
}

export const useAuthUser = (): User | null => {
    const user = Cookies.get('user');
    return user ? JSON.parse(user) as User : null;
};