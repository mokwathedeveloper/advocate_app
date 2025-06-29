import axios from 'axios';

const API_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:5000/api';

export const initiatePayment = async (paymentData: { phoneNumber: string; amount: number; appointmentId?: string }) => {
  const response = await axios.post(`${API_URL}/payments/initiate`, paymentData, {
    withCredentials: true,
  });
  return response.data;
};
