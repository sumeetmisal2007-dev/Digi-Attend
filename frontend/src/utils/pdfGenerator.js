import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateDefaulterPDF({
  monthLabel = 'September 2026',
  defaulters = [],
  stats = {},
  threshold = 75,
  department = 'Information Technology'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(15, 29, 47) 
  doc.rect(0, 0, pageWidth, 5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(12, 74, 110) 
  doc.text('TERNA ENGINEERING COLLEGE', pageWidth / 2, 14, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105) 
  doc.text('Plot No. 12, Sector-22, Nerul, Navi Mumbai - 400706 | www.ternaengg.ac.in', pageWidth / 2, 19, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(`DEPARTMENT OF ${department.toUpperCase()}`, pageWidth / 2, 25, { align: 'center' })

  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)
  doc.line(14, 28, pageWidth - 14, 28)

  doc.setFillColor(254, 242, 242) 
  doc.roundedRect(14, 31, pageWidth - 28, 12, 2, 2, 'F')
  doc.setDrawColor(254, 202, 202) 
  doc.roundedRect(14, 31, pageWidth - 28, 12, 2, 2, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(185, 28, 28) 
  doc.text(`OFFICIAL MONTHLY ATTENDANCE DEFAULTER LIST (< ${threshold}% ATTENDANCE)`, pageWidth / 2, 38.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)

  const dateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  doc.text(`Academic Period: ${monthLabel}`, 14, 48)
  doc.text(`Class: SE IT (Semester 3)`, 14, 53)
  doc.text(`Total Class Strength: ${stats.totalStudents || 80}`, 80, 48)
  doc.text(`Defaulter Count: ${defaulters.length} students`, 80, 53)
  doc.text(`Dept Average Attendance: ${stats.deptAvgPercentage || 76.4}%`, 140, 48)
  doc.text(`Report Date: ${dateStr}`, 140, 53)

  const tableRows = defaulters.map((s, idx) => {
    return [
      idx + 1,
      s.roll_number,
      s.batch || (idx < 36 ? 'A1' : 'A2'),
      s.name,
      `${s.lecturePercentage}%`,
      `${s.practicalPercentage}%`,
      `${s.attended} / ${s.total}`,
      `${s.percentage}%`,
      s.riskLevel || 'Defaulter'
    ]
  })

  autoTable(doc, {
    startY: 57,
    head: [[
      'Sr',
      'Roll No',
      'Batch',
      'Student Name',
      'Theory %',
      'Lab %',
      'Attended/Total',
      'Overall %',
      'Risk Category'
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'No defaulters recorded for this period', '-', '-', '-', '100%', 'Safe']],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 29, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 12 },
      3: { cellWidth: 50, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 16, fontStyle: 'bold', textColor: [220, 38, 38] },
      8: { halign: 'center', cellWidth: 20 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const str = `Page ${doc.internal.getNumberOfPages()}`
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
      doc.text('Terna Engineering College — Autonomous Attendance Information System', 14, doc.internal.pageSize.getHeight() - 8)
    }
  })

  const finalY = doc.lastAutoTable.finalY + 18
  const signatureY = finalY > 260 ? 260 : finalY

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)

  const col1 = 20
  const col2 = 85
  const col3 = 150

  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.4)

  doc.line(col1, signatureY, col1 + 45, signatureY)
  doc.line(col2, signatureY, col2 + 45, signatureY)
  doc.line(col3, signatureY, col3 + 45, signatureY)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Class Advisor', col1 + 8, signatureY + 4)
  doc.text('Academic Coordinator', col2 + 5, signatureY + 4)
  doc.text('Dr. Sujata Kadu', col3 + 12, signatureY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('IT Dept Advisor', col1 + 9, signatureY + 8)
  doc.text('Terna Engg College', col2 + 7, signatureY + 8)
  doc.text('Head of Department (IT)', col3 + 6, signatureY + 8)

  const cleanMonth = monthLabel.replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `Terna_IT_Defaulters_${cleanMonth}.pdf`
  doc.save(fileName)
  return fileName
}
