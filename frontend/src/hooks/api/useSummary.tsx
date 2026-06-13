import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';

export const useGetSummary = (outletName: string) => {
  return useQuery({
    queryKey: ['summary', outletName],
    queryFn: async () => {
      const response = await Api.get('/summary', {
        params: { outlet: outletName }
      });
      return response.data; 
    }
  });
};