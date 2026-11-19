import { jsPDF } from 'jspdf';

type Cell = string | number;
type Report = { label: string; transactions: Cell[][]; payments: Cell[][]; regularFont: Uint8Array; boldFont: Uint8Array };

function base64(bytes: Uint8Array) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}

export function createSalesPdf({ label, transactions, payments, regularFont, boldFont }: Report): ArrayBuffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('Vazirmatn-Regular.ttf', base64(regularFont));
  doc.addFileToVFS('Vazirmatn-Bold.ttf', base64(boldFont));
  doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
  doc.addFont('Vazirmatn-Bold.ttf', 'Vazirmatn', 'bold');
  doc.setR2L(false);
  const number = new Intl.NumberFormat('fa-IR');
  const text = (value: Cell) => typeof value === 'number' ? number.format(value) : value;
  const write = (value: Cell, x: number, y: number, size = 10, bold = false, color = '#17171b') => {
    doc.setFont('Vazirmatn', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(text(value), x, y, { align: 'right' });
  };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 17;
  const width = pageWidth - 2 * margin;
  doc.setFillColor('#6047df');
  doc.roundedRect(margin, 16, width, 39, 4, 4, 'F');
  write('آرینو', pageWidth - margin - 9, 27, 10, true, '#e5dfff');
  write('گزارش فروش روزانه', pageWidth - margin - 9, 38, 18, true, '#ffffff');
  write(label, pageWidth - margin - 9, 49, 9, false, '#eeeaff');
  let y = 66;
  const table = (title: string, rows: Cell[][], widths: number[]) => {
    const rowHeight = 8;
    const required = 13 + rows.length * rowHeight;
    if (y + required > pageHeight - 18) { doc.addPage(); y = 18; }
    write(title, pageWidth - margin, y, 12, true);
    y += 6;
    rows.forEach((row, index) => {
      const isTotal = index === rows.length - 1;
      doc.setFillColor(index === 0 ? '#efedff' : isTotal ? '#f4f2ff' : index % 2 === 0 ? '#f8f8fa' : '#ffffff');
      doc.rect(margin, y, width, rowHeight, 'F');
      let right = pageWidth - margin;
      widths.forEach((colWidth, col) => {
        const cell = row[col];
        if (cell !== undefined && cell !== '') write(index === 0 && typeof cell === 'string' ? cell.replace(' (تومان)', '') : cell, right - 3, y + 5.5, 8.5, index === 0 || isTotal);
        right -= colWidth;
      });
      y += rowHeight;
    });
    y += 13;
  };
  table('خلاصه تراکنش‌ها', transactions, [58, 37, 40, 41]);
  table('خلاصه گردش وجوه', payments, [70, 53, 53]);
  doc.setDrawColor('#e3e3e8');
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
  write('مبالغ به تومان • گزارش کسب‌وکار آرینو', pageWidth - margin, pageHeight - 10, 8, false, '#777780');
  return doc.output('arraybuffer');
}
