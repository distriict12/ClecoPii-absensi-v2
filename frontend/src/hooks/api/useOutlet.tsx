import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Api from '../../services/api';

// Hook untuk READ (Mengambil semua data Outlet)
export const useGetOutlets = () => {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const response = await Api.get('/outlets');
      return response.data; 
    }
  });
};

// Hook untuk CREATE (Menambah Outlet Baru)
export const useCreateOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newData: any) => {
      const response = await Api.post('/outlets', newData);
      return response.data;
    },
    onSuccess: () => {
      // Refresh data di tabel secara otomatis
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    }
  });
};

// Hook untuk UPDATE (Mengedit Outlet)
export const useUpdateOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await Api.put(`/outlets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    }
  });
};

// Hook untuk DELETE (Menghapus Outlet)
export const useDeleteOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await Api.delete(`/outlets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    }
  });
};  