import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  FlaskConical, 
  BarChart3, 
  Clock, 
  Calculator, 
  TrendingDown, 
  Minus, 
  Plus, 
  CalendarX, 
  Sparkles,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function StudentAnalysis() {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState('2026-09')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [simMode, setSimMode] = useState('subject') 
  const [selectedItemKey, setSelectedItemKey] = useState('')
  const [missCount, setMissCount] = useState(1)
  const [missDays, setMissDays] = useState(1)

  useEffect(() => {
    async function loadAnalysis() {
      if (!user?.id) return
      setLoading(true)
      try {
        const res = await apiFetch(`/student/${user.id}/monthly-analysis?month=${selectedMonth}`)
        setData(res)
        if (res?.lectures?.length > 0 && !selectedItemKey) {
          setSelectedItemKey(`lecture_${res.lectures[0].code}`)
        }
      } catch (err) {
        console.error('Failed to load monthly attendance analysis', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalysis()
  }, [user, selectedMonth])

  const allItems = [
    ...(data?.lectures || []).map(l => ({ ...l, itemKey: `lecture_${l.code}`, category: 'Lecture' })),
    ...(data?.practicals || []).map(p => ({ ...p, itemKey: `practical_${p.code}`, category: 'Practical' }))
  ]

  const currentSelectedItem = allItems.find(item => item.itemKey === selectedItemKey) || allItems[0]

  const subjAttended = currentSelectedItem?.attended || 0
  const subjTotal = currentSelectedItem?.total || 0
  const projSubjTotal = subjTotal + missCount
  const projSubjAttended = subjAttended 
  const projSubjPct = projSubjTotal > 0 ? Number(((projSubjAttended / projSubjTotal) * 100).toFixed(1)) : 0
  const subjDrop = Number(((currentSelectedItem?.percentage || 0) - projSubjPct).toFixed(1))
  const isSubjDefaulterNow = projSubjPct < 75
  const subjClassesToRecover = isSubjDefaulterNow && projSubjTotal > 0
    ? Math.max(0, Math.ceil((0.75 * projSubjTotal - projSubjAttended) / 0.25))
    : 0
  const subjSafeBunkBuffer = Math.max(0, Math.floor((subjAttended - 0.75 * subjTotal) / 0.75))

  const currentOverallAttended = data?.overall?.attended || 0
  const currentOverallTotal = data?.overall?.total || 0
  const projOverallTotalFromSubj = currentOverallTotal + missCount
  const projOverallAttendedFromSubj = currentOverallAttended
  const projOverallPctFromSubj = projOverallTotalFromSubj > 0 
    ? Number(((projOverallAttendedFromSubj / projOverallTotalFromSubj) * 100).toFixed(1)) 
    : 0
  const overallDropFromSubj = Number(((data?.overall?.percentage || 0) - projOverallPctFromSubj).toFixed(1))
  const isOverallDefaulterFromSubj = projOverallPctFromSubj < 75

  const sessionsPerDay = 4
  const totalSessionsMissedDay = missDays * sessionsPerDay
  const projOverallTotalFromDay = currentOverallTotal + totalSessionsMissedDay
  const projOverallAttendedFromDay = currentOverallAttended
  const projOverallPctFromDay = projOverallTotalFromDay > 0
    ? Number(((projOverallAttendedFromDay / projOverallTotalFromDay) * 100).toFixed(1))
    : 0
  const overallDropFromDay = Number(((data?.overall?.percentage || 0) - projOverallPctFromDay).toFixed(1))
  const isOverallDefaulterFromDay = projOverallPctFromDay < 75
  const overallClassesToRecoverDay = isOverallDefaulterFromDay && projOverallTotalFromDay > 0
    ? Math.max(0, Math.ceil((0.75 * projOverallTotalFromDay - projOverallAttendedFromDay) / 0.25))
    : 0
  const overallSafeBunkBuffer = Math.max(0, Math.floor((currentOverallAttended - 0.75 * currentOverallTotal) / 0.75))

  return (
    <>
      {}
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Monthly Attendance Analysis</h1>
          <p>Subject-wise breakdown of Theory Lectures and Practical Labs for the selected month</p>
        </div>

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>
            Select Month:
          </label>
          <select 
            className="form-input" 
            style={{ width: 'auto', fontWeight: 600, padding: '8px 14px' }}
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
              setSelectedItemKey('')
            }}
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
      </div>

      {loading ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p>Loading monthly attendance data for {selectedMonth}...</p>
        </div>
      ) : !data ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p>No records found for this month.</p>
        </div>
      ) : (
        <>
          {}
          <div className="card overall-banner" style={{ marginBottom: '24px' }}>
            <div>
              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} />
                Overall Attendance ({data.monthLabel})
              </span>
              <strong className={`overall-pct ${data.overall.isDefaulter ? 'low' : 'ok'}`}>
                {data.overall.percentage}%
              </strong>
              <span className="text-muted">
                {data.overall.attended} of {data.overall.total} total sessions attended in {data.monthLabel}
              </span>
            </div>

            {data.overall.isDefaulter ? (
              <div className="alert-banner danger" style={{ maxWidth: '480px' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Monthly Defaulter Alert (&lt; 75%):</strong>
                  <div>
                    Your overall attendance for {data.monthLabel} is below 75%. Attend the next{' '}
                    <strong>{data.overall.classesNeeded}</strong> classes to clear this month&apos;s defaulter list.
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert-banner success" style={{ maxWidth: '480px' }}>
                <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Criteria Satisfied:</strong>
                  <div>You satisfy the mandatory 75% attendance requirement for {data.monthLabel}.</div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="stats-grid four-col" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-top">
                <span>Theory Lectures</span>
                <span className="stat-icon info"><BookOpen size={16} /></span>
              </div>
              <strong className="stat-value">{data.summary.lecturePercentage}%</strong>
              <p className="stat-detail">{data.summary.lectureAttended} of {data.summary.lectureTotal} lectures</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Practical Labs</span>
                <span className="stat-icon info"><FlaskConical size={16} /></span>
              </div>
              <strong className="stat-value">{data.summary.practicalPercentage}%</strong>
              <p className="stat-detail">{data.summary.practicalAttended} of {data.summary.practicalTotal} lab batches</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Monthly Status</span>
                <span className={`stat-icon ${data.overall.isDefaulter ? 'danger' : 'success'}`}>
                  {data.overall.isDefaulter ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                </span>
              </div>
              <strong className="stat-value" style={{ fontSize: '18px', color: data.overall.isDefaulter ? 'var(--danger)' : 'var(--success)' }}>
                {data.overall.isDefaulter ? 'Defaulter List' : 'Regular / Eligible'}
              </strong>
              <p className="stat-detail">{data.monthLabel} Report</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Safe Bunk Buffer</span>
                <span className="stat-icon success"><ShieldCheck size={16} /></span>
              </div>
              <strong className="stat-value" style={{ color: overallSafeBunkBuffer > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {overallSafeBunkBuffer} {overallSafeBunkBuffer === 1 ? 'class' : 'classes'}
              </strong>
              <p className="stat-detail">{overallSafeBunkBuffer > 0 ? 'Margin before < 75%' : '0 margin (Defaulter risk)'}</p>
            </div>
          </div>

          {}
          {}
          {}
          <div className="simulator-panel">
            <div className="simulator-header">
              <div>
                <h2 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Calculator size={20} style={{ color: 'var(--primary)' }} />
                  What-If Attendance Simulator ({data.monthLabel})
                </h2>
                <p className="text-muted" style={{ margin: 0, fontSize: '12.5px' }}>
                  Check the exact impact on your subject, practical, and overall monthly attendance if you miss classes or an entire day.
                </p>
              </div>

              {}
              <div className="sim-toggle-group">
                <button
                  type="button"
                  className={`sim-toggle-btn ${simMode === 'subject' ? 'active' : ''}`}
                  onClick={() => setSimMode('subject')}
                >
                  <BookOpen size={14} />
                  Miss Specific Subject / Lab
                </button>
                <button
                  type="button"
                  className={`sim-toggle-btn ${simMode === 'day' ? 'active' : ''}`}
                  onClick={() => setSimMode('day')}
                >
                  <CalendarX size={14} />
                  Miss Entire Day (Full Leave)
                </button>
              </div>
            </div>

            {}
            {simMode === 'subject' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
                  {}
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Select Course / Practical Lab:
                    </label>
                    <select
                      className="form-input"
                      value={selectedItemKey || allItems[0]?.itemKey}
                      onChange={(e) => setSelectedItemKey(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      <optgroup label="Theory Lectures">
                        {(data.lectures || []).map(l => (
                          <option key={`lecture_${l.code}`} value={`lecture_${l.code}`}>
                            {l.code} — {l.name} (Current: {l.percentage}%)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Practical Labs">
                        {(data.practicals || []).map(p => (
                          <option key={`practical_${p.code}`} value={`practical_${p.code}`}>
                            {p.code} — {p.name} (Current: {p.percentage}%)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {}
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      How many sessions to miss?
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="stepper-container">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setMissCount(Math.max(1, missCount - 1))}
                          disabled={missCount <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-value">{missCount}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setMissCount(missCount + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            className={`quick-chip ${missCount === n ? 'active' : ''}`}
                            onClick={() => setMissCount(n)}
                          >
                            {n} {n === 1 ? 'class' : 'classes'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="impact-grid">
                  {}
                  <div className={`impact-card ${isSubjDefaulterNow ? 'danger' : 'safe'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)' }}>
                          {currentSelectedItem?.category} Impact ({currentSelectedItem?.code})
                        </span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>
                          {currentSelectedItem?.name}
                        </strong>
                      </div>
                      <span className="stat-diff-badge drop">
                        <TrendingDown size={12} />
                        -{subjDrop}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through' }}>
                        {currentSelectedItem?.percentage}%
                      </span>
                      <strong style={{ fontSize: '24px', color: isSubjDefaulterNow ? 'var(--danger)' : 'var(--success)' }}>
                        {projSubjPct}%
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        ({projSubjAttended} of {projSubjTotal} classes)
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                      {isSubjDefaulterNow ? (
                        <span style={{ color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Defaulter Alert: This will drop your {currentSelectedItem?.name} attendance below 75%. You will need to attend {subjClassesToRecover} consecutive classes to recover!
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Safe: Attendance stays at or above 75%. You can miss up to {subjSafeBunkBuffer} total classes in this subject this month.
                        </span>
                      )}
                    </div>
                  </div>

                  {}
                  <div className={`impact-card ${isOverallDefaulterFromSubj ? 'danger' : 'safe'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)' }}>
                          Overall Monthly Impact ({data.monthLabel})
                        </span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>
                          Combined Subjects & Practicals
                        </strong>
                      </div>
                      <span className="stat-diff-badge drop">
                        <TrendingDown size={12} />
                        -{overallDropFromSubj}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through' }}>
                        {data.overall.percentage}%
                      </span>
                      <strong style={{ fontSize: '24px', color: isOverallDefaulterFromSubj ? 'var(--danger)' : 'var(--success)' }}>
                        {projOverallPctFromSubj}%
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        ({projOverallAttendedFromSubj} of {projOverallTotalFromSubj} sessions)
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                      {isOverallDefaulterFromSubj ? (
                        <span style={{ color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Warning: Your overall monthly attendance will be {projOverallPctFromSubj}% (&lt; 75%), placing you on the official {data.monthLabel} Defaulter List.
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Safe: Your overall monthly attendance will remain above the 75% threshold ({projOverallPctFromSubj}%).
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {simMode === 'day' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Number of entire college days to miss:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="stepper-container">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setMissDays(Math.max(1, missDays - 1))}
                          disabled={missDays <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-value">{missDays}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => setMissDays(missDays + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 5].map(d => (
                          <button
                            key={d}
                            type="button"
                            className={`quick-chip ${missDays === d ? 'active' : ''}`}
                            onClick={() => setMissDays(d)}
                          >
                            {d} {d === 1 ? 'Full Day' : 'Full Days'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <strong>Standard Daily Timetable:</strong> 3 Theory Lectures + 1 Practical Lab ({sessionsPerDay} sessions/day)
                    <br />
                    <span>Total sessions skipped: <strong>{totalSessionsMissedDay} sessions</strong></span>
                  </div>
                </div>

                {}
                <div className="impact-grid">
                  {}
                  <div className={`impact-card ${isOverallDefaulterFromDay ? 'danger' : 'safe'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)' }}>
                          Projected Monthly Attendance ({data.monthLabel})
                        </span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>
                          Missing {missDays} Full Day{missDays > 1 ? 's' : ''} ({totalSessionsMissedDay} sessions)
                        </strong>
                      </div>
                      <span className="stat-diff-badge drop">
                        <TrendingDown size={12} />
                        -{overallDropFromDay}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through' }}>
                        {data.overall.percentage}%
                      </span>
                      <strong style={{ fontSize: '24px', color: isOverallDefaulterFromDay ? 'var(--danger)' : 'var(--success)' }}>
                        {projOverallPctFromDay}%
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        ({projOverallAttendedFromDay} of {projOverallTotalFromDay} sessions)
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                      {isOverallDefaulterFromDay ? (
                        <span style={{ color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> High Risk: Taking {missDays} day{missDays > 1 ? 's' : ''} leave drops your monthly attendance to {projOverallPctFromDay}%. You will need {overallClassesToRecoverDay} consecutive sessions to get off the defaulter list!
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Safe to take leave: Attendance remains at {projOverallPctFromDay}% (&ge; 75%) for {data.monthLabel}.
                        </span>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="impact-card" style={{ background: '#f8fafc' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)' }}>
                      Monthly Safety Allowance Advice
                    </span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)', marginBottom: '8px' }}>
                      {overallSafeBunkBuffer > 0 ? 'Buffer Available' : 'No Buffer (Defaulter)'}
                    </strong>

                    <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                      {overallSafeBunkBuffer > 0 ? (
                        <>
                          You can afford to skip at most <strong>{overallSafeBunkBuffer} session{overallSafeBunkBuffer > 1 ? 's' : ''}</strong> (approx <strong>{Math.floor(overallSafeBunkBuffer / sessionsPerDay)} full day</strong>) in {data.monthLabel} before falling below the 75% criterion.
                        </>
                      ) : (
                        <>
                          Your current attendance ({data.overall.percentage}%) is already at or below 75%. Any full-day leave in {data.monthLabel} will further worsen your standing on the department defaulter roster.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-blue" style={{ fontSize: '13px', padding: '6px 12px' }}>
                  <BookOpen size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Theory Lectures ({data.monthLabel})
                </span>
                <span className="text-muted">{data.lectures?.length || 0} Subjects tracked separately</span>
              </div>
              <span className="text-muted" style={{ fontWeight: 600, fontSize: '13px' }}>
                Sub-total: {data.summary.lectureAttended}/{data.summary.lectureTotal} ({data.summary.lecturePercentage}%)
              </span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Name</th>
                  <th>Faculty In-Charge</th>
                  <th>Attended</th>
                  <th>Conducted</th>
                  <th>Monthly %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lectures.map((lec) => (
                  <tr key={lec.code}>
                    <td><span className="course-badge">{lec.code}</span></td>
                    <td><strong>{lec.name}</strong></td>
                    <td style={{ color: 'var(--ink-soft)' }}>{lec.facultyName}</td>
                    <td><strong>{lec.attended}</strong></td>
                    <td>{lec.total}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${lec.isDefaulter ? 'low' : 'ok'}`}
                            style={{ width: `${Math.min(lec.percentage, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontWeight: 600 }}>{lec.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      {lec.isDefaulter ? (
                        <span className="text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Need {lec.classesNeeded} more
                        </span>
                      ) : (
                        <span className="text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Eligible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-purple" style={{ fontSize: '13px', padding: '6px 12px' }}>
                  <FlaskConical size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Practical Labs ({data.monthLabel})
                </span>
                <span className="text-muted">{data.practicals?.length || 0} Labs tracked separately</span>
              </div>
              <span className="text-muted" style={{ fontWeight: 600, fontSize: '13px' }}>
                Sub-total: {data.summary.practicalAttended}/{data.summary.practicalTotal} ({data.summary.practicalPercentage}%)
              </span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Practical Lab Name</th>
                  <th>Lab Faculty In-Charge</th>
                  <th>Attended</th>
                  <th>Conducted</th>
                  <th>Monthly %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.practicals.map((prac) => (
                  <tr key={prac.code}>
                    <td><span className="course-badge" style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}>{prac.code}</span></td>
                    <td><strong>{prac.name}</strong></td>
                    <td style={{ color: 'var(--ink-soft)' }}>{prac.facultyName}</td>
                    <td><strong>{prac.attended}</strong></td>
                    <td>{prac.total}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${prac.isDefaulter ? 'low' : 'ok'}`}
                            style={{ width: `${Math.min(prac.percentage, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontWeight: 600 }}>{prac.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      {prac.isDefaulter ? (
                        <span className="text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Need {prac.classesNeeded} more
                        </span>
                      ) : (
                        <span className="text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Eligible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
