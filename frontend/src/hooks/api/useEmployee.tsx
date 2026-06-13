import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Api from '../../services/api';

// Hook untuk READ — showInactive=true akan fetch termasuk karyawan nonaktif
export const useGetEmployees = (showInactive = false) => {
  return useQuery({
    queryKey: ['employees', showInactive],
    queryFn: async () => {
      const response = await Api.get('/employees', {
        params: showInactive ? { show_inactive: 'true' } : {}
      });
      return response.data;
    }
  });
};

// Hook untuk READ (dropdown outlet)
export const useGetOutletsForDropdown = () => {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const response = await Api.get('/outlets');
      return response.data;
    }
  });
};

// Hook untuk CREATE
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newData: any) => {
      const response = await Api.post('/employees', newData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

// Hook untuk UPDATE
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await Api.put(`/employees/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

// Hook untuk SOFT DELETE (nonaktifkan)
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await Api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

// Hook untuk REAKTIVASI (aktifkan kembali karyawan nonaktif)
export const useReactivateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await Api.patch(`/employees/${id}/reactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};