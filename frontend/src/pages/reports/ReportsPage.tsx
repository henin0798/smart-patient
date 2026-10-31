import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import {
  MedicalReport,
  ReportType,
  ReportComparisonResult,
  SavedReportComparison,
} from '../../types';
import { printOrDownloadComparisonPdf } from '../../utils/reportPdfGenerator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  Upload,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Search,
  Filter,
  History,
  Printer,
  Calendar,
  Activity,
  ArrowUpDown,
  FileCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

type TabSelection = ReportType | 'ALL' | 'COMPARISONS';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<TabSelection>('ALL');

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteComparisonConfirmId, setDeleteComparisonConfirmId] = useState<number | null>(null);

  // Comparison State
  const [olderReportId, setOlderReportId] = useState<number | null>(null);
  const [newerReportId, setNewerReportId] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ReportComparisonResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<ReportType>('LAB');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [structuredValues, setStructuredValues] = useState<
    Array<{ testName: string; numericValue: string; unit: string; min: string; max: string }>
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoDetectedNotice, setAutoDetectedNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Query patient reports
  const { data: allReports = [], isLoading: isLoadingReports } = useQuery<MedicalReport[]>({
    queryKey: ['medical-reports'],
    queryFn: () => api.get<MedicalReport[]>('/reports'),
  });

  // Query comparison history
  const { data: savedComparisons = [], isLoading: isLoadingComparisons } = useQuery<SavedReportComparison[]>({
    queryKey: ['report-comparisons'],
    queryFn: () => api.get<SavedReportComparison[]>('/reports/comparisons'),
  });

  // Filtered Lab Reports for the comparison dropdowns
  const allLabReports = useMemo(() => {
    return allReports.filter((r) => r.reportType === 'LAB');
  }, [allReports]);

  // Filtered & Sorted reports based on search, active tab and sorting
  const filteredReports = useMemo(() => {
    let result = [...allReports];

    // Filter by tab if not ALL and not COMPARISONS
    if (activeTab !== 'ALL' && activeTab !== 'COMPARISONS') {
      result = result.filter((r) => r.reportType === activeTab);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.reportTitle.toLowerCase().includes(q) ||
          r.originalFilename.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime();
      } else {
        return a.reportTitle.localeCompare(b.reportTitle);
      }
    });

    return result;
  }, [allReports, activeTab, searchTerm, sortOrder]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.post<any>('/reports/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reports'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      setIsUploadModalOpen(false);
      resetUploadForm();
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Failed to upload document.');
    },
  });

  // Delete Report Mutation
  const deleteMutation = useMutation({
    mutationFn: (reportId: number) => api.delete(`/reports/${reportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-comparisons'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-summary'] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      setPageError(err.message || 'Failed to delete report.');
      setDeleteConfirmId(null);
    },
  });

  // Compare Mutation
  const compareMutation = useMutation({
    mutationFn: (body: { olderReportId: number; newerReportId: number }) =>
      api.post<ReportComparisonResult>('/reports/compare', body),
    onSuccess: (data) => {
      setComparisonResult(data);
      setCompareError(null);
      queryClient.invalidateQueries({ queryKey: ['report-comparisons'] });
    },
    onError: (err: any) => {
      setCompareError(err.message || 'Comparison failed.');
    },
  });

  // Delete Comparison Mutation
  const deleteComparisonMutation = useMutation({
    mutationFn: (comparisonId: number) => api.delete(`/reports/comparisons/${comparisonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-comparisons'] });
      setDeleteComparisonConfirmId(null);
      if (comparisonResult && comparisonResult.comparisonId === deleteComparisonConfirmId) {
        setComparisonResult(null);
      }
    },
    onError: (err: any) => {
      setPageError(err.message || 'Failed to delete saved comparison.');
      setDeleteComparisonConfirmId(null);
    },
  });

  // Load single comparison detail
  const loadSavedComparisonDetail = async (comp: SavedReportComparison) => {
    try {
      const data = await api.get<ReportComparisonResult>(`/reports/comparisons/${comp.comparisonId}`);
      setComparisonResult(data);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      setPageError(err.message || 'Failed to load comparison details.');
    }
  };


  const parseLabValuesFromText = (text: string) => {
    const biomarkers = [
      { name: 'Hemoglobin', regex: /\b(Hemoglobin|Hb|Hgb)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'g/dL', defaultMin: '12.0', defaultMax: '16.0' },
      { name: 'Total Cholesterol', regex: /\b(Total Cholesterol|Cholesterol|Chol)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '125', defaultMax: '200' },
      { name: 'HDL Cholesterol', regex: /\b(HDL|HDL Cholesterol)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '40', defaultMax: '60' },
      { name: 'LDL Cholesterol', regex: /\b(LDL|LDL Cholesterol)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '50', defaultMax: '100' },
      { name: 'Triglycerides', regex: /\b(Triglycerides|TG|Trig)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '50', defaultMax: '150' },
      { name: 'Fasting Blood Sugar', regex: /\b(Fasting Blood Sugar|Blood Sugar|Glucose|FBS)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '70', defaultMax: '99' },
      { name: 'Platelets', regex: /\b(Platelets|Platelet Count|PLT)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: '10^3/uL', defaultMin: '150', defaultMax: '450' },
      { name: 'WBC', regex: /\b(WBC|White Blood Cells|TLC)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: '10^3/uL', defaultMin: '4.5', defaultMax: '11.0' },
      { name: 'RBC', regex: /\b(RBC|Red Blood Cells)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: '10^6/uL', defaultMin: '4.2', defaultMax: '5.8' },
      { name: 'Serum Creatinine', regex: /\b(Serum Creatinine|Creatinine)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '0.7', defaultMax: '1.3' },
      { name: 'Uric Acid', regex: /\b(Uric Acid)\b[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*([a-zA-Z/%^0-9]+)?(?:[^\d\r\n]{0,25}(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?))?/i, defaultUnit: 'mg/dL', defaultMin: '3.5', defaultMax: '7.2' },
    ];

    const results: Array<{ testName: string; numericValue: string; unit: string; min: string; max: string }> = [];
    const seen = new Set<string>();

    for (const b of biomarkers) {
      const match = text.match(b.regex);
      if (match && match[2] && !seen.has(b.name)) {
        seen.add(b.name);
        let unit = match[3] ? match[3].trim() : b.defaultUnit;
        if (unit.toLowerCase() === 'mg' || unit.toLowerCase() === 'dl') unit = 'mg/dL';
        results.push({
          testName: b.name,
          numericValue: match[2],
          unit: unit,
          min: match[4] || b.defaultMin,
          max: match[5] || b.defaultMax,
        });
      }
    }
    return results;
  };

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setAutoDetectedNotice(null);
    if (!file) return;

    if (!uploadTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setUploadTitle(cleanName);
    }

    try {
      const text = await file.text();
      if (text && text.length > 0) {
        const detected = parseLabValuesFromText(text);
        if (detected.length > 0) {
          setStructuredValues(detected);
          setUploadType('LAB');
          setAutoDetectedNotice(`✨ Auto-detected ${detected.length} test parameter(s) from "${file.name}". You can review or adjust them below.`);
        }
      }
    } catch {
      // Ignored for binary files
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadType('LAB');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setUploadDesc('');
    setSelectedFile(null);
    setStructuredValues([]);
    setUploadError(null);
  };

  const handleAddStructuredValue = () => {
    setStructuredValues((prev) => [
      ...prev,
      { testName: '', numericValue: '', unit: 'mg/dL', min: '', max: '' },
    ]);
  };

  const handleRemoveStructuredValue = (index: number) => {
    setStructuredValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF, PNG, or JPEG file to upload.');
      return;
    }

    setUploadError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('reportTitle', uploadTitle);
    formData.append('reportType', uploadType);
    formData.append('reportDate', uploadDate);
    if (uploadDesc) formData.append('description', uploadDesc);

    if (uploadType === 'LAB' && structuredValues.length > 0) {
      const formatted = structuredValues
        .filter((v) => v.testName.trim() && v.numericValue.trim())
        .map((v) => ({
          testName: v.testName.trim(),
          normalizedTestKey: v.testName.trim().toUpperCase().replace(/\s+/g, '_'),
          numericValue: parseFloat(v.numericValue),
          unit: v.unit.trim(),
          referenceRangeMin: v.min ? parseFloat(v.min) : null,
          referenceRangeMax: v.max ? parseFloat(v.max) : null,
        }));
      formData.append('structuredValuesJson', JSON.stringify(formatted));
    }

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (reportId: number, filename: string) => {
    try {
      const blob = await api.get<Blob>(`/reports/${reportId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setPageError(err.message || 'Download permission denied or file not found.');
      setTimeout(() => setPageError(null), 5000);
    }
  };

  const handleTriggerCompare = () => {
    if (!olderReportId || !newerReportId) {
      setCompareError('Please select two laboratory reports to compare.');
      return;
    }
    if (olderReportId === newerReportId) {
      setCompareError('Please choose two distinct reports to compare.');
      return;
    }
    setCompareError(null);
    compareMutation.mutate({ olderReportId, newerReportId });
  };

  const handleDownloadPdf = () => {
    if (!comparisonResult) return;
    printOrDownloadComparisonPdf(comparisonResult, {
      patientName: user?.fullName,
      patientCode: user?.patientCode,
    });
  };

  // Recharts data preparation for the comparison
  const chartData = useMemo(() => {
    if (!comparisonResult?.matchedMetrics) return [];
    return comparisonResult.matchedMetrics.map((m) => ({
      name: m.testName.length > 15 ? m.testName.slice(0, 15) + '…' : m.testName,
      fullName: m.testName,
      unit: m.unit,
      Baseline: m.olderValue,
      FollowUp: m.newerValue,
      difference: m.difference,
      trend: m.trend,
    }));
  }, [comparisonResult]);

  const getReportTypeBadge = (type: ReportType) => {
    switch (type) {
      case 'LAB':
        return <Badge variant="teal" size="sm">Lab Report</Badge>;
      case 'SCAN':
        return <Badge variant="primary" size="sm">Diagnostic Scan</Badge>;
      case 'PRESCRIPTION':
        return <Badge variant="warning" size="sm">Prescription</Badge>;
      case 'CERTIFICATE':
        return <Badge variant="info" size="sm">Certificate</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Notification Alerts */}
      {pageError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pageError}</span>
          </div>
          <button onClick={() => setPageError(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Medical Documents & Analytics</h1>
          <p className="text-sm text-brand-muted mt-1">
            Securely store, organize, search, and analyze your longitudinal health reports and clinical scans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<TrendingUp className="w-4 h-4 text-brand-teal" />}
            onClick={() => {
              if (allLabReports.length >= 2) {
                setOlderReportId(allLabReports[1].reportId);
                setNewerReportId(allLabReports[0].reportId);
              }
              setIsCompareModalOpen(true);
            }}
          >
            Compare Reports
          </Button>
          <Button
            variant="teal"
            size="md"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'ALL'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Documents ({allReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('LAB')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'LAB'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lab Reports</span>
        </button>
        <button
          onClick={() => setActiveTab('SCAN')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'SCAN'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Imaging & Scans</span>
        </button>
        <button
          onClick={() => setActiveTab('PRESCRIPTION')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'PRESCRIPTION'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Prescriptions</span>
        </button>
        <button
          onClick={() => setActiveTab('CERTIFICATE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'CERTIFICATE'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Certificates</span>
        </button>
        <button
          onClick={() => setActiveTab('OTHER')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'OTHER'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
          }`}
        >
          <span>Other</span>
        </button>
        <button
          onClick={() => setActiveTab('COMPARISONS')}
          className={`ml-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'COMPARISONS'
              ? 'bg-brand-teal text-white shadow-sm'
              : 'text-brand-teal border border-brand-teal/40 hover:bg-brand-teal/10'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Comparison History ({savedComparisons.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'COMPARISONS' ? (
        /* Comparison History View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-navy">Saved Laboratory Comparisons</h2>
            <Button
              variant="teal"
              size="sm"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              onClick={() => {
                if (allLabReports.length >= 2) {
                  setOlderReportId(allLabReports[1].reportId);
                  setNewerReportId(allLabReports[0].reportId);
                }
                setIsCompareModalOpen(true);
              }}
            >
              New Comparison
            </Button>
          </div>

          {isLoadingComparisons ? (
            <div className="py-12 text-center text-sm text-brand-muted">Loading saved comparisons...</div>
          ) : savedComparisons.length === 0 ? (
            <Card className="py-12 text-center">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-brand-navy">No comparisons saved yet</h3>
              <p className="text-xs text-brand-muted mt-1 max-w-md mx-auto">
                Compare two laboratory reports over time to track key biomakers and longitudinal trends.
              </p>
              <Button
                variant="teal"
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (allLabReports.length >= 2) {
                    setOlderReportId(allLabReports[1].reportId);
                    setNewerReportId(allLabReports[0].reportId);
                  }
                  setIsCompareModalOpen(true);
                }}
              >
                Create Your First Comparison
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedComparisons.map((comp) => (
                <Card key={comp.comparisonId} hoverEffect className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-brand-border">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center font-bold">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-brand-navy">{comp.comparisonTitle}</h3>
                          <div className="text-[11px] text-brand-muted flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>Saved on {new Date(comp.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="teal" size="sm">
                        ID #{comp.comparisonId}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-brand-muted">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Baseline Study:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {comp.olderReportTitle}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Follow-up Study:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {comp.newerReportTitle}
                        </span>
                      </div>
                      {comp.summary && (
                        <p className="pt-1.5 text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {comp.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between">
                    <button
                      onClick={() => setDeleteComparisonConfirmId(comp.comparisonId)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={async () => {
                          try {
                            const detail = await api.get<ReportComparisonResult>(`/reports/comparisons/${comp.comparisonId}`);
                            printOrDownloadComparisonPdf(detail, {
                              patientName: user?.fullName,
                              patientCode: user?.patientCode,
                            });
                          } catch (err: any) {
                            setPageError(err.message || 'Failed to generate PDF for saved comparison.');
                          }
                        }}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => loadSavedComparisonDetail(comp)}
                      >
                        View & Analysis
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Documents Grid & Search/Filter Bar */
        <div className="space-y-4">
          {/* Search, Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-brand-panel/40 p-3 rounded-2xl border border-brand-border/70">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, original filename, or clinical notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted hover:text-brand-navy"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-brand-muted shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sort:</span>
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs bg-white border border-brand-border rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="newest">Newest Test Date First</option>
                <option value="oldest">Oldest Test Date First</option>
                <option value="title">Document Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Document Cards Grid */}
          {isLoadingReports ? (
            <div className="py-12 text-center text-sm text-brand-muted">Loading medical documents...</div>
          ) : filteredReports.length === 0 ? (
            <Card className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-brand-navy">
                {searchTerm ? 'No matching documents found' : `No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase()} documents found`}
              </h3>
              <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No records matching "${searchTerm}". Try a different keyword.`
                  : 'Upload your laboratory test results, diagnostic scans, or prescriptions to maintain a secure encrypted digital record.'}
              </p>
              <Button
                variant="teal"
                size="sm"
                className="mt-4"
                onClick={() => {
                  resetUploadForm();
                  setIsUploadModalOpen(true);
                }}
              >
                Upload Document
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.reportId} hoverEffect className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-brand-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-panel text-brand-navy flex items-center justify-center font-bold shrink-0">
                          {report.reportType === 'SCAN' ? (
                            <Activity className="w-5 h-5 text-sky-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-brand-teal" />
                          )}
                        </div>
                        <div>
                          <h3
                            className="font-bold text-sm text-brand-navy line-clamp-1 hover:text-brand-teal cursor-pointer"
                            title={report.reportTitle}
                            onClick={() => setPreviewReport(report)}
                          >
                            {report.reportTitle}
                          </h3>
                          <div className="text-xs text-brand-muted mt-0.5 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>Test Date: {report.reportDate}</span>
                          </div>
                        </div>
                      </div>
                      {getReportTypeBadge(report.reportType)}
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-brand-muted">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Original File:</span>
                        <span className="font-mono truncate max-w-[180px] text-slate-800" title={report.originalFilename}>
                          {report.originalFilename}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Size & Type:</span>
                        <span>
                          {(report.fileSize / 1024).toFixed(1)} KB &bull; {report.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                      {report.doctor && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Ordering Doctor:</span>
                          <span className="font-semibold text-slate-800">{report.doctor.fullName}</span>
                        </div>
                      )}
                      {report.reportValues && report.reportValues.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Structured Parameters:</span>
                          <Badge variant="teal" size="sm">
                            {report.reportValues.length} tests recorded
                          </Badge>
                        </div>
                      )}
                      {report.description && (
                        <p className="pt-1 text-[11px] text-slate-500 italic line-clamp-2">
                          "{report.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between">
                    <button
                      onClick={() => setDeleteConfirmId(report.reportId)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setPreviewReport(report)}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => handleDownload(report.reportId, report.originalFilename)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Report Confirmation Dialog */}
      <Dialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Permanent Deletion"
        description="Are you sure you want to delete this medical report? This action permanently purges the stored encrypted document and structured values."
        maxWidth="md"
      >
        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (deleteConfirmId !== null) {
                deleteMutation.mutate(deleteConfirmId);
              }
            }}
          >
            Permanently Delete
          </Button>
        </div>
      </Dialog>

      {/* Delete Comparison Confirmation Dialog */}
      <Dialog
        isOpen={deleteComparisonConfirmId !== null}
        onClose={() => setDeleteComparisonConfirmId(null)}
        title="Delete Saved Comparison"
        description="Are you sure you want to remove this comparison record from your history? The underlying medical documents will remain intact."
        maxWidth="md"
      >
        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteComparisonConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteComparisonMutation.isPending}
            onClick={() => {
              if (deleteComparisonConfirmId !== null) {
                deleteComparisonMutation.mutate(deleteComparisonConfirmId);
              }
            }}
          >
            Delete Comparison
          </Button>
        </div>
      </Dialog>

      {/* Document Preview & Details Modal */}
      {previewReport && (
        <Dialog
          isOpen={true}
          onClose={() => setPreviewReport(null)}
          title={previewReport.reportTitle}
          description={`Recorded on ${previewReport.reportDate} • Category: ${previewReport.reportType}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-brand-panel/50 rounded-xl text-xs border border-brand-border">
              <div>
                <span className="font-semibold text-slate-700">Filename:</span>
                <p className="font-mono text-slate-900 mt-0.5 truncate">{previewReport.originalFilename}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">File Size:</span>
                <p className="text-slate-900 mt-0.5">{(previewReport.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              {previewReport.doctor && (
                <div className="col-span-2">
                  <span className="font-semibold text-slate-700">Authoring / Reviewing Doctor:</span>
                  <p className="text-slate-900 mt-0.5">{previewReport.doctor.fullName} ({previewReport.doctor.specialty})</p>
                </div>
              )}
              {previewReport.description && (
                <div className="col-span-2">
                  <span className="font-semibold text-slate-700">Clinical Notes:</span>
                  <p className="text-slate-900 mt-0.5 italic">{previewReport.description}</p>
                </div>
              )}
            </div>

            {/* Structured Values Table (if any) */}
            {previewReport.reportValues && previewReport.reportValues.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-brand-navy mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-brand-teal" />
                  <span>Structured Lab Parameters ({previewReport.reportValues.length})</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-brand-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-navy text-white text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Test Name</th>
                        <th className="py-2.5 px-3">Result Value</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-3">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-white">
                      {previewReport.reportValues.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{v.testName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-brand-navy">
                            {v.numericValue} {v.unit}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {v.referenceRangeMin !== null && v.referenceRangeMax !== null
                              ? `${v.referenceRangeMin} - ${v.referenceRangeMax}`
                              : 'Not specified'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.interpretation === 'HIGH' || v.interpretation === 'LOW'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {v.interpretation || 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-brand-border">
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleDownload(previewReport.reportId, previewReport.originalFilename)}
              >
                Download Stored Document
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPreviewReport(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Upload Document Modal Dialog */}
      <Dialog
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Medical Document"
        description="Add previous laboratory results, diagnostic scans, prescriptions or medical certificates to your Patient ID record."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <Input
            label="Document Title"
            required
            placeholder="e.g. Comprehensive Lipid Profile, Chest X-Ray, Discharge Summary"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Document Category"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as ReportType)}
              options={[
                { value: 'LAB', label: 'Laboratory Blood Test (LAB)' },
                { value: 'SCAN', label: 'Imaging & Diagnostic Scan (SCAN)' },
                { value: 'PRESCRIPTION', label: 'Doctor Prescription (PRESCRIPTION)' },
                { value: 'CERTIFICATE', label: 'Medical Certificate (CERTIFICATE)' },
                { value: 'OTHER', label: 'Other Medical Record (OTHER)' },
              ]}
            />
            <Input
              label="Document Date"
              type="date"
              required
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1.5">
              Select Document File <span className="text-brand-error">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-panel file:text-brand-navy hover:file:bg-slate-200 cursor-pointer border border-brand-border rounded-xl p-2 bg-white"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              Supported formats: PDF, JPEG, PNG, TXT (Maximum size 15 MB)
            </p>
            {autoDetectedNotice && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{autoDetectedNotice}</span>
              </div>
            )}
          </div>

          <Input
            label="Notes / Clinical Impression (Optional)"
            placeholder="e.g. Baseline blood test before initiating treatment"
            value={uploadDesc}
            onChange={(e) => setUploadDesc(e.target.value)}
          />

          {/* Optional Structured Values Section (for Lab reports) */}
          {uploadType === 'LAB' && (
            <div className="p-3.5 bg-brand-panel/60 rounded-xl border border-brand-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-brand-navy">Structured Test Values</div>
                  <div className="text-[11px] text-brand-muted">
                    Enter key values for automatic longitudinal comparison and trend charts
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStructuredValue}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Test Row
                </Button>
              </div>

              {structuredValues.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-brand-border">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Test Name (e.g. Cholesterol)"
                      value={row.testName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredValues((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, testName: val } : item))
                        );
                      }}
                      className="w-full text-xs p-1.5 border border-brand-border rounded-lg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Value"
                      value={row.numericValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredValues((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, numericValue: val } : item))
                        );
                      }}
                      className="w-full text-xs p-1.5 border border-brand-border rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={row.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredValues((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, unit: val } : item))
                        );
                      }}
                      className="w-full text-xs p-1.5 border border-brand-border rounded-lg"
                    />
                  </div>
                  <div className="col-span-2 flex gap-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={row.min}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredValues((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, min: val } : item))
                        );
                      }}
                      className="w-1/2 text-xs p-1 border border-brand-border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={row.max}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructuredValues((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, max: val } : item))
                        );
                      }}
                      className="w-1/2 text-xs p-1 border border-brand-border rounded-lg"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveStructuredValue(index)}
                      className="text-slate-400 hover:text-brand-error"
                      title="Remove test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="md"
              isLoading={uploadMutation.isPending}
            >
              Upload & Secure
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Compare Reports Modal Dialog with Visual Charts, Analysis Cards & PDF Download */}
      <Dialog
        isOpen={isCompareModalOpen}
        onClose={() => {
          setIsCompareModalOpen(false);
          setComparisonResult(null);
        }}
        title="Longitudinal Laboratory Comparison"
        description="Select two laboratory tests to track biomakers and generate clinical trend analytics."
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Report Selection Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-brand-panel/60 rounded-xl border border-brand-border/80">
            <Select
              label="Baseline Report (Older Date)"
              value={olderReportId || ''}
              onChange={(e) => setOlderReportId(Number(e.target.value))}
            >
              <option value="">Select Baseline Report</option>
              {allLabReports.map((r) => (
                <option key={r.reportId} value={r.reportId}>
                  {r.reportTitle} ({r.reportDate})
                </option>
              ))}
            </Select>

            <Select
              label="Follow-up Report (Newer Date)"
              value={newerReportId || ''}
              onChange={(e) => setNewerReportId(Number(e.target.value))}
            >
              <option value="">Select Follow-up Report</option>
              {allLabReports.map((r) => (
                <option key={r.reportId} value={r.reportId}>
                  {r.reportTitle} ({r.reportDate})
                </option>
              ))}
            </Select>

            {compareError && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{compareError}</span>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <Button
                variant="teal"
                size="md"
                onClick={handleTriggerCompare}
                isLoading={compareMutation.isPending}
                icon={<TrendingUp className="w-4 h-4" />}
              >
                Compare Reports
              </Button>
            </div>
          </div>

          {/* Comparison Results Area */}
          {comparisonResult && (
            <div className="space-y-5">
              {/* Actions Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">
                    Comparative Study: {comparisonResult.olderReportTitle} vs {comparisonResult.newerReportTitle}
                  </h3>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Baseline: {comparisonResult.olderReportDate} &bull; Follow-up: {comparisonResult.newerReportDate}
                  </p>
                </div>
                <Button
                  variant="teal"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={handleDownloadPdf}
                >
                  Download / Print PDF
                </Button>
              </div>

              {/* Mandatory Medical Disclaimer */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">
                  {comparisonResult.disclaimer}
                </span>
              </div>

              {/* Structured Metric Summary Cards and Comparison Content */}
              {(() => {
                const hasData = Boolean(
                  comparisonResult.hasComparableData !== false &&
                  comparisonResult.matchedMetrics &&
                  comparisonResult.matchedMetrics.length > 0
                );

                const incCount = hasData
                  ? (comparisonResult.increasedCount ?? comparisonResult.matchedMetrics.filter((m) => m.trend === 'INCREASED').length)
                  : null;
                const decCount = hasData
                  ? (comparisonResult.decreasedCount ?? comparisonResult.matchedMetrics.filter((m) => m.trend === 'DECREASED').length)
                  : null;
                const stableCount = hasData
                  ? (comparisonResult.stableCount ?? comparisonResult.matchedMetrics.filter((m) => m.trend === 'UNCHANGED').length)
                  : null;
                const oorCount = hasData
                  ? (comparisonResult.outOfRangeCount ?? comparisonResult.matchedMetrics.filter((m) => m.newerStatus !== 'NORMAL' && m.newerStatus !== 'UNSPECIFIED').length)
                  : null;

                return (
                  <>
                    {/* Summary Counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                        <div className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Increased</span>
                        </div>
                        <div className="text-xl font-bold text-sky-900 mt-1">
                          {incCount !== null ? incCount : <span className="text-xs font-semibold text-slate-500">Not available</span>}
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Decreased</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-900 mt-1">
                          {decCount !== null ? decCount : <span className="text-xs font-semibold text-slate-500">Not available</span>}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Stable / Unchanged</span>
                        </div>
                        <div className="text-xl font-bold text-slate-800 mt-1">
                          {stableCount !== null ? stableCount : <span className="text-xs font-semibold text-slate-500">Not available</span>}
                        </div>
                      </div>

                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                        <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Out of Range</span>
                        </div>
                        <div className="text-xl font-bold text-rose-900 mt-1">
                          {oorCount !== null ? oorCount : <span className="text-xs font-semibold text-slate-500">Not available</span>}
                        </div>
                      </div>
                    </div>

                    {/* Notice if no comparable structured laboratory values */}
                    {!hasData && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-amber-950 text-sm">No Comparable Structured Values</div>
                          <p className="mt-1 leading-relaxed text-amber-800">
                            No comparable structured laboratory values were found in the selected reports. Please check that both reports contain readable laboratory data.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Written Comparison Description */}
                    {(comparisonResult.detailedDescription || comparisonResult.summary) && (
                      <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-700" />
                          <span>Patient Plain-Language Explanation</span>
                        </div>
                        <p className="text-xs text-teal-900 leading-relaxed whitespace-pre-line font-medium">
                          {comparisonResult.detailedDescription || comparisonResult.summary}
                        </p>
                        <p className="text-[11px] text-teal-700/80 italic pt-1 border-t border-teal-200/60">
                          Note: Reference ranges and test methodologies may vary between laboratories.
                        </p>
                      </div>
                    )}

                    {/* Visual Comparative Bar Chart (Only when data exists) */}
                    {hasData && chartData.length > 0 && (
                      <div className="p-4 bg-white rounded-xl border border-brand-border space-y-2">
                        <h4 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-brand-teal" />
                          <span>Biomarker Comparison Chart (Baseline vs Follow-up)</span>
                        </h4>
                        <div className="h-64 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis
                                dataKey="name"
                                angle={-20}
                                textAnchor="end"
                                interval={0}
                                tick={{ fontSize: 10, fill: '#475569' }}
                              />
                              <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#0f172a',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  border: 'none',
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} name={`Baseline (${comparisonResult.olderReportDate})`} />
                              <Bar dataKey="FollowUp" fill="#0d9488" radius={[4, 4, 0, 0]} name={`Follow-up (${comparisonResult.newerReportDate})`} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Matched Metrics 8-Column Detailed Table (Only when data exists) */}
                    {hasData && (
                      <div className="overflow-x-auto rounded-xl border border-brand-border">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-brand-navy text-white text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-3.5">Laboratory Parameter</th>
                              <th className="py-3 px-3.5">
                                Older Value ({comparisonResult.olderReportDate})
                              </th>
                              <th className="py-3 px-3.5">
                                Newer Value ({comparisonResult.newerReportDate})
                              </th>
                              <th className="py-3 px-3.5">Difference</th>
                              <th className="py-3 px-3.5">% Change</th>
                              <th className="py-3 px-3.5">Trend</th>
                              <th className="py-3 px-3.5">Reference-Range Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border bg-white">
                            {comparisonResult.matchedMetrics.map((metric) => {
                              const isOor = metric.newerStatus !== 'NORMAL' && metric.newerStatus !== 'UNSPECIFIED';
                              return (
                                <tr
                                  key={metric.normalizedTestKey}
                                  className={`hover:bg-slate-50 transition ${isOor ? 'bg-amber-50/40' : ''}`}
                                >
                                  <td className="py-3 px-3.5 font-semibold text-brand-navy">
                                    {metric.testName}
                                  </td>
                                  <td className="py-3 px-3.5 font-mono">
                                    <span className="font-medium text-slate-700">
                                      {metric.olderValue} {metric.unit}
                                    </span>
                                    <span className="ml-1 text-[10px] text-brand-muted block">
                                      ({metric.olderStatus})
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 font-mono">
                                    <span className={`font-bold ${isOor ? 'text-amber-800' : 'text-brand-navy'}`}>
                                      {metric.newerValue} {metric.unit}
                                    </span>
                                    <span className={`ml-1 text-[10px] block ${isOor ? 'text-amber-700 font-bold' : 'text-brand-muted'}`}>
                                      ({metric.newerStatus})
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 font-mono font-semibold">
                                    <span
                                      className={
                                        metric.difference < 0
                                          ? 'text-emerald-600'
                                          : metric.difference > 0
                                          ? 'text-sky-600'
                                          : 'text-slate-600'
                                      }
                                    >
                                      {metric.difference > 0 ? `+${metric.difference}` : metric.difference} {metric.unit}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 font-mono font-bold">
                                    {metric.percentageDifferenceString ? (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] ${
                                          metric.percentageDifferenceString.startsWith('-')
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : metric.percentageDifferenceString.startsWith('+')
                                            ? 'bg-sky-100 text-sky-800'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {metric.percentageDifferenceString}
                                      </span>
                                    ) : metric.percentageDifference !== undefined && metric.percentageDifference !== null ? (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] ${
                                          metric.percentageDifference < 0
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-sky-100 text-sky-800'
                                        }`}
                                      >
                                        {metric.percentageDifference > 0
                                          ? `+${metric.percentageDifference}%`
                                          : `${metric.percentageDifference}%`}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">N/A</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <Badge
                                      variant={
                                        metric.trend === 'DECREASED'
                                          ? 'success'
                                          : metric.trend === 'INCREASED'
                                          ? 'info'
                                          : 'neutral'
                                      }
                                      size="sm"
                                    >
                                      {metric.trend}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <div className="font-semibold">
                                      {metric.newerStatus === 'LOW' ? (
                                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-[11px]">Below Reference Range</span>
                                      ) : metric.newerStatus === 'HIGH' ? (
                                        <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block text-[11px]">Above Reference Range</span>
                                      ) : (
                                        <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">Within Normal Limits</span>
                                      )}
                                    </div>
                                    {metric.referenceRangeMin !== undefined && metric.referenceRangeMin !== null && metric.referenceRangeMax !== undefined && metric.referenceRangeMax !== null && (
                                      <div className="text-[10.5px] text-brand-muted font-mono mt-1">
                                        Ref: {metric.referenceRangeMin} - {metric.referenceRangeMax} {metric.unit || ''}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Dedicated Section: Parameters Present in Only One Report */}
                    {((comparisonResult.olderOnlyMetrics && comparisonResult.olderOnlyMetrics.length > 0) ||
                      (comparisonResult.newerOnlyMetrics && comparisonResult.newerOnlyMetrics.length > 0)) && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                          <span>Parameters Present in Only One Report</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          The following laboratory parameters were recorded in only one of the selected studies and cannot be evaluated longitudinally:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {comparisonResult.olderOnlyMetrics && comparisonResult.olderOnlyMetrics.map((m) => (
                            <div key={`older-${m.valueId || m.testName}`} className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-800">{m.testName}</span>
                                <span className="ml-1 text-[11px] text-slate-500">({m.numericValue} {m.unit})</span>
                              </div>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                Baseline only
                              </span>
                            </div>
                          ))}
                          {comparisonResult.newerOnlyMetrics && comparisonResult.newerOnlyMetrics.map((m) => (
                            <div key={`newer-${m.valueId || m.testName}`} className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-800">{m.testName}</span>
                                <span className="ml-1 text-[11px] text-slate-500">({m.numericValue} {m.unit})</span>
                              </div>
                              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-medium">
                                Follow-up only
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
