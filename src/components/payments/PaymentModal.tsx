import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { initiatePayment } from '../../services/paymentService';
import toast from 'react-hot-toast';

interface PaymentFormData {
  phoneNumber: string;
  amount: number;
  appointmentId?: string;
}

interface PaymentModalProps {
  appointmentId?: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ appointmentId, onClose, onPaymentSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true);
    try {
      const response = await initiatePayment({ ...data, appointmentId });
      toast.success('Payment initiated successfully. Please complete the payment on your phone.');
      reset();
      onPaymentSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Make a Payment</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="2547XXXXXXXX"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber', {
              required: 'Phone number is required',
              pattern: {
                value: /^2547\d{8}$/,
                message: 'Phone number must be in format 2547XXXXXXXX'
              }
            })}
          />
          <Input
            label="Amount (KES)"
            type="number"
            min={1}
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 1, message: 'Amount must be at least 1 KES' }
            })}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Pay'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
