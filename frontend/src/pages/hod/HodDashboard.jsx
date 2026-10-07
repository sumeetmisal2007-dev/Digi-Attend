import { useState, useEffect } from 'react'
import { Users, BookOpen, AlertTriangle, CheckCircle2, Calendar, FileSpreadsheet, ShieldAlert, ArrowDown, FileDown, Send, MessageCircle, Download } from 'lucide-react'
import { apiFetch } from '../../utils/api'
import { generateDefaulterPDF } from '../../utils/pdfGenerator'
import { exportToCSV } from '../../utils/csvExport'
import DefaulterAlertModal from '../../components/DefaulterAlertModal'

export default function HodDashboard() {
  const [selectedMonth, setSelectedMonth] = useState('2026-09')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewFilter, setViewFilter] = useState('defaulters') // 'defaulters' or 'all'
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const handleDownloadPDF = () => {
    if (!data) return
    setGeneratingPdf(true)
    try {
      generateDefaulterPDF({
        monthLabel: data.monthLabel,
        defaulters: data.defaulters,
        stats: data.stats,
        threshold: 75,
        department: 'Information Technology'
      })
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('Failed to generate PDF: ' + err.message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleExportCSV = () => {
    if (!data?.allStudents?.length) return
    const exportRows = data.allStudents.map((s, idx) => ({
      'Sr No': idx + 1,
      'Roll Number': s.roll_number,
      'Student Name': s.name,
      'Batch': s.batch || 'A1',
      'Theory %': `${s.lecturePercentage}%`,
      'Practical %': `${s.practicalPercentage}%`,
      'Attended Sessions': s.attended,
      'Total Sessions': s.total,
      'Overall Attendance %': `${s.percentage}%`,
      'Status': s.percentage < 75 ? 'DEFAULTER' : 'REGULAR'
    }))
    const cleanMonth = selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')
    exportToCSV(`Dept_Attendance_Report_${cleanMonth}`, exportRows)
  }

  useEffect(() => {
    async function loadDefaulters() {
      setLoading(true)
      try {
        const res = await apiFetch(`/hod/monthly-defaulters?month=${selectedMonth}`)
        setData(res)
      } catch (err) {
        console.error('Failed to load monthly defaulters', err)
      } finally {
        setLoading(false)
      }
    }
    loadDefaulters()
  }, [selectedMonth])

  const studentList = viewFilter === 'defaulters' ? data?.defaulters : data?.allStudents

  return (
    <>
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Department Monthly Monitoring</h1>
          <p>Information Technology — Monthly attendance report, subject/practical tracking & defaulters roster</p>
        </div>

        {/* Action Controls & Month Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>
              Report Month:
            </label>
            <select 
              className="form-input" 
              style={{ width: 'auto', fontWeight: 600, padding: '8px 14px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {data?.availableMonths?.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              )) || (
                <>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">August 2026</option>
                </>
              )}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={generatingPdf || !data}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '8px 14px' }}
            title="Generate and download institutional A4 PDF of defaulters"
          >
            <FileDown size={16} />
            {generatingPdf ? 'Generating PDF...' : 'Create Defaulter PDF'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={!data || !data?.allStudents?.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '8px 14px' }}
            title="Export full department attendance table to CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            className="btn"
            onClick={() => setIsAlertModalOpen(true)}
            disabled={!data || data?.defaulters?.length === 0}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: '#15803d', 
              borderColor: '#86efac', 
              background: '#f0fdf4',
              fontWeight: 600,
              padding: '8px 14px'
            }}
            title="Dispatch WhatsApp and Email warnings to monthly defaulters"
          >
            <Send size={16} />
            Send Defaulter Warnings ({data?.stats?.defaulterCount || 0})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p>Generating department monthly attendance analytics for {selectedMonth}...</p>
        </div>
      ) : !data ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p>No attendance data recorded for this month.</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid four-col" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-top">
                <span>Dept Attendance</span>
                <span className="stat-icon success"><CheckCircle2 size={16} /></span>
              </div>
              <strong className="stat-value">{data.stats.deptAvgPercentage}%</strong>
              <p className="stat-detail">Average for {data.monthLabel}</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Monthly Defaulters</span>
                <span className="stat-icon danger"><AlertTriangle size={16} /></span>
              </div>
              <strong className="stat-value" style={{ color: 'var(--danger)' }}>
                {data.stats.defaulterCount}
              </strong>
              <p className="stat-detail">Below 75% threshold in {data.monthLabel}</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Eligible Students</span>
                <span className="stat-icon success"><Users size={16} /></span>
              </div>
              <strong className="stat-value" style={{ color: 'var(--success)' }}>
                {data.stats.eligibleCount}
              </strong>
              <p className="stat-detail">Satisfies &ge; 75% attendance</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Sessions Conducted</span>
                <span className="stat-icon info"><BookOpen size={16} /></span>
              </div>
              <strong className="stat-value">{data.stats.totalSessionsConducted}</strong>
              <p className="stat-detail">{data.stats.lectureSessionsCount} lectures, {data.stats.practicalSessionsCount} practicals</p>
            </div>
          </div>

          {/* Monthly Defaulter List Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
                  {viewFilter === 'defaulters' ? `Monthly Defaulter List (< 75%) — ${data.monthLabel}` : `All Students Attendance — ${data.monthLabel}`}
                </h2>
                <p className="text-muted">
                  Official list generated based on lecture and practical sessions conducted in {data.monthLabel}
                </p>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className={`btn btn-sm ${viewFilter === 'defaulters' ? 'btn-primary' : ''}`}
                  onClick={() => setViewFilter('defaulters')}
                  style={{ fontWeight: 600 }}
                >
                  Defaulters Only ({data.stats.defaulterCount})
                </button>
                <button 
                  className={`btn btn-sm ${viewFilter === 'all' ? 'btn-primary' : ''}`}
                  onClick={() => setViewFilter('all')}
                  style={{ fontWeight: 600 }}
                >
                  All Students ({data.stats.totalStudents})
                </button>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / ID Number</th>
                  <th>Batch</th>
                  <th>Student Name</th>
                  <th>Monthly Total</th>
                  <th>Theory Lecture %</th>
                  <th>Practical Lab %</th>
                  <th>Overall %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentList?.map((s) => {
                  const isDefaulter = s.isDefaulter
                  return (
                    <tr key={s.id}>
                      <td><span className="course-badge">{s.roll_number}</span></td>
                      <td>
                        <span 
                          className="badge badge-purple" 
                          style={{ fontWeight: 700, fontSize: '11px' }}
                        >
                          {s.batch || 'A1'}
                        </span>
                      </td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.attended} / {s.total}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{s.lecturePercentage}%</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{s.practicalPercentage}%</span>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar">
                            <div
                              className={`progress-fill ${isDefaulter ? 'low' : 'ok'}`}
                              style={{ width: `${Math.min(s.percentage, 100)}%` }}
                            />
                          </div>
                          <strong style={{ color: isDefaulter ? 'var(--danger)' : 'var(--success)' }}>
                            {s.percentage}%
                          </strong>
                        </div>
                      </td>
                      <td>
                        {isDefaulter ? (
                          <span 
                            className="badge badge-purple" 
                            style={{ 
                              background: '#fef2f2', 
                              color: '#dc2626', 
                              borderColor: '#fecaca', 
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            Defaulter ({s.riskLevel})
                          </span>
                        ) : (
                          <span 
                            className="badge badge-blue" 
                            style={{ 
                              background: '#f0fdf4', 
                              color: '#16a34a', 
                              borderColor: '#bbf7d0', 
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 1-Click WhatsApp & Email Defaulter Warning Center */}
      <DefaulterAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        monthLabel={data?.monthLabel}
        defaulters={data?.defaulters}
        threshold={75}
      />
    </>
  )
}
