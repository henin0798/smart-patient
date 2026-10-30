import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getToken } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { Appointment, Doctor, MedicalReport, RecordShare } from '../../types';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  FileText,
  Pill,
  Plus,
  KeyRound,
  AlertCircle,
  Building2,
  Download,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [redeemCode, setRedeemCode] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Selected Consultation Workspace state
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<Appointment | null>(null);
  const [prescriptionMedicine, setPrescriptionMedicine] = useState('');
  const [prescriptionDosage, setPrescriptionDosage] = useState('500 mg');
  const [prescriptionFrequency, setPrescriptionFrequency] = useState('Twice daily');
  const [prescriptionFood, setPrescriptionFood] = useState('AFTER_FOOD');
  const [prescriptionDurationDays, setPrescriptionDurationDays] = useState(7);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [rxSuccess, setRxSuccess] = useState<string | null>(null);
  const [rxError, setRxError] = useState<string | null>(null);

  // Doctor Profile Query
  const { data: doctorProfile } = useQuery<Doctor>({
    queryKey: ['doctor-profile'],
    queryFn: () => api.get<Doctor>('/doctors/me/profile'),
  });

  // Doctor Appointments Query
  const { data: appointments = [], isLoading: isApptsLoading } = useQuery<Appointment[]>({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get<Appointment[]>('/doctors/me/appointments'),
  });

  // Active Patient Shares Query for Doctor
  const { data: activeShares = [] } = useQuery<RecordShare[]>({
    queryKey: ['doctor-shares'],
    queryFn: () => api.get<RecordShare[]>('/shares'),
  });

  // Redeem Code Mutation
  const redeemMutation = useMutation({
    mutationFn: (code: string) => api.post<RecordShare>('/shares/redeem', { sharingCode: code }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-shares'] });
      setRedeemSuccess(`Granted access to patient: ${data.patient.fullName} (${data.patient.patientCode})`);
      setRedeemCode('');
      setRedeemError(null);
    },
    onError: (err: any) => {
      setRedeemError(err.message || 'Invalid or expired sharing code.');
      setRedeemSuccess(null);
    },
  });

  // Complete Appointment Mutation
  const completeMutation = useMutation({
    mutationFn: (apptId: number) => api.post(`/appointments/${apptId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
  });

  // Create Prescription Mutation
  const prescriptionMutation = useMutation({
    mutationFn: (body: any) => api.post('/prescriptions', body),
    onSuccess: () => {
      setRxSuccess('Prescription issued successfully and added to patient medication schedule.');
      setRxError(null);
      setTimeout(() => {
        setRxSuccess(null);
        setActiveConsultationAppt(null);
        setPrescriptionMedicine('');
      }, 1800);
    },
    onError: (err: any) => {
      setRxError(err.message || 'Failed to issue prescription.');
    },
  });

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    redeemMutation.mutate(redeemCode.trim().toUpperCase());
  };

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultationAppt) return;
    if (!prescriptionMedicine.trim()) {
      setRxError('Please enter the prescribed medicine name.');
      return;
    }

    const startDate = new Date().toISOString().split('T')[0];
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + prescriptionDurationDays);
    const endDate = endDateObj.toISOString().split('T')[0];

    prescriptionMutation.mutate({
      patientId: activeConsultationAppt.patient.patientId,
      appointmentId: activeConsultationAppt.appointmentId,
      medicine: prescriptionMedicine,
      dosage: prescriptionDosage,
      frequency: prescriptionFrequency,
      startDate,
      endDate,
      foodInstruction: prescriptionFood,
      additionalInstructions: prescriptionInstructions,
      followUpDate: followUpDate || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Doctor Info */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy text-brand-teal flex items-center justify-center font-bold text-lg shrink-0">
            Dr
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-navy">
                {doctorProfile?.fullName || user?.fullName}
              </h1>
              <Badge variant="teal" size="sm">
                {doctorProfile?.specialty || 'Doctor'}
              </Badge>
            </div>
            <div className="text-xs text-brand-muted mt-0.5 flex items-center gap-2">
              <span>{doctorProfile?.qualification}</span>
              {doctorProfile?.hospital && (
                <span>• {doctorProfile.hospital.name} ({doctorProfile.hospital.city})</span>
              )}
            </div>
          </div>
        </div>

        {doctorProfile?.verificationStatus === 'VERIFIED' ? (
          <Badge variant="success" size="md">
            Verified Doctor Account
          </Badge>
        ) : doctorProfile?.verificationStatus === 'REJECTED' ? (
          <Badge variant="error" size="md">
            Verification Rejected
          </Badge>
        ) : (
          <Badge variant="warning" size="md">
            Pending Admin Verification
          </Badge>
        )}
      </div>

      {/* Verification Notice Banner */}
      {doctorProfile?.verificationStatus === 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Account Application Pending Verification</h3>
            <p className="text-xs text-amber-800 mt-1">
              Your doctor registration and medical license reference ({doctorProfile.licenseOrRegistrationReference}) are currently undergoing administrative verification.
              You may explore your workspace and patient consultation schedules; prescription issuance will become fully active once an administrator approves your license.
            </p>
          </div>
        </div>
      )}
      {doctorProfile?.verificationStatus === 'REJECTED' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">Medical Registration Rejected</h3>
            <p className="text-xs text-rose-800 mt-1">
              Your registration reference could not be authenticated against the medical board registry. Please reach out to the hospital administration desk.
            </p>
          </div>
        </div>
      )}

      {/* Sharing Code Redemption Bar */}
      <Card className="p-4 bg-brand-panel/60 border-brand-border/80">
        <form onSubmit={handleRedeemSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center space-x-2 text-brand-navy font-semibold text-xs whitespace-nowrap">
            <KeyRound className="w-4 h-4 text-brand-teal" />
            <span>Redeem Patient Sharing Code:</span>
          </div>
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="e.g. SH-48K2Q9"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-brand-border rounded-xl text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <Button
            type="submit"
            variant="teal"
            size="sm"
            isLoading={redeemMutation.isPending}
          >
            Access Records
          </Button>
        </form>

        {redeemSuccess && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-brand-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
        )}

        {redeemError && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{redeemError}</span>
          </div>
        )}
      </Card>

      {/* Today's & Upcoming Consultations Table */}
      <Card>
        <CardHeader
          title="Scheduled Patient Consultations"
          subtitle="Manage active encounters, view token numbers, and prescribe medications"
          action={
            <Badge variant="primary" size="sm">
              {appointments.length} Total
            </Badge>
          }
        />

        {isApptsLoading ? (
          <div className="py-12 text-center text-sm text-brand-muted">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-muted">
            No patient appointments currently booked.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-panel text-brand-navy text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Token & Ref</th>
                  <th className="py-3 px-4">Patient Name & ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Hospital</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-white">
                {appointments.map((appt) => (
                  <tr key={appt.appointmentId} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-brand-navy">Token #{appt.tokenNumber}</span>
                      <div className="font-mono text-[11px] text-brand-teal">{appt.appointmentReference}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-navy">
                      <div>{appt.patient.fullName}</div>
                      <div className="font-mono text-[11px] text-brand-muted font-normal">
                        {appt.patient.patientCode} • Blood: {appt.patient.bloodGroup || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-brand-navy">{appt.appointmentDate}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {appt.startTime.substring(0, 5)} - {appt.endTime.substring(0, 5)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted">
                      {appt.hospital.name}
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted max-w-xs truncate">
                      {appt.reasonForVisit || 'General review'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          appt.status === 'COMPLETED'
                            ? 'success'
                            : appt.status === 'CANCELLED'
                            ? 'error'
                            : 'info'
                        }
                        size="sm"
                      >
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {appt.status !== 'CANCELLED' && (
                        <>
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => {
                              setActiveConsultationAppt(appt);
                              setRxSuccess(null);
                            }}
                          >
                            Prescribe & Notes
                          </Button>
                          {appt.status !== 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(appt.appointmentId)}
                            >
                              Complete
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Active Patient Sharing Grants Accessible to this Doctor */}
      <Card>
        <CardHeader
          title="Authorised Patient Records"
          subtitle="Patients who have explicitly shared their records with you"
          action={
            <Badge variant="teal" size="sm">
              {activeShares.length} Active Grants
            </Badge>
          }
        />

        {activeShares.length === 0 ? (
          <div className="py-8 text-center text-xs text-brand-muted">
            No patient records currently shared. Patients can provide you with their single-use sharing code.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeShares.map((share) => (
              <div key={share.shareId} className="p-3.5 rounded-xl border border-brand-border bg-brand-bg/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-brand-navy text-sm">
                    {share.patient.fullName}
                  </div>
                  <div className="text-xs text-brand-muted font-mono">
                    {share.patient.patientCode} • Scope: {share.categoryScope}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Expires: {share.expiresAt.replace('T', ' ').substring(0, 16)}
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Consultation & Prescription Modal */}
      <Dialog
        isOpen={!!activeConsultationAppt}
        onClose={() => setActiveConsultationAppt(null)}
        title={`Consultation: ${activeConsultationAppt?.patient.fullName} (${activeConsultationAppt?.patient.patientCode})`}
        description="Prescribe medication, schedule daily doses, and optionally set a follow-up review date."
        maxWidth="xl"
      >
        {rxSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-brand-success mx-auto" />
            <h3 className="font-bold text-lg text-brand-navy">{rxSuccess}</h3>
          </div>
        ) : (
          <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
            {rxError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-brand-error text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rxError}</span>
              </div>
            )}
            <div className="p-3 bg-brand-panel rounded-xl text-xs space-y-1">
              <div>
                <span className="font-semibold text-brand-navy">Patient Allergies:</span>{' '}
                <span className="text-brand-error font-medium">{activeConsultationAppt?.patient.allergies || 'None reported'}</span>
              </div>
              <div>
                <span className="font-semibold text-brand-navy">Blood Group:</span>{' '}
                <span>{activeConsultationAppt?.patient.bloodGroup || 'N/A'}</span>
              </div>
            </div>

            <Input
              label="Medicine Name"
              required
              placeholder="e.g. Atorvastatin, Amoxicillin, Metformin"
              value={prescriptionMedicine}
              onChange={(e) => setPrescriptionMedicine(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dosage"
                required
                placeholder="e.g. 20 mg, 500 mg"
                value={prescriptionDosage}
                onChange={(e) => setPrescriptionDosage(e.target.value)}
              />
              <Input
                label="Frequency"
                required
                placeholder="e.g. Once daily, Twice daily"
                value={prescriptionFrequency}
                onChange={(e) => setPrescriptionFrequency(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Food Instruction"
                value={prescriptionFood}
                onChange={(e) => setPrescriptionFood(e.target.value)}
                options={[
                  { value: 'AFTER_FOOD', label: 'After Food (Recommended)' },
                  { value: 'BEFORE_FOOD', label: 'Before Food' },
                  { value: 'WITH_FOOD', label: 'With Food' },
                  { value: 'NO_RESTRICTION', label: 'No Dietary Restriction' },
                ]}
              />
              <Input
                label="Duration (Days)"
                type="number"
                min="1"
                max="90"
                value={prescriptionDurationDays}
                onChange={(e) => setPrescriptionDurationDays(Number(e.target.value))}
              />
            </div>

            <Input
              label="Additional Clinical Instructions"
              placeholder="e.g. Take with warm water at bedtime. Maintain low sodium diet."
              value={prescriptionInstructions}
              onChange={(e) => setPrescriptionInstructions(e.target.value)}
            />

            <Input
              label="Recommend Clinical Follow-up Date (Optional)"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setActiveConsultationAppt(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                size="md"
                isLoading={prescriptionMutation.isPending}
              >
                Issue Prescription & Schedule
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
