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
      // Small timeout to allow state to render "GENERATING..."
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const dataUrl = await toPng(node, { 
        width: 1080, 
        height: 1350,
        backgroundColor: '#ffffff',
        style: {
          left: '0',
          top: '0',
          position: 'static',
          visibility: 'visible'
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
      </div>

      {/* Hidden Preview / Export Canvas - Absolute safety for hiding */}
      <div 
        id="reddit-card-canvas" 
        className={styles.redditCardCanvas}
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '-9999px', 
          visibility: 'hidden', 
          pointerEvents: 'none',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div style={{ background: '#000080', color: 'white', padding: '30px', textAlign: 'center', fontSize: '38px', fontWeight: 'bold', borderBottom: '4px solid black' }}>
          MBA DECISION CARD • mba-engine.app
        </div>
        
        <div style={{ background: '#f0f0f0', padding: '30px', borderBottom: '2px solid black', fontSize: '28px' }}>
          <div style={{ marginBottom: '10px' }}>Target industry: <strong>{targetIndustry || 'Not specified'}</strong></div>
          <div>Home region: <strong>{homeRegion === 'CUSTOM' ? customRegion : (homeRegion || 'Not specified')}</strong></div>
        </div>

        <div style={{ flex: 1, padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '22px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ border: '2px solid black', padding: '15px', textAlign: 'left', width: '220px' }}>SCHOOL</th>
                {cardSchools.map(s => (
                  <th key={s.instanceId} style={{ border: '2px solid black', padding: '15px', textAlign: 'center' }}>
                    <div style={{ wordWrap: 'break-word', whiteSpace: 'normal', fontSize: '18px', maxHeight: '80px', overflow: 'hidden' }}>{s.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '2px solid black', padding: '15px', fontWeight: 'bold' }}>SCORE</td>
                {cardSchools.map(s => (
                  <td key={s.instanceId} style={{ border: '2px solid black', padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '42px', color: '#000080' }}>
                    {calculateCompositeScore(s, schools, weights)}
                  </td>
                ))}
              </tr>
              {[
                { label: 'PRESTIGE', field: 'prestigeTier' },
                { label: 'CULTURE', field: 'cultureScore' },
                { label: 'CAREER FIT', field: 'careerFit' },
                { label: 'PROXIMITY', field: 'proximity' }
              ].map(item => (
                <tr key={item.field}>
                  <td style={{ border: '2px solid black', padding: '15px', fontWeight: 'bold', fontSize: '16px' }}>{item.label}</td>
                  {cardSchools.map(s => (
                    <td key={s.instanceId} style={{ border: '2px solid black', padding: '15px', textAlign: 'center', fontSize: '26px' }}>
                      {'★'.repeat(s[item.field])}{'☆'.repeat(5-s[item.field])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ border: '2px solid black', padding: '15px', fontWeight: 'bold', fontSize: '16px' }}>NET COST</td>
                {cardSchools.map(s => (
                  <td key={s.instanceId} style={{ border: '2px solid black', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    ${((s.estTotal - s.scholarship)/1000).toFixed(0)}K
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '20px', fontSize: '18px', fontStyle: 'italic', borderTop: '2px dashed black', color: '#444' }}>
            Weights: {Object.entries(weights).map(([k,v]) => `${k.toUpperCase()} ${(v*100).toFixed(0)}%`).join(' | ')}
          </div>
          
          <div style={{ padding: '20px', background: '#000080', color: 'white', textAlign: 'right', fontSize: '16px' }}>
            Generated via MBA Decision Engine • Ver 2.0
          </div>
        </div>
      </div>
    </div>
  )
}
