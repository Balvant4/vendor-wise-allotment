'use client';

// Requires two new dependencies — add to package.json:
//   npm install jspdf jspdf-autotable
//
// Lightweight, fully client-side PDF export: a KPI summary block followed
// by a record table. No server-side rendering or headless-browser service
// needed. Dynamically imported so these libraries never end up in the main
// bundle for people who never click "Export PDF".

import type { VehicleRecord } from '@/types';

interface ExportInput {
  title: string;
  subtitle?: string;
  kpis?: Record<string, string | number>;
  rows: VehicleRecord[];
}

export async function exportTableToPDF({ title, subtitle, kpis, rows }: ExportInput): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;

  const doc = new JsPDF({ orientation: 'landscape' });

  doc.setFontSize(15);
  doc.text(title, 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(subtitle ?? `Generated ${new Date().toLocaleString('en-IN')}`, 14, 20);
  doc.setTextColor(0);

  let startY = 27;
  if (kpis && Object.keys(kpis).length > 0) {
    const entries = Object.entries(kpis);
    doc.setFontSize(9);
    const perRow = 4;
    entries.forEach(([label, value], i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      doc.text(`${label}: ${value}`, 14 + col * 68, startY + row * 6);
    });
    startY += Math.ceil(entries.length / perRow) * 6 + 6;
  }

  autoTable(doc, {
    startY,
    head: [['Vehicle No', 'Container', 'Transporter', 'Division', 'Customer', 'Duration', 'Status']],
    body: rows.map((r) => [
      r.vehicleNo,
      r.containerNo,
      r.transporter,
      r.division,
      r.customerName,
      r.hasIncompleteData ? '—' : `${r.diffHours?.toFixed?.(1) ?? r.diffHours}h`,
      r.isOver25h ? 'Detention' : 'OK',
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`current-month-report_${Date.now()}.pdf`);
}