import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api'; 

interface LoginRequest {
    pin: string; // <-- HANYA PIN
}

export const useLogin = () => {
    return useMutation({
        mutationFn: async (data: LoginRequest) => {
            const response = await Api.post('/login', data);
            return response.data;
        }
    });
};