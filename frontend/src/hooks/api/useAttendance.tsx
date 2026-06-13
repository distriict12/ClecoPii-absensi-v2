import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';

// Hook untuk mengambil semua data riwayat absensi
export const useGetAttendances = () => {
  return useQuery({
    queryKey: ['attendances'],
    queryFn: async () => {
      const response = await Api.get('/attendances');
      return response.data; 
    }
  });
};