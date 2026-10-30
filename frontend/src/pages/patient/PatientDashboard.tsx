import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import {
  Calendar,
  FileText,
  Pill,
  Clock,
  Share2,
  Building2,
  TrendingUp,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PatientDashboardSummary, PatientTimelineEvent } from '../../types';
import { AppointmentCountdown } from '../../components/common/AppointmentCountdown';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  // Summary Metrics Query
  const { data: summary, isLoading: isSummaryLoading } = useQuery<PatientDashboardSummary>({
    queryKey: ['patient-dashboard-summary'],
    queryFn: () => api.get<PatientDashboardSummary>('/patients/me/dashboard'),
  });

  // Timeline Events Query
  const { data: timeline = [], isLoading: isTimelineLoading } = useQuery<PatientTimelineEvent[]>({
    queryKey: ['patient-timeline'],
    queryFn: () => api.get<PatientTimelineEvent[]>('/patients/me/timeline'),
  });

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Patient';

  return (
    <div className="space-y-6">
      {/* Top Greeting & Patient ID */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-teal">
            <span className="w-2 h-2 rounded-full bg-brand-teal"></span>
            Personal Health Dashboard
          </div>
          <h1 className="text-2xl font-bold text-brand-navy mt-1">
            Good day, {firstName} 👋
          </h1>
          <p className="text-sm text-brand-muted">
            Today is{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-brand-panel rounded-xl border border-brand-border text-right">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-brand-muted">
              Patient ID
            </div>
            <div className="text-lg font-bold font-mono text-brand-navy">
              {summary?.patientCode || user?.patientCode || 'PT-2026-XXXX'}
            </div>
          </div>
          <Link to="/sharing">
            <Button variant="teal" size="md" icon={<Share2 className="w-4 h-4" />}>
              Share Records
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Countdown Banner for nearest Appointment or Follow-up */}
      {summary?.upcomingAppointmentDateTime ? (
        <AppointmentCountdown
          targetDateTime={summary.upcomingAppointmentDateTime}
          title="Upcoming Consultation Countdown"
          subtitle={`With ${summary.upcomingAppointmentDoctor} (${summary.upcomingAppointmentSpecialty}) at ${summary.upcomingAppointmentHospital}`}
        />
      ) : summary?.nextFollowUpDate ? (
        <AppointmentCountdown
          targetDateTime={summary.nextFollowUpDate}
          title="Next Scheduled Follow-up Review"
          subtitle={`With ${summary.nextFollowUpDoctor || 'Physician'}: ${summary.nextFollowUpReason || 'Routine review'}`}
        />
      ) : null}

      {/* Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Appointment */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-brand-navy border border-sky-100">
              <Calendar className="w-5 h-5 text-brand-navy" />
            </div>
            <Badge variant={summary?.upcomingAppointmentDateTime ? 'info' : 'neutral'}>
              {summary?.upcomingAppointmentDateTime ? 'Upcoming' : 'None'}
            </Badge>
          </div>
          <div className="text-xs text-brand-muted font-medium">Upcoming Appointment</div>
          {summary?.upcomingAppointmentDoctor ? (
            <div className="mt-1">
              <div className="font-bold text-brand-navy text-base truncate">
                {summary.upcomingAppointmentDoctor}
              </div>
              <div className="text-xs text-brand-muted truncate mt-0.5">
                {summary.upcomingAppointmentSpecialty} • {summary.upcomingAppointmentHospital}
              </div>
              <div className="text-xs font-semibold text-brand-navy mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-teal" />
                {summary.upcomingAppointmentDateTime}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-brand-muted">
              No scheduled appointments.{' '}
              <Link to="/appointments" className="text-brand-teal font-semibold hover:underline block mt-1">
                Book a consultation →
              </Link>
            </div>
          )}
        </Card>

        {/* Card 2: Latest Medical Report */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-brand-teal border border-teal-100">
              <FileText className="w-5 h-5 text-brand-teal" />
            </div>
            <Badge variant={summary?.latestReportTitle ? 'teal' : 'neutral'}>
              {summary?.latestReportType || 'None'}
            </Badge>
          </div>
          <div className="text-xs text-brand-muted font-medium">Latest Medical Report</div>
          {summary?.latestReportTitle ? (
            <div className="mt-1">
              <div className="font-bold text-brand-navy text-base truncate" title={summary.latestReportTitle}>
                {summary.latestReportTitle}
              </div>
              <div className="text-xs text-brand-muted mt-0.5">
                Dated: {summary.latestReportDate}
              </div>
              <Link
                to="/reports"
                className="text-xs font-semibold text-brand-teal hover:underline mt-2 inline-flex items-center gap-1"
              >
                View Report & Scans →
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-xs text-brand-muted">
              No reports uploaded yet.{' '}
              <Link to="/reports" className="text-brand-teal font-semibold hover:underline block mt-1">
                Upload lab result →
              </Link>
            </div>
          )}
        </Card>

        {/* Card 3: Today's Medication Adherence */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-brand-warning border border-amber-100">
              <Pill className="w-5 h-5 text-brand-warning" />
            </div>
            <Badge variant={summary && summary.totalDosesToday > 0 ? 'warning' : 'neutral'}>
              {summary && summary.totalDosesToday > 0
                ? `${summary.takenDosesToday}/${summary.totalDosesToday} Taken`
                : 'No Doses'}
            </Badge>
          </div>
          <div className="text-xs text-brand-muted font-medium">Today's Dose Adherence</div>
          {summary && summary.totalDosesToday > 0 ? (
            <div className="mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-brand-navy">
                  {Math.round((summary.takenDosesToday / summary.totalDosesToday) * 100)}%
                </span>
                <span className="text-xs text-brand-muted">completed</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-brand-warning h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((summary.takenDosesToday / summary.totalDosesToday) * 100)}%`,
                  }}
                />
              </div>
              <Link
                to="/medicines"
                className="text-xs font-semibold text-brand-warning hover:underline mt-2 inline-flex items-center gap-1"
              >
                Log daily dose →
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-xs text-brand-muted">
              No medication doses scheduled for today.{' '}
              <Link to="/medicines" className="text-brand-teal font-semibold hover:underline block mt-1">
                View full schedule →
              </Link>
            </div>
          )}
        </Card>

        {/* Card 4: Next Follow-up Review */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Clock className="w-5 h-5 text-purple-700" />
            </div>
            <Badge variant={summary?.nextFollowUpDate ? 'primary' : 'neutral'}>
              {summary?.nextFollowUpDate ? 'Scheduled' : 'None'}
            </Badge>
          </div>
          <div className="text-xs text-brand-muted font-medium">Follow-up Target</div>
          {summary?.nextFollowUpDate ? (
            <div className="mt-1">
              <div className="font-bold text-brand-navy text-base">
                {summary.nextFollowUpDate}
              </div>
              <div className="text-xs text-brand-muted truncate mt-0.5">
                Doctor: {summary.nextFollowUpDoctor || 'Attending Physician'}
              </div>
              <Link
                to="/follow-ups"
                className="text-xs font-semibold text-brand-teal hover:underline mt-2 inline-flex items-center gap-1"
              >
                View follow-up details →
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-xs text-brand-muted">
              No pending clinical reviews.{' '}
              <Link to="/follow-ups" className="text-brand-teal font-semibold hover:underline block mt-1">
                Review history →
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-brand-teal" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Need to consult a healthcare provider?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Browse approved hospital departments, doctor profiles, and real-time scheduling slots.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/find-care">
            <Button variant="secondary" size="sm">
              Find Hospitals
            </Button>
          </Link>
          <Link to="/appointments">
            <Button variant="teal" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
              Book Consultation
            </Button>
          </Link>
        </div>
      </div>

      {/* Clinical Timeline */}
      <Card>
        <CardHeader
          title="Clinical Timeline & Recent Activity"
          subtitle="Consolidated chronological record of medical consultations, diagnostic uploads, and prescription schedules."
          action={
            <Link to="/reports">
              <Button variant="outline" size="sm" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                Detailed Analysis
              </Button>
            </Link>
          }
        />

        {isTimelineLoading ? (
          <div className="py-8 text-center text-xs text-brand-muted">Loading clinical events...</div>
        ) : timeline.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-brand-muted">No clinical events recorded on this patient record yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Events will appear as appointments are attended, prescriptions are issued, and reports are uploaded.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border">
            {timeline.map((event) => (
              <div key={event.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    event.badgeType === 'success'
                      ? 'bg-brand-success'
                      : event.badgeType === 'error'
                      ? 'bg-brand-error'
                      : event.badgeType === 'warning'
                      ? 'bg-brand-warning'
                      : 'bg-brand-teal'
                  }`}
                />
                <div className="bg-brand-bg/70 p-4 rounded-xl border border-brand-border/80 hover:border-brand-teal/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <span className="font-semibold text-sm text-brand-navy">{event.title}</span>
                    <span className="text-[11px] text-brand-muted">
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
