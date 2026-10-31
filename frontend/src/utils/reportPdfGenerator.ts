import { ReportComparisonResult, ComparedMetric, ReportValue } from '../types';

export interface ComparisonPrintOptions {
  patientName?: string;
  patientCode?: string;
}

export function formatReportDate(dateStr?: string): string {
  if (!dateStr) return 'Baseline Date';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
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
            <span style="color: #475569; font-weight: 500;">Baseline (${formatReportDate(olderDate)})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #0d9488; border-radius: 2px;"></span>
            <span style="color: #0f766e; font-weight: bold;">Follow-up (${formatReportDate(newerDate)})</span>
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

export function buildWrittenDescription(comparison: ReportComparisonResult): string {
  if (comparison.detailedDescription && comparison.detailedDescription.trim()) {
    return comparison.detailedDescription;
  }

  const metrics = comparison.matchedMetrics || [];
  const olderDateFormatted = formatReportDate(comparison.olderReportDate);
  const newerDateFormatted = formatReportDate(comparison.newerReportDate);

  if (metrics.length === 0) {
    return `No matching laboratory parameters were found between '${comparison.olderReportTitle}' (${olderDateFormatted}) and '${comparison.newerReportTitle}' (${newerDateFormatted}).\n\nWhy this happens:\n• One or both documents might be diagnostic scans (e.g. X-Ray, CT, MRI, Ultrasound), prescriptions, or non-laboratory records.\n• The two reports measure different test panels (for example, comparing a Lipid Profile with a Liver Function Test).\n• No readable numeric laboratory test values were provided or extracted during upload.\n\nTo view a comparison, please ensure both selected documents are laboratory blood tests containing matching test parameters (such as Hemoglobin, Blood Sugar, or Lipid Profile).\n\nNote: This tool tracks recorded values only. It does not predict future clinical trajectory, claim a result will become normal, or provide a medical diagnosis.`;
  }

  const lines: string[] = [];
  lines.push(
    `Longitudinal comparison between your baseline report '${comparison.olderReportTitle}' (${olderDateFormatted}) and follow-up report '${comparison.newerReportTitle}' (${newerDateFormatted}). A total of ${metrics.length} matching laboratory parameter${metrics.length === 1 ? ' was' : 's were'} evaluated:`
  );

  const sentences: string[] = [];
  const inc = metrics.filter((m) => m.trend === 'INCREASED');
  const dec = metrics.filter((m) => m.trend === 'DECREASED');
  const stable = metrics.filter((m) => m.trend === 'UNCHANGED');

  for (const m of metrics) {
    const unitStr = m.unit ? ` ${m.unit}` : '';
    const diff = Number(m.difference) || 0;
    const diffAbs = Math.abs(diff);

    let trendClause = '';
    const pctStr = m.percentageDifferenceString && m.percentageDifferenceString !== 'N/A'
      ? ` (${m.percentageDifferenceString})`
      : '';

    if (diff > 0) {
      trendClause = `That is an increase of ${diffAbs}${unitStr}${pctStr}.`;
    } else if (diff < 0) {
      trendClause = `That is a decrease of ${diffAbs}${unitStr}${pctStr}.`;
    } else {
      trendClause = `The result remained unchanged between the two visits.`;
    }

    let rangeClause = '';
    const hasMin = m.referenceRangeMin !== undefined && m.referenceRangeMin !== null;
    const hasMax = m.referenceRangeMax !== undefined && m.referenceRangeMax !== null;
    const refRangeText = hasMin && hasMax ? ` (${m.referenceRangeMin} - ${m.referenceRangeMax}${unitStr})` : '';

    if (m.newerStatus === 'LOW') {
      rangeClause = `The latest result is still below the provided reference range${refRangeText}.`;
    } else if (m.newerStatus === 'HIGH') {
      rangeClause = `The latest result is above the provided reference range${refRangeText}.`;
    } else if (m.newerStatus === 'NORMAL') {
      if (m.olderStatus === 'LOW' || m.olderStatus === 'HIGH') {
        rangeClause = `The latest result has returned to the standard reference range${refRangeText}.`;
      } else {
        rangeClause = `The latest result is within the provided reference range${refRangeText}.`;
      }
    } else {
      rangeClause = `No reference range was specified for this parameter.`;
    }

    sentences.push(
      `• Your ${m.testName} was ${m.olderValue}${unitStr} on ${olderDateFormatted}. In your follow-up report on ${newerDateFormatted}, it was ${m.newerValue}${unitStr}. ${trendClause} ${rangeClause}`.trim()
    );
  }

  lines.push(sentences.join('\n\n'));

  lines.push(
    `• Summary of Changes: ${inc.length} increased, ${dec.length} decreased, and ${stable.length} remained unchanged.`
  );

  lines.push(
    'Note: Clinical reference ranges and calibration baselines may vary between laboratories and test methodologies. This longitudinal comparison tracks recorded changes over time for patient awareness and does not predict future clinical trajectory, claim a result will become normal, or provide a medical diagnosis. Please consult a qualified physician for clinical evaluation.'
  );

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

  const olderDateFormatted = formatReportDate(comparison.olderReportDate);
  const newerDateFormatted = formatReportDate(comparison.newerReportDate);

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

      const statusBadge =
        m.newerStatus === 'LOW'
          ? `<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">Below Range</span>`
          : m.newerStatus === 'HIGH'
          ? `<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: bold; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;">Above Range</span>`
          : `<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 600; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">Normal</span>`;

      const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

      return `
        <tr style="background-color: ${isOor ? '#fffbeb' : rowBg}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 10px 10px; font-weight: 700; color: #0f172a; font-size: 11.5px;">${m.testName}</td>
          <td style="padding: 10px 10px; font-family: monospace; font-size: 11px; color: #334155;">
            ${m.olderValue} ${m.unit || ''}
            <span style="font-size: 9px; color: #64748b; display: block; font-family: sans-serif;">${olderDateFormatted} (${m.olderStatus})</span>
          </td>
          <td style="padding: 10px 10px; font-family: monospace; font-size: 11px; font-weight: bold; color: ${isOor ? '#b45309' : '#0f172a'};">
            ${m.newerValue} ${m.unit || ''}
            <span style="font-size: 9px; color: ${isOor ? '#b45309' : '#64748b'}; display: block; font-family: sans-serif;">${newerDateFormatted} (${m.newerStatus})</span>
          </td>
          <td style="padding: 10px 10px; font-family: monospace; font-size: 11px; font-weight: 700; color: ${diffNum < 0 ? '#059669' : diffNum > 0 ? '#0284c7' : '#475569'};">
            ${diffSign} ${m.unit || ''}
          </td>
          <td style="padding: 10px 10px; font-family: monospace; font-size: 11px; font-weight: 700; color: ${diffNum < 0 ? '#059669' : diffNum > 0 ? '#0284c7' : '#475569'};">
            ${pctStr}
          </td>
          <td style="padding: 10px 10px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: #f1f5f9; color: ${trendColor}; border: 1px solid #e2e8f0;">
              ${m.trend}
            </span>
          </td>
          <td style="padding: 10px 10px; font-size: 10.5px;">
            <div>${statusBadge}</div>
            <div style="font-family: monospace; font-size: 9.5px; color: #64748b; margin-top: 3px;">Ref: ${refRange}</div>
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
              Baseline Only (${olderDateFormatted})
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
              Follow-up Only (${newerDateFormatted})
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
    'This report summarizes recorded laboratory values for comparison purposes only. It is not a medical diagnosis or treatment recommendation. Reference ranges may vary by laboratory, and results should be interpreted by a qualified healthcare professional in the context of the patient’s clinical history. This tool tracks recorded values only and does not predict future clinical trajectory or claim a result will become normal.';

  const noDataHtml = `
    <div style="padding: 16px 20px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 13px; font-weight: bold;">No Matching or Readable Test Values Found</h4>
      <p style="margin: 0 0 8px 0; font-size: 11px; line-height: 1.55; color: #78350f;">
        We could not find matching laboratory test parameters between '${comparison.olderReportTitle}' (${olderDateFormatted}) and '${comparison.newerReportTitle}' (${newerDateFormatted}).
      </p>
      <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 10.5px; color: #78350f; line-height: 1.55;">
        <li>One or both documents might be diagnostic imaging (such as an X-ray, MRI, or Ultrasound), a prescription, or a non-laboratory document.</li>
        <li>The two reports measure different test panels (for example, comparing a Lipid Profile with a Liver Function Test).</li>
        <li>No readable numeric laboratory test values were provided or extracted during upload.</li>
      </ul>
      <p style="margin: 0; font-size: 10.5px; color: #78350f; font-style: italic;">
        To see a comparison, please ensure both selected documents are laboratory blood tests containing matching test parameters (such as Hemoglobin, Blood Sugar, or Lipid Profile).
      </p>
    </div>
  `;

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
          background-color: #102B4E;
          color: #ffffff;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 9px 10px;
          text-align: left;
        }
        .print-btn-bar {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border-radius: 6px;
        }
        .print-btn {
          background: #0d9488;
          color: #ffffff;
          border: none;
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #0f766e;
        }
        @media print {
          .print-btn-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <span style="font-weight: 600; font-size: 12px;">Document Preview &amp; Print Ready</span>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="brand-title">SMART PATIENT</div>
          <div class="brand-subtitle">Patient-Centred Health Record Management</div>
          <div class="study-label">Longitudinal Laboratory Comparison Report</div>
        </div>
        <div class="meta-box">
          <div><strong>Generated:</strong> ${generationDate}</div>
          <div><strong>Patient ID:</strong> <span style="font-family: monospace; font-weight: bold;">${patientCode}</span></div>
          <div><strong>Type:</strong> Laboratory Investigation (LAB)</div>
        </div>
      </div>

      <div class="patient-card">
        <div>
          <div class="card-title">Patient Profile</div>
          <div class="card-value">${patientName}</div>
          <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
            Unique Code: <strong>${patientCode}</strong>
          </div>
        </div>
        <div>
          <div class="card-title">Comparative Study Timeline</div>
          <div style="font-size: 11px; color: #0f172a; margin-top: 3px;">
            <div><strong>Baseline:</strong> ${comparison.olderReportTitle} &bull; <span style="font-family: monospace;">${olderDateFormatted}</span></div>
            <div><strong>Follow-up:</strong> ${comparison.newerReportTitle} &bull; <span style="font-family: monospace;">${newerDateFormatted}</span></div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item" style="border-left: 3px solid #0284c7; background: #f0f9ff;">
          <div style="font-size: 9.5px; font-weight: 700; color: #0369a1; text-transform: uppercase;">Increased</div>
          <div class="stat-num" style="color: #0c4a6e;">${increasedDisplay}</div>
        </div>
        <div class="stat-item" style="border-left: 3px solid #059669; background: #ecfdf5;">
          <div style="font-size: 9.5px; font-weight: 700; color: #047857; text-transform: uppercase;">Decreased</div>
          <div class="stat-num" style="color: #064e3b;">${decreasedDisplay}</div>
        </div>
        <div class="stat-item" style="border-left: 3px solid #64748b; background: #f8fafc;">
          <div style="font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase;">Stable</div>
          <div class="stat-num" style="color: #1e293b;">${stableDisplay}</div>
        </div>
        <div class="stat-item" style="border-left: 3px solid #e11d48; background: ${hasOutOfRange ? '#fff1f2' : '#f8fafc'};">
          <div style="font-size: 9.5px; font-weight: 700; color: #be123c; text-transform: uppercase;">Out of Range</div>
          <div class="stat-num" style="color: #881337;">${outOfRangeDisplay}</div>
        </div>
      </div>

      <!-- Plain Language Patient Explanation Section -->
      <div style="margin-bottom: 18px; padding: 12px 14px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; page-break-inside: avoid;">
        <div style="font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Patient Plain-Language Explanation
        </div>
        <div style="font-size: 11px; color: #134e4a; font-weight: 500;">
          ${formattedDescriptionHtml}
        </div>
      </div>

      ${svgChartHtml}

      ${hasData ? `
        <table>
          <thead>
            <tr>
              <th>Laboratory Parameter</th>
              <th>Older Value (${olderDateFormatted})</th>
              <th>Newer Value (${newerDateFormatted})</th>
              <th>Difference</th>
              <th>% Change</th>
              <th>Trend</th>
              <th>Reference-Range Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      ` : noDataHtml}

      ${unmatchedHtml}

      <div style="margin-top: 22px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 9.5px; color: #92400e; page-break-inside: avoid;">
        <strong>Clinical &amp; Statutory Disclaimer:</strong> ${statutoryDisclaimer}
      </div>

      <div style="margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Smart Patient Digital Health Records &bull; Object-Oriented Healthcare Framework</span>
        <span>Confidential Medical Document &bull; Generated for Patient Sovereign Records</span>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 450);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
