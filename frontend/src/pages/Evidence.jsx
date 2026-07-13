import React, { useState, useEffect, useRef } from 'react'
import EvidenceCard from '../components/EvidenceCard'
import SeverityBadge from '../components/SeverityBadge'
import { api } from '../api/api'

export default function Evidence() {
  const [samples, setSamples] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.evidence.samples().then(res => setSamples(res.samples || []))
  }, [])

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const result = await api.evidence.analyze(file)
      setAnalysis(result)
    } catch (e) {
      console.error(e)
    }
    setAnalyzing(false)
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">📷 CV Evidence Analyzer</div>
        <div className="page-subtitle">
          YOLOV8X · VEHICLE DETECTION · VIOLATION CLASSIFICATION · LICENSE PLATE OCR
        </div>
      </div>

      <div className="page-body">
        {/* Architecture info */}
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-title">Computer Vision Pipeline</div>
          <div className="chart-subtitle">PS3 FEATURES INTEGRATED INTO PS1 SUBMISSION</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {['Image Preprocessing','YOLOv8x Detection','Vehicle Classification','Violation ID','License Plate OCR','Confidence Scoring','Evidence Storage'].map((step, i) => (
              <div key={step} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-bright)', borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)' }}>
                  <span style={{ color:'var(--amber)', marginRight:6 }}>{i+1}.</span>{step}
                </div>
                {i < 6 && <span style={{ color:'var(--text-muted)', fontSize:16 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', lineHeight:1.8 }}>
            <span style={{ color:'var(--teal)' }}>Model:</span> YOLOv8x pre-trained on COCO, fine-tuned on BTP traffic dataset &nbsp;|&nbsp;
            <span style={{ color:'var(--teal)' }}>Classes:</span> car, motorcycle, scooter, auto-rickshaw, bus, truck &nbsp;|&nbsp;
            <span style={{ color:'var(--teal)' }}>Violations:</span> wrong parking, no parking, footpath parking, road crossing, main road &nbsp;|&nbsp;
            <span style={{ color:'var(--teal)' }}>OCR:</span> EasyOCR on detected plate regions
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          {/* Upload zone */}
          <div>
            <div className="chart-title" style={{ marginBottom:4 }}>Upload Traffic Image</div>
            <div className="chart-subtitle" style={{ marginBottom:12 }}>SUPPORTS JPG, PNG, WEBP — MAX 10MB</div>
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            >
              <div style={{ fontSize:40, marginBottom:12 }}>📷</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>
                Drop traffic image here
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
                or click to browse
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Analysis result */}
          <div>
            <div className="chart-title" style={{ marginBottom:4 }}>Detection Result</div>
            <div className="chart-subtitle" style={{ marginBottom:12 }}>YOLOV8X OUTPUT</div>
            <div className="chart-card" style={{ minHeight:180 }}>
              {analyzing ? (
                <div className="loading-state" style={{ height:160 }}>
                  <div className="spinner" /> Running YOLOv8 inference…
                </div>
              ) : analysis ? (
                <div>
                  <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                    <div className="stat-pill">🚗 {analysis.total_vehicles_detected} vehicles</div>
                    <div className="stat-pill">⚠️ {analysis.total_violations_detected} violations</div>
                    <div className="stat-pill" style={{ fontSize:10, color:'var(--text-muted)' }}>{analysis.model?.split(' ')[0]}</div>
                  </div>
                  {analysis.detections?.map((d, i) => (
                    <div key={d.id} style={{ padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:12, color:'var(--text-primary)' }}>
                          {d.vehicle_class.toUpperCase()}
                        </span>
                        <SeverityBadge tier={d.severity || 'MEDIUM'} />
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <span className="stat-pill">⚠️ {d.violation}</span>
                        {d.violation_confidence != null ? (
                          <span className="stat-pill">🎯 {Math.round(d.violation_confidence * 100)}%</span>
                        ) : (
                          <span className="stat-pill" title="Violation type from this hotspot's historical data, not a visual confidence score">📍 Location-based</span>
                        )}
                        <span className="stat-pill">🪪 {d.license_plate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:160, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:12 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                  Upload an image to run CV analysis
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sample evidence */}
        <div className="chart-card">
          <div className="chart-title">Pre-processed Evidence Records</div>
          <div className="chart-subtitle">SAMPLE VIOLATIONS FROM BENGALURU TRAFFIC DATASET</div>
          <div style={{ marginTop:14 }}>
            {samples.map(s => <EvidenceCard key={s.evidence_id} sample={s} />)}
          </div>
        </div>
      </div>
    </>
  )
}
