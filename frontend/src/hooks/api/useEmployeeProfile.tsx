import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';

// Hook untuk mengambil profil lengkap karyawan yang sedang login, 
// termasuk data outlet (lat, lng, radius) untuk keperluan absen GPS
export const useGetMyProfile = () => {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const response = await Api.get('/employees/me');
      return response.data; 
    },
  });
};