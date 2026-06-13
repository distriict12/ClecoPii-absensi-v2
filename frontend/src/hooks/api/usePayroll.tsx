import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';

// Hook untuk mengambil rekap gaji berdasarkan rentang tanggal
export const useGetPayrolls = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['payrolls', startDate, endDate], // Cache akan terpisah berdasarkan tanggal
    queryFn: async () => {
      const response = await Api.get('/payrolls', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data; 
    },
    enabled: !!startDate && !!endDate, // Cegah fetch jika tanggal kosong
  });
};