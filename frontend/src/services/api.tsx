/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import Cookies from 'js-cookie';
import { Employee, AttendanceRecord, PayrollRecord, Outlet } from '../types';

const Api = axios.create({
  baseURL: 'http://localhost:3000/api'
  // baseURL: 'https://kt9v7q8r-3000.asse.devtunnels.ms/api'
});

// ============================================================
// INTERCEPTORS
// ============================================================
Api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath === '/';

      if (!isLoginPage) {

        setTimeout(() => {
          Cookies.remove('token');
          Cookies.remove('user');
          window.location.href = '/login';
        }, 300);
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// EMPLOYEE API
// ============================================================
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await Api.get('/employees');
  return response.data;
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  const response = await Api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  const response = await Api.post('/employees', employee);
  return response.data;
};

export const updateEmployee = async (id: string, employee: Partial<Employee>): Promise<Employee> => {
  const response = await Api.put(`/employees/${id}`, employee);
  return response.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await Api.delete(`/employees/${id}`);
};

// ============================================================
// ATTENDANCE API
// ============================================================
export const getAttendance = async (params?: {
  startDate?: string;
  endDate?: string;
  outletId?: string;
  employeeId?: string;
}): Promise<AttendanceRecord[]> => {
  const response = await Api.get('/attendances', { params });
  return response.data;
};

export const getAttendanceById = async (id: string): Promise<AttendanceRecord> => {
  const response = await Api.get(`/attendances/${id}`);
  return response.data;
};

export const createAttendance = async (data: any) => {
  const response = await Api.post('/attendances', data);
  return response.data;
};


export const updateAttendance = async (
  id: string | number,
  data: { exit_time: string; exit_photo: string }
) => {
  const response = await Api.put(`/attendances/${id}`, data);
  return response.data;
};

export const getAttendances = async () => {
  const response = await Api.get('/attendances');
  return response.data;
};

// ============================================================
// PAYROLL API
// ============================================================
export const getPayroll = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<PayrollRecord[]> => {
  const response = await Api.get('/payrolls', { params });
  return response.data;
};

// ============================================================
// OUTLET API
// ============================================================
export const getOutlets = async (): Promise<Outlet[]> => {
  const response = await Api.get('/outlets');
  return response.data;
};

export const getOutletById = async (id: string): Promise<Outlet> => {
  const response = await Api.get(`/outlets/${id}`);
  return response.data;
};

export const createOutlet = async (outlet: Omit<Outlet, 'id'>): Promise<Outlet> => {
  const response = await Api.post('/outlets', outlet);
  return response.data;
};

export const updateOutlet = async (id: string, outlet: Partial<Outlet>): Promise<Outlet> => {
  const response = await Api.put(`/outlets/${id}`, outlet);
  return response.data;
};

export const deleteOutlet = async (id: string): Promise<void> => {
  await Api.delete(`/outlets/${id}`);
};

export default Api;