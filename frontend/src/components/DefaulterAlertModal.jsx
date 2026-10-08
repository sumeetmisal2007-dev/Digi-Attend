import { useState } from 'react'
import { X, Send, MessageCircle, Mail, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { apiFetch } from '../utils/api'

export default function DefaulterAlertModal({ isOpen, onClose, monthLabel, defaulters = [], threshold = 75 }) {
  if (!isOpen) return null

  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const handleSendBatchAlerts = async (channel) => {
    setSending(true)
    setResult(null)
    try {
      const res = await apiFetch('/hod/notify-defaulters', {
        method: 'POST',
        body: JSON.stringify({
          month: monthLabel,
          channel,
          threshold,
          defaulterIds: defaulters.map(d => d.id)
        })
      })
      setResult({ type: 'success', message: res.message })
    } catch (err) {
      setResult({ type: 'danger', message: err.message || 'Failed to dispatch alerts' })
    } finally {
      setSending(false)
    }
  }

  const getWhatsAppLink = (student) => {
    const text = encodeURIComponent(
      `*TERNA ENGINEERING COLLEGE — IT DEPARTMENT*\n` +
      `*OFFICIAL ATTENDANCE DEFAULTER NOTICE*\n\n` +
      `Dear ${student.name} (Roll: ${student.roll_number}),\n` +
      `Your cumulative attendance for *${monthLabel}* is *${student.percentage}%*, which is below the mandatory *${threshold}%* threshold required by Mumbai University regulations.\n\n` +
      `*Sessions Attended:* ${student.attended} / ${student.total}\n` +
      `*Risk Level:* ${student.riskLevel}\n\n` +
      `*Action Required:* You are required to meet your Class Advisor & HOD Dr. Sujata Kadu immediately to submit your undertaking and clear the defaulter list.`
    )
    return `https://wa.me/?text=${text}`
  }

  return (
    <div style={overlayStyle}>
      <div className="card" style={modalBoxStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
              Automated Defaulter Warning Center
            </h2>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Dispatch official WhatsApp and Email attendance warnings for {monthLabel} ({defaulters.length} students &lt; {threshold}%)
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
          >
            <X size={20} />
          </button>
        </div>

        {result && (
          <div className={`alert-banner ${result.type}`} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{result.message}</span>
          </div>
        )}

        {}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendBatchAlerts('email')}
            disabled={sending || defaulters.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {sending ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
            Dispatch Batch Email Warnings ({defaulters.length})
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => handleSendBatchAlerts('whatsapp')}
            disabled={sending || defaulters.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', borderColor: '#bbf7d0', background: '#f0fdf4' }}
          >
            <MessageCircle size={16} />
            Log Batch WhatsApp Alerts
          </button>
        </div>

        {}
        <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Attendance %</th>
                <th>1-Click Action</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-soft)' }}>
                    No students currently below the {threshold}% requirement for this month.
                  </td>
                </tr>
              ) : (
                defaulters.map((s) => (
                  <tr key={s.id}>
                    <td><span className="course-badge">{s.roll_number}</span></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="badge badge-purple">{s.batch || 'A1'}</span></td>
                    <td>
                      <strong style={{ color: 'var(--danger)' }}>{s.percentage}%</strong>
                    </td>
                    <td>
                      <a
                        href={getWhatsAppLink(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#15803d',
                          background: '#f0fdf4',
                          borderColor: '#86efac',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 8px'
                        }}
                      >
                        <MessageCircle size={12} />
                        WhatsApp Alert &rarr;
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px'
}

const modalBoxStyle = {
  width: '100%',
  maxWidth: '680px',
  background: 'var(--surface)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
}
