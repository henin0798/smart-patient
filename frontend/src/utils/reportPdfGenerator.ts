import { ReportComparisonResult, ComparedMetric, ReportValue } from '../types';

export interface ComparisonPrintOptions {
  patientName?: string;
  patientCode?: string;
}

function generateSvgBarChart(metrics: ComparedMetric[], olderDate: string, newerDate: string): string {
  if (!metrics || metrics.length === 0) return '';
  const chartHeight = 160;
  const barAreaHeight = 100;
  const colWidth = 96;
  const totalWidth = Math.max(540, metrics.length * colWidth + 60);

  const maxVal = Math.max(...metrics.map((m) => Math.max(Number(m.olderValue) || 0, Number(m.newerValue) || 0, 1)));

  let barsSvg = '';
  metrics.forEach((m, i) => {
    const x = 50 + i * colWidth;
    const v1 = Number(m.olderValue) || 0;
    const v2 = Number(m.newerValue) || 0;
    const h1 = Math.max(4, (v1 / maxVal) * barAreaHeight);
    const h2 = Math.max(4, (v2 / maxVal) * barAreaHeight);
    const y1 = 125 - h1;
    const y2 = 125 - h2;
    const label = m.testName.length > 12 ? m.testName.substring(0, 11) + '..' : m.testName;

    barsSvg += `
      <g>
        <!-- Baseline Bar -->
        <rect x="${x}" y="${y1}" width="16" height="${h1}" fill="#94a3b8" rx="2" />
        <text x="${x + 8}" y="${y1 - 3}" font-size="9" text-anchor="middle" fill="#475569" font-family="sans-serif">${v1}</text>

        <!-- Follow-up Bar -->
        <rect x="${x + 20}" y="${y2}" width="16" height="${h2}" fill="#0d9488" rx="2" />
        <text x="${x + 28}" y="${y2 - 3}" font-size="9" text-anchor="middle" fill="#0f766e" font-weight="bold" font-family="sans-serif">${v2}</text>

        <!-- X Axis Label -->
        <text x="${x + 18}" y="140" font-size="9" text-anchor="middle" fill="#1e293b" font-weight="600" font-family="sans-serif">${label}</text>
        <text x="${x + 18}" y="152" font-size="8" text-anchor="middle" fill="#64748b" font-family="sans-serif">${m.unit || ''}</text>
      </g>
    `;
  });

  return `
    <div style="margin-bottom: 18px; padding: 12px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          Visual Biomarker Trend Chart (Baseline vs Follow-up)
        </span>
        <div style="display: flex; gap: 14px; font-size: 10px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #94a3b8; border-radius: 2px;"></span>
            <span style="color: #475569; font-weight: 500;">Baseline (${olderDate})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #0d9488; border-radius: 2px;"></span>
            <span style="color: #0f766e; font-weight: bold;">Follow-up (${newerDate})</span>
          </div>
        </div>
      </div>
      <div style="overflow-x: auto;">
        <svg width="${totalWidth}" height="${chartHeight}" viewBox="0 0 ${totalWidth} ${chartHeight}" style="display: block;">
          <!-- Baseline horizontal grid line -->
          <line x1="25" y1="125" x2="${totalWidth - 20}" y2="125" stroke="#cbd5e1" stroke-width="1" />
          ${barsSvg}
        </svg>
      </div>
    </div>
  `;
}

function buildWrittenDescription(comparison: ReportComparisonResult): string {
  if (comparison.detailedDescription && comparison.detailedDescription.trim()) {
    return comparison.detailedDescription;
  }

  const metrics = comparison.matchedMetrics || [];
  if (metrics.length === 0) {
    return 'No comparable structured laboratory values were found in the selected reports. Please check that both reports contain readable laboratory data.';
  }

  const inc = metrics.filter((m) => m.trend === 'INCREASED');
  const dec = metrics.filter((m) => m.trend === 'DECREASED');
  const stable = metrics.filter((m) => m.trend === 'UNCHANGED');

  const lines: string[] = [];
  lines.push(
    `A total of ${metrics.length} laboratory parameter${metrics.length === 1 ? ' was' : 's were'} successfully compared between baseline study '${comparison.olderReportTitle}' (${comparison.olderReportDate}) and follow-up study '${comparison.newerReportTitle}' (${comparison.newerReportDate}).`
  );

  lines.push(
    `• Parameter Trends: ${inc.length} increased, ${dec.length} decreased, and ${stable.length} remained unchanged.`
  );

  if (inc.length > 0) {
    const incDetails = inc.map((m) => `${m.testName}: ${m.olderValue} ${m.unit} → ${m.newerValue} ${m.unit} (${m.percentageDifferenceString || (m.percentageDifference !== undefined ? `+${m.percentageDifference}%` : 'N/A')})`).join('; ');
    lines.push(`  - Increased: ${incDetails}.`);
  }

  if (dec.length > 0) {
    const decDetails = dec.map((m) => `${m.testName}: ${m.olderValue} ${m.unit} → ${m.newerValue} ${m.unit} (${m.percentageDifferenceString || (m.percentageDifference !== undefined ? `${m.percentageDifference}%` : 'N/A')})`).join('; ');
    lines.push(`  - Decreased: ${decDetails}.`);
  }

  if (stable.length > 0) {
    const stableDetails = stable.map((m) => `${m.testName}: ${m.newerValue} ${m.unit}`).join('; ');
    lines.push(`  - Unchanged: ${stableDetails}.`);
  }

  const rangeChanges = metrics.filter((m) => (m.olderStatus && m.newerStatus && m.olderStatus !== m.newerStatus) || m.newerStatus !== 'NORMAL');
  if (rangeChanges.length > 0) {
    const rangeNotes = rangeChanges.map((m) => {
      const ref = (m.referenceRangeMin !== undefined && m.referenceRangeMin !== null && m.referenceRangeMax !== undefined && m.referenceRangeMax !== null)
        ? ` (Ref: ${m.referenceRangeMin} - ${m.referenceRangeMax} ${m.unit})`
        : '';
      return `${m.testName} transitioned from ${m.olderStatus} to ${m.newerStatus}${ref}`;
    }).join('; ');
    lines.push(`• Reference Range Status: ${rangeNotes}.`);
  } else {
    lines.push(`• Reference Range Status: All compared parameters remained consistently within normal clinical laboratory reference limits.`);
  }

  // Notable shift
  const sortedByAbsDiff = [...metrics].sort((a, b) => Math.abs(Number(b.difference) || 0) - Math.abs(Number(a.difference) || 0));
  if (sortedByAbsDiff.length > 0 && Math.abs(Number(sortedByAbsDiff[0].difference)) > 0) {
    const top = sortedByAbsDiff[0];
    lines.push(
      `• Notable Recorded Shift: The most significant numeric change was observed in ${top.testName} with an absolute shift of ${Math.abs(Number(top.difference))} ${top.unit} (${top.percentageDifferenceString || `${top.percentageDifference}%`}).`
    );
  }

  lines.push('Note: Clinical reference ranges and calibration baselines may vary between laboratories and test methodologies. This longitudinal report provides structured comparative data and is not a clinical assessment or medical diagnosis.');

  return lines.join('\n\n');
}

export function printOrDownloadComparisonPdf(
  comparison: ReportComparisonResult,
  options: ComparisonPrintOptions = {}
): void {
  const printWindow = window.open('', '_blank', 'width=940,height=800');
  if (!printWindow) {
    alert('Please allow popups for Smart Patient to print or download the comparison report.');
    return;
  }

  const patientName = options.patientName || 'Patient Record';
  const patientCode = options.patientCode || 'PT-RECORD';
  const generationDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const matchedMetrics = comparison.matchedMetrics || [];
  const olderOnly = comparison.olderOnlyMetrics || [];
  const newerOnly = comparison.newerOnlyMetrics || [];
  const hasData = Boolean(
    comparison.hasComparableData !== false && matchedMetrics.length > 0
  );

  // Summary counts: If no comparable parameters, show "Not available" instead of misleading zero
  const increasedDisplay = hasData
    ? (comparison.increasedCount !== undefined && comparison.increasedCount !== null
        ? String(comparison.increasedCount)
        : String(matchedMetrics.filter((m) => m.trend === 'INCREASED').length))
    : 'Not available';

  const decreasedDisplay = hasData
    ? (comparison.decreasedCount !== undefined && comparison.decreasedCount !== null
        ? String(comparison.decreasedCount)
        : String(matchedMetrics.filter((m) => m.trend === 'DECREASED').length))
    : 'Not available';

  const stableDisplay = hasData
    ? (comparison.stableCount !== undefined && comparison.stableCount !== null
        ? String(comparison.stableCount)
        : String(matchedMetrics.filter((m) => m.trend === 'UNCHANGED').length))
    : 'Not available';

  const outOfRangeDisplay = hasData
    ? (comparison.outOfRangeCount !== undefined && comparison.outOfRangeCount !== null
        ? String(comparison.outOfRangeCount)
        : String(matchedMetrics.filter((m) => m.newerStatus !== 'NORMAL' && m.newerStatus !== 'UNSPECIFIED').length))
    : 'Not available';

  const hasOutOfRange = hasData && outOfRangeDisplay !== '0' && outOfRangeDisplay !== 'Not available';

  // Build table rows
  const tableRowsHtml = matchedMetrics
    .map((m, idx) => {
      const isOor = m.newerStatus !== 'NORMAL' && m.newerStatus !== 'UNSPECIFIED';
      const trendColor =
        m.trend === 'DECREASED'
          ? '#059669' // emerald-600
          : m.trend === 'INCREASED'
          ? '#0284c7' // sky-600
          : '#475569'; // slate-600

      const diffNum = Number(m.difference) || 0;
      const diffSign = diffNum > 0 ? `+${diffNum}` : `${diffNum}`;

      const pctStr =
        m.percentageDifferenceString ||
        (m.percentageDifference !== undefined && m.percentageDifference !== null
          ? (m.percentageDifference > 0 ? `+${m.percentageDifference}%` : `${m.percentageDifference}%`)
          : 'N/A');

      const refRange =
        m.referenceRangeMin !== undefined && m.referenceRangeMin !== null && m.referenceRangeMax !== undefined && m.referenceRangeMax !== null
          ? `${m.referenceRangeMin} - ${m.referenceRangeMax} ${m.unit || ''}`
          : 'N/A';

      const transitionStr = m.statusTransition || `${m.olderStatus || 'UNSPECIFIED'} → ${m.newerStatus || 'UNSPECIFIED'}`;
      const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

      return `
        <tr style="background-color: ${isOor ? '#fffbeb' : rowBg}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 9px 10px; font-weight: 600; color: #0f172a; font-size: 11.5px;">${m.testName}</td>
          <td style="padding: 9px 10px; font-family: monospace; font-size: 11px; color: #334155;">
            ${m.olderValue} ${m.unit || ''}
            <span style="font-size: 9.5px; color: #64748b; display: block;">(${m.olderStatus})</span>
          </td>
          <td style="padding: 9px 10px; font-family: monospace; font-size: 11px; font-weight: bold; color: ${isOor ? '#b45309' : '#0f172a'};">
            ${m.newerValue} ${m.unit || ''}
            <span style="font-size: 9.5px; color: ${isOor ? '#b45309' : '#64748b'}; display: block;">(${m.newerStatus})</span>
          </td>
          <td style="padding: 9px 10px; font-family: monospace; font-size: 11px; font-weight: 600; color: ${diffNum < 0 ? '#059669' : diffNum > 0 ? '#0284c7' : '#475569'};">
            ${diffSign} ${m.unit || ''}
          </td>
          <td style="padding: 9px 10px; font-family: monospace; font-size: 11px; font-weight: bold; color: ${diffNum < 0 ? '#059669' : diffNum > 0 ? '#0284c7' : '#475569'};">
            ${pctStr}
          </td>
          <td style="padding: 9px 10px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: #f1f5f9; color: ${trendColor}; border: 1px solid #e2e8f0;">
              ${m.trend}
            </span>
          </td>
          <td style="padding: 9px 10px; font-family: monospace; font-size: 10.5px; color: #64748b;">
            ${refRange}
          </td>
          <td style="padding: 9px 10px; font-size: 10px; font-weight: 600;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: ${isOor ? '#fef3c7' : '#ecfdf5'}; color: ${isOor ? '#92400e' : '#065f46'}; border: 1px solid ${isOor ? '#fde68a' : '#a7f3d0'};">
              ${transitionStr}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  // Unmatched metrics table (parameters present in only one report)
  let unmatchedHtml = '';
  if (olderOnly.length > 0 || newerOnly.length > 0) {
    const unmatchedRows: string[] = [];

    olderOnly.forEach((m) => {
      const ref = (m.referenceRangeMin !== undefined && m.referenceRangeMin !== null && m.referenceRangeMax !== undefined && m.referenceRangeMax !== null)
        ? `${m.referenceRangeMin} - ${m.referenceRangeMax} ${m.unit || ''}`
        : 'N/A';
      unmatchedRows.push(`
        <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff; page-break-inside: avoid;">
          <td style="padding: 8px 10px; font-weight: 600; color: #334155;">${m.testName}</td>
          <td style="padding: 8px 10px; font-family: monospace;">${m.numericValue} ${m.unit || ''}</td>
          <td style="padding: 8px 10px; font-family: monospace; font-size: 10px; color: #64748b;">${ref}</td>
          <td style="padding: 8px 10px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e2e8f0; color: #334155;">
              Baseline Only (${comparison.olderReportDate})
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 10px; color: #64748b;">Not re-tested in follow-up study</td>
        </tr>
      `);
    });

    newerOnly.forEach((m) => {
      const ref = (m.referenceRangeMin !== undefined && m.referenceRangeMin !== null && m.referenceRangeMax !== undefined && m.referenceRangeMax !== null)
        ? `${m.referenceRangeMin} - ${m.referenceRangeMax} ${m.unit || ''}`
        : 'N/A';
      unmatchedRows.push(`
        <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff; page-break-inside: avoid;">
          <td style="padding: 8px 10px; font-weight: 600; color: #0f766e;">${m.testName}</td>
          <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: #0f766e;">${m.numericValue} ${m.unit || ''}</td>
          <td style="padding: 8px 10px; font-family: monospace; font-size: 10px; color: #64748b;">${ref}</td>
          <td style="padding: 8px 10px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #ccfbf1; color: #0f766e;">
              Follow-up Only (${comparison.newerReportDate})
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 10px; color: #64748b;">Newly measured biomarker; no baseline prior</td>
        </tr>
      `);
    });

    unmatchedHtml = `
      <div style="margin-top: 22px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Parameters Present in Only One Report
        </div>
        <p style="font-size: 10.5px; color: #64748b; margin-top: 0; margin-bottom: 8px;">
          The following parameters were measured in only one of the two comparative studies. Because baseline or follow-up data was absent, longitudinal deltas cannot be computed.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #334155; color: #ffffff; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 10px;">Biomarker Parameter</th>
              <th style="padding: 8px 10px;">Recorded Value</th>
              <th style="padding: 8px 10px;">Reference Range</th>
              <th style="padding: 8px 10px;">Documented Study</th>
              <th style="padding: 8px 10px;">Comparative Status</th>
            </tr>
          </thead>
          <tbody>
            ${unmatchedRows.join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const svgChartHtml = hasData
    ? generateSvgBarChart(matchedMetrics, comparison.olderReportDate, comparison.newerReportDate)
    : '';

  const writtenDescriptionText = buildWrittenDescription(comparison);
  const formattedDescriptionHtml = writtenDescriptionText
    .split('\n\n')
    .map((para) => `<p style="margin: 0 0 8px 0; line-height: 1.55;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const statutoryDisclaimer =
    'This report summarizes recorded laboratory values for comparison purposes only. It is not a medical diagnosis or treatment recommendation. Reference ranges may vary by laboratory, and results should be interpreted by a qualified healthcare professional in the context of the patient’s clinical history.';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Smart Patient - Longitudinal Laboratory Comparison (${patientCode})</title>
      <style>
        @page {
          size: A4;
          margin: 10mm 12mm 12mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 16px 20px;
          background-color: #ffffff;
          font-size: 11.5px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .brand-subtitle {
          font-size: 11px;
          color: #0d9488;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-top: 1px;
        }
        .study-label {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 700;
          color: #0369a1;
          background: #e0f2fe;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 4px;
          letter-spacing: 0.3px;
        }
        .meta-box {
          text-align: right;
          font-size: 10.5px;
          color: #475569;
          line-height: 1.45;
        }
        .patient-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .card-title {
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 2px;
          font-weight: 700;
        }
        .card-value {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }
        .stat-item {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          text-align: center;
          background: #fafafa;
        }
        .stat-num {
          font-size: 15px;
          font-weight: 800;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 10px;
          text-align: left;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }
        .description-box {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #0d9488;
          border-radius: 0 6px 6px 0;
          padding: 12px 14px;
          margin-top: 16px;
          margin-bottom: 14px;
          font-size: 11px;
          color: #1e293b;
          page-break-inside: avoid;
        }
        .no-data-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
          border-radius: 0 6px 6px 0;
          padding: 14px 16px;
          margin-bottom: 18px;
          font-size: 11.5px;
          color: #991b1b;
          page-break-inside: avoid;
        }
        .disclaimer-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 10px 14px;
          color: #92400e;
          font-size: 10px;
          line-height: 1.5;
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #94a3b8;
          page-break-inside: avoid;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; padding: 10px 14px; background: #e0f2fe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #bae6fd;">
        <div>
          <span style="font-size: 12px; font-weight: 700; color: #0369a1;">
            Smart Patient Longitudinal Health Analytics
          </span>
          <span style="font-size: 11px; color: #0284c7; margin-left: 8px;">
            Print preview mode &bull; Fully formatted for A4 export
          </span>
        </div>
        <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Print / Save as PDF
        </button>
      </div>

      <!-- Section A: Report Heading -->
      <div class="header">
        <div>
          <div class="brand-title">SMART PATIENT HEALTHCARE</div>
          <div class="brand-subtitle">Longitudinal Laboratory Comparison Report</div>
          <div class="study-label">Comparative Analysis of Two Recorded Clinical Studies</div>
        </div>
        <div class="meta-box">
          <div><strong>Generated:</strong> ${generationDate}</div>
          <div><strong>Record Type:</strong> Laboratory Biomarker Study (${comparison.reportType || 'LAB'})</div>
          <div><strong>System:</strong> Smart Patient Digital Health Record</div>
        </div>
      </div>

      <!-- Section B: Patient and Report Details -->
      <div class="patient-card">
        <div>
          <div class="card-title">Patient Identification</div>
          <div class="card-value">${patientName}</div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 2px;">
            Unique Patient Code: <strong>${patientCode}</strong>
          </div>
        </div>
        <div>
          <div class="card-title">Comparative Studies Under Review</div>
          <div style="font-size: 11px; color: #334155;">
            <strong>Baseline:</strong> ${comparison.olderReportTitle} &bull; Date: <strong>${comparison.olderReportDate}</strong>
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 3px;">
            <strong>Follow-up:</strong> ${comparison.newerReportTitle} &bull; Date: <strong>${comparison.newerReportDate}</strong>
          </div>
        </div>
      </div>

      <!-- Section C: Comparison Summary Counters -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="card-title">Increased</div>
          <div class="stat-num" style="color: #0284c7;">${increasedDisplay}</div>
        </div>
        <div class="stat-item">
          <div class="card-title">Decreased</div>
          <div class="stat-num" style="color: #059669;">${decreasedDisplay}</div>
        </div>
        <div class="stat-item">
          <div class="card-title">Unchanged / Stable</div>
          <div class="stat-num" style="color: #64748b;">${stableDisplay}</div>
        </div>
        <div class="stat-item" style="${hasOutOfRange ? 'background: #fff7ed; border-color: #fed7aa;' : ''}">
          <div class="card-title">Out of Range</div>
          <div class="stat-num" style="color: ${hasOutOfRange ? '#ea580c' : '#10b981'};">${outOfRangeDisplay}</div>
        </div>
      </div>

      <!-- Section D: Main Comparison Table -->
      ${
        hasData
          ? `
            ${svgChartHtml}
            <div style="margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              Direct Biomarker Longitudinal Comparison (${matchedMetrics.length} Matched Parameter${matchedMetrics.length === 1 ? '' : 's'})
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 22%;">Laboratory Parameter</th>
                  <th style="width: 14%;">Baseline (${comparison.olderReportDate})</th>
                  <th style="width: 14%;">Follow-up (${comparison.newerReportDate})</th>
                  <th style="width: 11%;">Difference</th>
                  <th style="width: 9%;">% Change</th>
                  <th style="width: 9%;">Trend</th>
                  <th style="width: 11%;">Reference Range</th>
                  <th style="width: 10%;">Status / Interpretation</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          `
          : `
            <div class="no-data-box">
              <strong style="font-size: 12.5px; display: block; margin-bottom: 4px;">No Comparable Structured Laboratory Values Found</strong>
              <p style="margin: 0;">
                No comparable structured laboratory values were found in the selected reports. Please check that both reports contain readable laboratory data.
              </p>
            </div>
          `
      }

      ${unmatchedHtml}

      <!-- Section E: Written Comparison Description -->
      <div class="description-box">
        <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; color: #0f766e; margin-bottom: 8px;">
          Written Clinical Comparison Description & Factual Analysis
        </div>
        ${formattedDescriptionHtml}
      </div>

      <!-- Section G: Statutory Medical Disclaimer -->
      <div class="disclaimer-box">
        <strong>Statutory Medical Disclaimer:</strong> ${statutoryDisclaimer}
      </div>

      <div class="footer">
        <div>Smart Patient Health & Hospital Management Platform &bull; Department of CSE, Providence College of Engineering</div>
        <div>Confidential Patient Medical Comparison &bull; Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
