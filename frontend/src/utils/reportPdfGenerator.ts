import { ReportComparisonResult, ComparedMetric } from '../types';

export interface ComparisonPrintOptions {
  patientName?: string;
  patientCode?: string;
}

function generateSvgBarChart(metrics: ComparedMetric[], olderDate: string, newerDate: string): string {
  if (!metrics || metrics.length === 0) return '';
  const chartHeight = 160;
  const barAreaHeight = 100;
  const colWidth = 90;
  const totalWidth = Math.max(500, metrics.length * colWidth + 60);

  const maxVal = Math.max(...metrics.map((m) => Math.max(m.olderValue, m.newerValue, 1)));

  let barsSvg = '';
  metrics.forEach((m, i) => {
    const x = 50 + i * colWidth;
    const h1 = Math.max(4, (m.olderValue / maxVal) * barAreaHeight);
    const h2 = Math.max(4, (m.newerValue / maxVal) * barAreaHeight);
    const y1 = 125 - h1;
    const y2 = 125 - h2;
    const label = m.testName.length > 11 ? m.testName.substring(0, 11) + '..' : m.testName;

    barsSvg += `
      <g>
        <!-- Baseline Bar -->
        <rect x="${x}" y="${y1}" width="16" height="${h1}" fill="#94a3b8" rx="2" />
        <text x="${x + 8}" y="${y1 - 3}" font-size="9" text-anchor="middle" fill="#64748b" font-family="sans-serif">${m.olderValue}</text>

        <!-- Follow-up Bar -->
        <rect x="${x + 20}" y="${y2}" width="16" height="${h2}" fill="#0d9488" rx="2" />
        <text x="${x + 28}" y="${y2 - 3}" font-size="9" text-anchor="middle" fill="#0f766e" font-weight="bold" font-family="sans-serif">${m.newerValue}</text>

        <!-- X Axis Label -->
        <text x="${x + 18}" y="140" font-size="9" text-anchor="middle" fill="#334155" font-family="sans-serif">${label}</text>
        <text x="${x + 18}" y="152" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">${m.unit}</text>
      </g>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 12px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          Visual Biomarker Trend Chart (Baseline vs Follow-up)
        </span>
        <div style="display: flex; gap: 14px; font-size: 10px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #94a3b8; border-radius: 2px;"></span>
            <span style="color: #475569;">Baseline (${olderDate})</span>
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

export function printOrDownloadComparisonPdf(
  comparison: ReportComparisonResult,
  options: ComparisonPrintOptions = {}
): void {
  const printWindow = window.open('', '_blank', 'width=920,height=780');
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

  const increased = comparison.increasedCount ?? comparison.matchedMetrics.filter((m) => m.trend === 'INCREASED').length;
  const decreased = comparison.decreasedCount ?? comparison.matchedMetrics.filter((m) => m.trend === 'DECREASED').length;
  const stable = comparison.stableCount ?? comparison.matchedMetrics.filter((m) => m.trend === 'UNCHANGED').length;
  const outOfRange = comparison.outOfRangeCount ?? comparison.matchedMetrics.filter((m) => m.newerStatus !== 'NORMAL').length;

  const tableRows = comparison.matchedMetrics
    .map((m) => {
      const isOor = m.newerStatus !== 'NORMAL';
      const trendColor =
        m.trend === 'DECREASED'
          ? '#059669' // emerald-600
          : m.trend === 'INCREASED'
          ? '#0284c7' // sky-600
          : '#64748b'; // slate-500
      const diffSign = m.difference > 0 ? `+${m.difference}` : `${m.difference}`;
      const pctSign =
        m.percentageDifference !== undefined
          ? m.percentageDifference > 0
            ? `+${m.percentageDifference}%`
            : `${m.percentageDifference}%`
          : 'N/A';

      const refRange =
        m.referenceRangeMin !== undefined && m.referenceRangeMax !== undefined
          ? `${m.referenceRangeMin} - ${m.referenceRangeMax}`
          : 'N/A';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${isOor ? 'background-color: #fffbeb;' : ''}">
          <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${m.testName}</td>
          <td style="padding: 10px 12px; font-family: monospace; color: #334155;">
            ${m.olderValue} ${m.unit}
            <span style="font-size: 10px; color: #64748b;">(${m.olderStatus})</span>
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; color: ${isOor ? '#b45309' : '#0f172a'};">
            ${m.newerValue} ${m.unit}
            <span style="font-size: 10px; color: ${isOor ? '#b45309' : '#64748b'};">(${m.newerStatus})</span>
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-weight: 600; color: ${m.difference < 0 ? '#059669' : m.difference > 0 ? '#0284c7' : '#475569'};">
            ${diffSign} ${m.unit}
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; color: ${m.difference < 0 ? '#059669' : m.difference > 0 ? '#0284c7' : '#475569'};">
            ${pctSign}
          </td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background-color: #f1f5f9; color: ${trendColor};">
              ${m.trend}
            </span>
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #64748b;">
            ${refRange}
          </td>
        </tr>
      `;
    })
    .join('');

  const svgChartHtml = generateSvgBarChart(comparison.matchedMetrics, comparison.olderReportDate, comparison.newerReportDate);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Smart Patient - Laboratory Comparison Report (${patientCode})</title>
      <style>
        @page {
          size: A4;
          margin: 12mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 20px;
          background-color: #ffffff;
          font-size: 12px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
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
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .patient-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }
        .card-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 2px;
        }
        .card-value {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .stat-item {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          text-align: center;
          background: #fafafa;
        }
        .stat-num {
          font-size: 16px;
          font-weight: 800;
          margin-top: 2px;
        }
        .summary-box {
          background-color: #f0fdfa;
          border-left: 4px solid #0d9488;
          padding: 10px 14px;
          border-radius: 0 6px 6px 0;
          margin-bottom: 16px;
          font-size: 11.5px;
          color: #134e4a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 12px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .disclaimer-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 10px 14px;
          color: #92400e;
          font-size: 10.5px;
          line-height: 1.45;
          margin-top: 14px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; padding: 10px 14px; background: #e0f2fe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 600; color: #0369a1;">
          Smart Patient Longitudinal Analysis Report
        </span>
        <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
          Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="brand-title">SMART PATIENT HEALTHCARE</div>
          <div class="brand-subtitle">Longitudinal Laboratory Comparison Report</div>
        </div>
        <div class="meta-box">
          <div><strong>Generated:</strong> ${generationDate}</div>
          <div><strong>System:</strong> Secure Digital Health Record</div>
        </div>
      </div>

      <div class="patient-card">
        <div>
          <div class="card-title">Patient Identification</div>
          <div class="card-value">${patientName}</div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 2px;">
            Unique Patient Code: <strong>${patientCode}</strong>
          </div>
        </div>
        <div>
          <div class="card-title">Comparative Test Studies</div>
          <div style="font-size: 11px; color: #334155;">
            <strong>Baseline:</strong> ${comparison.olderReportTitle} (${comparison.olderReportDate})
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            <strong>Follow-up:</strong> ${comparison.newerReportTitle} (${comparison.newerReportDate})
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="card-title">Increased</div>
          <div class="stat-num" style="color: #0284c7;">${increased}</div>
        </div>
        <div class="stat-item">
          <div class="card-title">Decreased</div>
          <div class="stat-num" style="color: #059669;">${decreased}</div>
        </div>
        <div class="stat-item">
          <div class="card-title">Unchanged / Stable</div>
          <div class="stat-num" style="color: #64748b;">${stable}</div>
        </div>
        <div class="stat-item" style="${outOfRange > 0 ? 'background: #fff7ed; border-color: #fed7aa;' : ''}">
          <div class="card-title">Out of Range</div>
          <div class="stat-num" style="color: ${outOfRange > 0 ? '#ea580c' : '#10b981'};">${outOfRange}</div>
        </div>
      </div>

      ${
        comparison.summary
          ? `<div class="summary-box">
              <strong>Clinical Observation Summary:</strong> ${comparison.summary}
            </div>`
          : ''
      }

      ${svgChartHtml}

      <table>
        <thead>
          <tr>
            <th>Laboratory Test Parameter</th>
            <th>Baseline (${comparison.olderReportDate})</th>
            <th>Follow-up (${comparison.newerReportDate})</th>
            <th>Difference</th>
            <th>% Change</th>
            <th>Trend</th>
            <th>Reference Range</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="disclaimer-box">
        <strong>Statutory Medical Disclaimer:</strong> ${comparison.disclaimer}
      </div>

      <div class="footer">
        <div>Smart Patient Health & Hospital Management Platform &bull; Confidential Medical Record</div>
        <div>Providence College of Engineering &bull; Department of CSE</div>
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
