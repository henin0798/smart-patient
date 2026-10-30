import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Activity, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '2004-01-15',
    phone: '',
    bloodGroup: 'O+',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    consent: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [loadingNotice, setLoadingNotice] = useState<string | null>(null);

  useEffect(() => {
    // Proactively pre-warm backend server while user is filling registration
    api.get('/health').catch(() => {});
  }, []);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => {
        setLoadingNotice('Connecting to cloud server (waking up service, please wait a moment)...');
      }, 3000);
    } else {
      setLoadingNotice(null);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!formData.consent) {
      setErrorMessage('You must acknowledge consent to proceed.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const auth = await register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        consent: formData.consent,
      });

      if (auth.patientCode) {
        setCreatedPatientId(auth.patientCode);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check form inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (createdPatientId) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy">Registration Successful!</h2>
            <p className="text-sm text-brand-muted mt-2">
              Your digital patient record has been securely created in MySQL.
            </p>
          </div>

          <div className="p-4 bg-brand-panel rounded-2xl border border-brand-border text-center">
            <div className="text-xs uppercase tracking-wider text-brand-muted font-semibold">
              Assigned Sovereign Patient ID
            </div>
            <div className="text-3xl font-mono font-extrabold text-brand-navy mt-1 tracking-tight">
              {createdPatientId}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Please save this ID. You will use it when scheduling doctor consultations and redeeming medical shares.
            </p>
          </div>

          <Button
            variant="navy"
            size="lg"
            className="w-full"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Health Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-navy flex items-center justify-center text-brand-teal shadow-md">
              <Activity className="w-6 h-6 text-brand-teal" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-brand-navy">SMART</span>
              <span className="text-xl font-bold tracking-tight text-brand-teal ml-1">PATIENT</span>
            </div>
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-brand-navy">
            Create Your Centralized Patient ID
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Register your sovereign electronic health record with full patient data ownership
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-brand-border sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-1 pb-1 border-b border-brand-border">
              1. Personal Demographics
            </div>

            <Input
              label="Full Legal Name"
              name="fullName"
              required
              placeholder="e.g. Deepak Biju"
              value={formData.fullName}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              <Select
                label="Blood Group"
                name="bloodGroup"
                required
                value={formData.bloodGroup}
                onChange={handleChange}
                options={[
                  { value: 'A+', label: 'A Positive (A+)' },
                  { value: 'A-', label: 'A Negative (A-)' },
                  { value: 'B+', label: 'B Positive (B+)' },
                  { value: 'B-', label: 'B Negative (B-)' },
                  { value: 'AB+', label: 'AB Positive (AB+)' },
                  { value: 'AB-', label: 'AB Negative (AB-)' },
                  { value: 'O+', label: 'O Positive (O+)' },
                  { value: 'O-', label: 'O Negative (O-)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Phone"
                name="phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                label="Known Allergies (Optional)"
                name="allergies"
                placeholder="e.g. Penicillin, Peanuts"
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-3 pb-1 border-b border-brand-border">
              2. Emergency Contact
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Emergency Contact Name"
                name="emergencyContactName"
                placeholder="e.g. Sarah Biju (Spouse)"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
              <Input
                label="Emergency Contact Phone"
                name="emergencyContactPhone"
                type="tel"
                placeholder="+91 98765 00000"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>

            <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-3 pb-1 border-b border-brand-border">
              3. Account Credentials
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Username"
                name="username"
                required
                placeholder="e.g. deepak12"
                value={formData.username}
                onChange={handleChange}
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="deepak@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                name="password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                />
                <span className="text-xs text-brand-muted leading-relaxed">
                  I acknowledge that personal health data stored in Smart Patient is encrypted, patient-owned, and accessible to medical personnel solely with my explicit, revocable authorization.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="teal"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Register & Generate Patient ID
            </Button>

            {loadingNotice && (
              <p className="mt-2 text-center text-xs text-brand-teal font-medium animate-pulse">
                {loadingNotice}
              </p>
            )}
          </form>

          <div className="mt-6 text-center text-xs text-brand-muted">
            Already have a Patient ID?{' '}
            <Link to="/login" className="font-semibold text-brand-teal hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
