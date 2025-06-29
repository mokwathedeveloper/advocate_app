// Registration page component for LegalPro v1.0.1
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Phone, Eye, EyeOff, Scale, GraduationCap, Award, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'advocate'>('client');
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const specializations = [
    'Family Law',
    'Corporate Law',
    'Criminal Defense',
    'Property Law',
    'Employment Law',
    'Constitutional Law',
    'Tax Law',
    'Immigration Law',
    'Intellectual Property',
    'Environmental Law'
  ];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
      userData.role = selectedRole;
      await registerUser(userData);
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-navy-800 mb-2">Create Account</h2>
            <p className="text-gray-600">Join our legal platform</p>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-navy-800 mb-4">I am registering as:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'client'
                    ? 'border-navy-800 bg-navy-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedRole('client')}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-8 h-8 text-navy-800" />
                  <div>
                    <h4 className="font-semibold text-navy-800">Client</h4>
                    <p className="text-sm text-gray-600">Seeking legal services</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'advocate'
                    ? 'border-navy-800 bg-navy-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedRole('advocate')}
              >
                <div className="flex items-center space-x-3">
                  <Scale className="w-8 h-8 text-navy-800" />
                  <div>
                    <h4 className="font-semibold text-navy-800">Advocate</h4>
                    <p className="text-sm text-gray-600">Legal professional (Super Admin)</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                icon={<User className="w-5 h-5 text-gray-400" />}
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'First name is required'
                })}
              />

              <Input
                label="Last Name"
                icon={<User className="w-5 h-5 text-gray-400" />}
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Last name is required'
                })}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              icon={<Phone className="w-5 h-5 text-gray-400" />}
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[+]?[\d\s\-()]+$/,
                  message: 'Invalid phone number'
                }
              })}
            />

            {/* Advocate-specific fields */}
            {selectedRole === 'advocate' && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-medium text-navy-800 mb-4">Professional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="License Number"
                    icon={<Award className="w-5 h-5 text-gray-400" />}
                    error={errors.licenseNumber?.message}
                    {...register('licenseNumber', {
                      required: selectedRole === 'advocate' ? 'License number is required' : false
                    })}
                  />

                  <Input
                    label="Years of Experience"
                    type="number"
                    min="0"
                    icon={<GraduationCap className="w-5 h-5 text-gray-400" />}
                    error={errors.experience?.message}
                    {...register('experience', {
                      required: selectedRole === 'advocate' ? 'Experience is required' : false,
                      min: { value: 0, message: 'Experience cannot be negative' }
                    })}
                  />
                </div>

                <Input
                  label="Education Background"
                  placeholder="e.g., LLB (University of Nairobi), LLM (Harvard)"
                  icon={<GraduationCap className="w-5 h-5 text-gray-400" />}
                  error={errors.education?.message}
                  {...register('education', {
                    required: selectedRole === 'advocate' ? 'Education background is required' : false
                  })}
                />

                <Input
                  label="Bar Admission"
                  placeholder="e.g., Law Society of Kenya, 2015"
                  icon={<FileText className="w-5 h-5 text-gray-400" />}
                  error={errors.barAdmission?.message}
                  {...register('barAdmission', {
                    required: selectedRole === 'advocate' ? 'Bar admission details are required' : false
                  })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Specialization
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {specializations.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={spec}
                          className="rounded border-gray-300 text-navy-800 focus:ring-navy-500"
                          {...register('specialization')}
                        />
                        <span className="text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Password fields */}
            <div className="space-y-4 border-t pt-6">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-navy-800 focus:ring-navy-500 border-gray-300 rounded"
                {...register('terms', { required: 'You must accept the terms and conditions' })}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-navy-800 hover:text-navy-600">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-navy-800 hover:text-navy-600">
                  Privacy Policy
                </Link>
                {selectedRole === 'advocate' && (
                  <span className="block text-xs text-gray-500 mt-1">
                    * Advocate accounts require verification before activation
                  </span>
                )}
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms.message}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {selectedRole === 'advocate' ? 'Register as Advocate (Super Admin)' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-navy-800 hover:text-navy-600"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;