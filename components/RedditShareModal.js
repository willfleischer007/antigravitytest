'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'
import styles from './DecisionEngine.module.css'
import { calculateCompositeScore } from '@/lib/scoring'

const REGION_OPTIONS = [
  'Northeast US', 'Midwest US', 'Southeast US', 'Southwest US', 
  'West Coast US', 'Mountain West US', 'Hawaii / Alaska',
  'Eastern Canada', 'Western Canada', 'UK & Ireland',
  'Western Europe', 'Southern Europe', 'Eastern Europe',
  'Middle East & North Africa', 'Sub-Saharan Africa',
  'South Asia', 'East Asia', 'Southeast Asia',
  'Central Asia & Caucasus', 'Latin America & Caribbean',
  'Australia & New Zealand', 'Other / Prefer not to say'
]

export default function RedditShareModal({ isOpen, onClose, schools, weights }) {
  const [targetIndustry, setTargetIndustry] = useState('')
  const [homeRegion, setHomeRegion] = useState('')
  const [customRegion, setCustomRegion] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  // Filter schools for the card (max 5, top sorted by score)
  const cardSchools = schools
    .filter(s => !s.isRuledOut)
    .sort((a, b) => calculateCompositeScore(b, schools, weights) - calculateCompositeScore(a, schools, weights))
    .slice(0, 5)

  const handleExport = async () => {
    if (typeof window === 'undefined') return
    setIsExporting(true)
    const node = document.getElementById('reddit-card-canvas')
    
    try {
      const dataUrl = await toPng(node, { 
        width: 1080, 
        height: 1350,
        style: {
          left: '0',
          top: '0',
          position: 'static'
        }
      })
      const link = document.createElement('a')
      link.download = `MBA_Card_${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
      onClose()
    } catch (err) {
      console.error('Export failed', err)
      alert('EXPORT FAILED. TRY AGAIN.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.redditModal} onClick={(e) => e.stopPropagation()}>
        <h3>[SHARE TO REDDIT]</h3>
        
        <div className={styles.fieldGroup}>
          <label>TARGET INDUSTRY:</label>
          <input 
            type="text" 
            placeholder="e.g., Investment Banking, Consulting"
            value={targetIndustry}
            onChange={(e) => setTargetIndustry(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label>HOME REGION:</label>
          <select value={homeRegion} onChange={(e) => setHomeRegion(e.target.value)}>
            <option value="">Select...</option>
            {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            <option value="CUSTOM">Type my own...</option>
          </select>
          {homeRegion === 'CUSTOM' && (
            <input 
              style={{ marginTop: '0.5rem' }}
              type="text" 
              placeholder="Enter region..."
              value={customRegion}
              onChange={(e) => setCustomRegion(e.target.value)}
              maxLength={40}
            />
          )}
        </div>

        <div className={styles.modalActions}>
           <button onClick={onClose}>[CANCEL]</button>
           <button onClick={handleExport} disabled={isExporting}>
             {isExporting ? 'GENERATING...' : '[DOWNLOAD CARD]'}
           </button>
        </div>

        {/* Hidden Preview / Export Canvas Wrapper */}
        <div id="reddit-card-canvas" style={{ color: 'black' }}>
          <div style={{ background: '#000080', color: 'white', padding: '20px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold' }}>
            MBA DECISION CARD • mba-engine.app
          </div>
          
          <div style={{ background: '#f0f0f0', padding: '20px', borderBottom: '2px solid black', fontSize: '24px' }}>
            <div>Target industry: {targetIndustry || 'Not specified'}</div>
            <div>Home region: {homeRegion === 'CUSTOM' ? customRegion : (homeRegion || 'Not specified')}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '24px' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ border: '1px solid black', padding: '15px', textAlign: 'left', width: '200px' }}>SCHOOL</th>
                {cardSchools.map(s => (
                  <th key={s.instanceId} style={{ border: '1px solid black', padding: '15px' }}>{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '15px', fontWeight: 'bold' }}>SCORE</td>
                {cardSchools.map(s => (
                  <td key={s.instanceId} style={{ border: '1px solid black', padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '32px' }}>
                    {calculateCompositeScore(s, schools, weights)}
                  </td>
                ))}
              </tr>
              {['prestigeTier', 'cultureScore', 'careerFit', 'proximity'].map(field => (
                <tr key={field}>
                  <td style={{ border: '1px solid black', padding: '15px' }}>{field.replace(/([A-Z])/g, ' $1').toUpperCase()}</td>
                  {cardSchools.map(s => (
                    <td key={s.instanceId} style={{ border: '1px solid black', padding: '15px', textAlign: 'center' }}>
                      {'★'.repeat(s[field])}{'☆'.repeat(5-s[field])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ border: '1px solid black', padding: '15px' }}>NET COST</td>
                {cardSchools.map(s => (
                  <td key={s.instanceId} style={{ border: '1px solid black', padding: '15px', textAlign: 'center' }}>
                    ${((s.estTotal - s.scholarship)/1000).toFixed(0)}K
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '40px', fontSize: '20px', fontStyle: 'italic', borderTop: '2px dashed black', paddingTop: '20px' }}>
             Weights: {Object.entries(weights).map(([k,v]) => `${k.toUpperCase()} ${(v*100).toFixed(0)}%`).join(' | ')}
          </div>
          
          <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '18px', color: '#666' }}>
            Generated via MBA Decision Engine • bloomberg.com/business-schools
          </div>
        </div>
      </div>
    </div>
  )
}
