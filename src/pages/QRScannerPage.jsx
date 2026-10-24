import { useEffect, useRef, useState } from 'react'
import { Camera, Check, CircleAlert, ScanLine } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { studentsApi, visitsApi } from '../services/api'

export default function QRScannerPage() {
  
  // QR scanning flow: open the camera, read the student QR, verify the ID, and record the visit.
  const [active, setActive] = useState(false)
  const [student, setStudent] = useState(null)
  const [purpose, setPurpose] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [busy, setBusy] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const scanner = useRef(null)
  const locked = useRef(false)
  const timer = useRef(null)

  const stop = async () => {
    if (scanner.current?.isScanning) {
      try { await scanner.current.stop() } catch (e) { console.error('Unable to stop camera:', e) }
    }
    scanner.current?.clear()
    scanner.current = null
    setActive(false)
  }
  const start = async () => {
    setMessage(''); setStudent(null); setPurpose(''); setRecorded(false); locked.current = false
    setActive(true)
  }

  useEffect(() => {
    if (!active) return undefined
    let cancelled = false
    const initialize = async () => {
      await new Promise((resolve) => setTimeout(resolve, 80))
      if (cancelled) return
      try {
        const instance = new Html5Qrcode('qr-reader')
        scanner.current = instance
        await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 }, async (decodedText) => {
          if (locked.current) return
          locked.current = true
          try { instance.pause(true) } catch (e) { console.error('Unable to pause camera after scan:', e) }
          try {
            const response = await studentsApi.get(decodedText)
            setStudent(response.data)
            setMessage('')
          } catch (e) {
            setMessage(e.message || 'This QR code does not match an active student.')
            setMessageType('error')
            locked.current = false
            window.setTimeout(() => { if (scanner.current?.isScanning) scanner.current.resume() }, 2200)
          }
        }, () => {})
      } catch (e) {
        setMessage(e.message?.includes('NotAllowed') ? 'Camera access was blocked. Allow camera access in your browser settings.' : 'Could not start the camera. Check that it is connected and available.')
        setMessageType('error')
      }
    }
    initialize()
    return () => {
      cancelled = true
      if (scanner.current?.isScanning) scanner.current.stop().catch((e) => console.error('Unable to stop camera:', e))
      scanner.current?.clear()
      scanner.current = null
    }
  }, [active])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const record = async () => {
    if (!student || !purpose || busy) return
    setBusy(true); setMessage('')
    try {
      await visitsApi.create({ qr_identifier: student.qr_identifier, purpose })
      setMessage('Visit recorded successfully. Ready for the next student.')
      setMessageType('success')
      setRecorded(true)
      timer.current = window.setTimeout(() => { setStudent(null); setPurpose(''); setRecorded(false); setMessage(''); locked.current = false; scanner.current?.resume() }, 2200)
    } catch (e) {
      setMessage(e.message)
      setMessageType('error')
      if (e.message.toLowerCase().includes('recorded recently')) {
        timer.current = window.setTimeout(() => {
          setStudent(null); setPurpose(''); setMessage(''); locked.current = false
          if (scanner.current?.isScanning) scanner.current.resume()
        }, 2200)
      }
    } finally { setBusy(false) }
  }

  const nextStudent = () => {
    window.clearTimeout(timer.current)
    setStudent(null); setPurpose(''); setRecorded(false); setMessage(''); locked.current = false
    if (scanner.current?.isScanning) scanner.current.resume()
  }

  return <>
    <div className="page-intro"><div><h2>One quick scan, and they’re in.</h2><p>Point the library webcam at a student’s QR pass to check them in.</p></div></div>
    <div className="scanner-layout">
      <section className="content-card scanner-panel">
        <div className="scanner-title"><h3>Student QR scanner</h3><span className="status-pill"><i className="online-indicator" style={{ width: 6, height: 6 }} /> {active ? 'CAMERA READY' : 'CAMERA OFF'}</span></div>
        <div className="camera-stage">
          {active ? <div className="camera-stream"><div id="qr-reader" /></div> : <div className="camera-placeholder"><div className="camera-icon"><Camera size={25} /></div><strong>Ready when you are</strong><p>Use your laptop’s built-in camera to read student QR passes.</p><button className="button" onClick={start}><ScanLine size={15} /> Start camera</button></div>}
        </div>
        <div className="scanner-tip">✳ &nbsp;Hold the QR pass steady, about 15–25 cm from the camera.</div>
        {active && <div style={{ padding: '0 19px 15px' }}><button className="button button-secondary button-small" onClick={stop}>Stop camera</button></div>}
      </section>
      <section className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        {!student ? <div className="scan-idle"><div className="scan-idle-icon"><ScanLine size={20} /></div><strong style={{ display: 'block', color: '#53615a', marginBottom: 5 }}>Waiting for a student</strong>Once scanned, their details will<br />appear here for a quick check-in.</div> : <div className="scan-result">
          <div className="scan-result-top"><div className="scan-check"><Check size={18} /></div><div><strong>Student found</strong><small>Confirm their purpose to continue</small></div></div>
          <div className="student-result"><div className="result-row"><span>Name</span><strong>{student.full_name}</strong></div><div className="result-row"><span>Student ID</span><strong>{student.student_id}</strong></div><div className="result-row"><span>Program</span><strong>{student.program}</strong></div><div className="result-row"><span>Year level</span><strong>{student.year_level}</strong></div></div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#59655f' }}>Purpose</div>
          <div className="purpose-options"><button className={`purpose-option ${purpose === 'Study' ? 'selected' : ''}`} onClick={() => setPurpose('Study')}><span>📖</span>Study</button><button className={`purpose-option ${purpose === 'Borrow Book' ? 'selected' : ''}`} onClick={() => setPurpose('Borrow Book')}><span>📚</span>Borrow book</button></div>
          {!recorded ? <button className="button button-full" disabled={!purpose || busy} onClick={record}>{busy ? 'Recording…' : 'Record visit'}</button> : <button className="button button-full" onClick={nextStudent}>Scan next student</button>}
        </div>}
        {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ margin: '0 14px 14px', display: 'flex', gap: 7, alignItems: 'center' }}>{messageType === 'success' ? <Check size={14} /> : <CircleAlert size={14} />}{message}</div>}
      </section>
    </div>
  </>
}
