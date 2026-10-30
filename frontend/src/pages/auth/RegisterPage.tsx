import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { Hospital, UserRole } from '../../types';
import {
  Activity,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Stethoscope,
  User,
  Clock,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: PATIENT vs DOCTOR
  const initialRole = searchParams.get('role') === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);

  // Patient Form Data
  const [patientData, setPatientData] = useState({
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

  // Doctor Form Data
  const [doctorData, setDoctorData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: 'General Medicine',
    qualification: 'MBBS, MD',
    licenseOrRegistrationReference: '',
    hospitalId: '',
    consent: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [doctorRegistrationSuccess, setDoctorRegistrationSuccess] = useState<any | null>(null);
  const [loadingNotice, setLoadingNotice] = useState<string | null>(null);

  // Fetch hospitals list for doctor hospital affiliation
  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals-list'],
    queryFn: () => api.get<Hospital[]>('/hospitals'),
    enabled: selectedRole === 'DOCTOR',
  });

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

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPatientData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setPatientData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDoctorData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setDoctorData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.password !== patientData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!patientData.consent) {
      setErrorMessage('You must acknowledge consent to proceed.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const auth = await register({
        fullName: patientData.fullName,
        username: patientData.username,
        email: patientData.email,
        password: patientData.password,
        dateOfBirth: patientData.dateOfBirth,
        phone: patientData.phone,
        bloodGroup: patientData.bloodGroup,
        allergies: patientData.allergies,
        emergencyContactName: patientData.emergencyContactName,
        emergencyContactPhone: patientData.emergencyContactPhone,
        consent: patientData.consent,
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

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (doctorData.password !== doctorData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!doctorData.licenseOrRegistrationReference.trim()) {
      setErrorMessage('Medical License Reference is mandatory for regulatory compliance.');
      return;
    }
    if (!doctorData.consent) {
      setErrorMessage('You must acknowledge consent to proceed.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.post<any>('/auth/register-doctor', {
        fullName: doctorData.fullName,
        username: doctorData.username,
        email: doctorData.email,
        password: doctorData.password,
        specialty: doctorData.specialty,
        qualification: doctorData.qualification,
        licenseOrRegistrationReference: doctorData.licenseOrRegistrationReference,
        hospitalId: doctorData.hospitalId ? Number(doctorData.hospitalId) : null,
      });

      setDoctorRegistrationSuccess({
        fullName: doctorData.fullName,
        specialty: doctorData.specialty,
        license: doctorData.licenseOrRegistrationReference,
        username: doctorData.username,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Doctor registration failed. Please check credentials or username/email uniqueness.');
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

  if (doctorRegistrationSuccess) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy">Application Submitted!</h2>
            <div className="mt-2 inline-block">
              <Badge variant="warning" size="md">
                Status: PENDING_APPROVAL
              </Badge>
            </div>
            <p className="text-xs text-brand-muted mt-3 leading-relaxed">
              Dr. {doctorRegistrationSuccess.fullName}, your registration application has been logged.
              Hospital administration will verify your medical license (<strong className="font-mono">{doctorRegistrationSuccess.license}</strong>) before granting full clinical privileges.
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-2">
            <div className="font-semibold text-amber-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>What happens next?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              You can log in now using username <code className="font-mono font-bold">{doctorRegistrationSuccess.username}</code> to explore your clinical workspace. Prescribing actions and medical records will be unlocked upon admin verification.
            </p>
          </div>

          <Button
            variant="navy"
            size="lg"
            className="w-full"
            onClick={() => navigate('/login')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Go to Doctor Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
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
            {selectedRole === 'PATIENT' ? 'Create Your Centralized Patient ID' : 'Doctor Practice Registration'}
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            {selectedRole === 'PATIENT'
              ? 'Register your sovereign electronic health record with patient data ownership'
              : 'Join the verified Smart Patient clinical network to manage appointments & patient records'}
          </p>
        </div>

        {/* Role Switcher Tab */}
        <div className="mb-6 grid grid-cols-2 gap-2 bg-brand-panel p-1.5 rounded-2xl border border-brand-border">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('PATIENT');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              selectedRole === 'PATIENT'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-navy'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient Registration</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('DOCTOR');
              setErrorMessage(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              selectedRole === 'DOCTOR'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-navy'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Registration</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-brand-border sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {selectedRole === 'PATIENT' ? (
            /* Patient Registration Form */
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-1 pb-1 border-b border-brand-border">
                1. Personal Demographics
              </div>

              <Input
                label="Full Legal Name"
                name="fullName"
                required
                placeholder="e.g. Deepak Biju"
                value={patientData.fullName}
                onChange={handlePatientChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={patientData.dateOfBirth}
                  onChange={handlePatientChange}
                />
                <Select
                  label="Blood Group"
                  name="bloodGroup"
                  required
                  value={patientData.bloodGroup}
                  onChange={handlePatientChange}
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
                  value={patientData.phone}
                  onChange={handlePatientChange}
                />
                <Input
                  label="Known Allergies (Optional)"
                  name="allergies"
                  placeholder="e.g. Penicillin, Peanuts"
                  value={patientData.allergies}
                  onChange={handlePatientChange}
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
                  value={patientData.emergencyContactName}
                  onChange={handlePatientChange}
                />
                <Input
                  label="Emergency Contact Phone"
                  name="emergencyContactPhone"
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={patientData.emergencyContactPhone}
                  onChange={handlePatientChange}
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
                  value={patientData.username}
                  onChange={handlePatientChange}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  placeholder="deepak@example.com"
                  value={patientData.email}
                  onChange={handlePatientChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={patientData.password}
                  onChange={handlePatientChange}
                />
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={patientData.confirmPassword}
                  onChange={handlePatientChange}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={patientData.consent}
                    onChange={handlePatientChange}
                    className="mt-1 h-4 w-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                  />
                  <span className="text-xs text-brand-muted leading-relaxed">
                    I acknowledge that personal health data stored in Smart Patient is encrypted, patient-owned, and accessible to medical personnel solely with my explicit authorization.
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
            </form>
          ) : (
            /* Doctor Registration Form */
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-1 pb-1 border-b border-brand-border">
                1. Professional Credentials
              </div>

              <Input
                label="Full Doctor Name (with Title)"
                name="fullName"
                required
                placeholder="e.g. Dr. Rajesh Kumar"
                value={doctorData.fullName}
                onChange={handleDoctorChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Medical Specialty"
                  name="specialty"
                  required
                  value={doctorData.specialty}
                  onChange={handleDoctorChange}
                  options={[
                    { value: 'General Medicine', label: 'General Medicine' },
                    { value: 'Cardiology', label: 'Cardiology' },
                    { value: 'Pediatrics', label: 'Pediatrics' },
                    { value: 'Orthopedics', label: 'Orthopedics' },
                    { value: 'Dermatology', label: 'Dermatology' },
                    { value: 'Neurology', label: 'Neurology' },
                    { value: 'Gynecology', label: 'Gynecology' },
                    { value: 'ENT', label: 'ENT / Otolaryngology' },
                  ]}
                />
                <Input
                  label="Qualifications"
                  name="qualification"
                  required
                  placeholder="e.g. MBBS, MD, FRCS"
                  value={doctorData.qualification}
                  onChange={handleDoctorChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Medical License / Registration Reference"
                  name="licenseOrRegistrationReference"
                  required
                  placeholder="e.g. KMC-2024-8976"
                  value={doctorData.licenseOrRegistrationReference}
                  onChange={handleDoctorChange}
                />
                <Select
                  label="Primary Hospital Affiliation (Optional)"
                  name="hospitalId"
                  value={doctorData.hospitalId}
                  onChange={handleDoctorChange}
                  options={[
                    { value: '', label: 'Independent / Select Hospital' },
                    ...hospitals.map((h) => ({
                      value: String(h.hospitalId),
                      label: `${h.name} (${h.city})`,
                    })),
                  ]}
                />
              </div>

              <div className="text-xs uppercase font-bold tracking-wider text-brand-teal pt-3 pb-1 border-b border-brand-border">
                2. Practice Login Credentials
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Username"
                  name="username"
                  required
                  placeholder="e.g. dr.rajesh"
                  value={doctorData.username}
                  onChange={handleDoctorChange}
                />
                <Input
                  label="Professional Email Address"
                  name="email"
                  type="email"
                  required
                  placeholder="dr.rajesh@hospital.org"
                  value={doctorData.email}
                  onChange={handleDoctorChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={doctorData.password}
                  onChange={handleDoctorChange}
                />
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={doctorData.confirmPassword}
                  onChange={handleDoctorChange}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={doctorData.consent}
                    onChange={handleDoctorChange}
                    className="mt-1 h-4 w-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                  />
                  <span className="text-xs text-brand-muted leading-relaxed">
                    I certify that the license and registration credentials provided are genuine and up-to-date with medical regulatory bodies. I understand account actions remain under administrative review until approved.
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
                Submit Doctor Registration
              </Button>
            </form>
          )}

          {loadingNotice && (
            <p className="mt-2 text-center text-xs text-brand-teal font-medium animate-pulse">
              {loadingNotice}
            </p>
          )}

          <div className="mt-6 text-center text-xs text-brand-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-teal hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
