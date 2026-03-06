'use client'

import { useState, useEffect } from 'react'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import schoolsData from '@/data/schools.json'
import { calculateCompositeScore, DEFAULT_WEIGHTS } from '@/lib/scoring'
import HowItWorks from './HowItWorks'
import RedditShareModal from './RedditShareModal'

// Sortable Header Component
function SortableHeader({ id, school, weights, allSchools, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`${styles.headerCell} ${school.isRuledOut ? styles.ruledOut : ''}`}
    >
      <div className={styles.schoolName}>
        {school.name}
        <button 
          className={styles.removeBtn} 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onRemove(school.instanceId)}
        >x</button>
      </div>
      <div className={styles.score}>
        {school.isRuledOut ? '[ RULED OUT ]' : `${calculateCompositeScore(school, allSchools, weights)} / 100`}
      </div>
    </div>
  )
}

export default function DecisionEngine() {
  const [selectedSchools, setSelectedSchools] = useState([])
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [isWeightsOpen, setIsWeightsOpen] = useState(false)
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)
  const [isRedditModalOpen, setIsRedditModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const savedData = localStorage.getItem('mba_decision_data')
    if (savedData) {
      const { schools, weights: savedWeights } = JSON.parse(savedData)
      setSelectedSchools(schools)
      setWeights(savedWeights)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mba_decision_data', JSON.stringify({
        schools: selectedSchools,
        weights
      }))
    }
  }, [selectedSchools, weights, isLoaded])

  const addSchool = (schoolId) => {
    if (selectedSchools.length >= 10) return
    const schoolBase = schoolsData.find(s => s.id === parseInt(schoolId))
    if (!schoolBase) return
    
    const newSchool = {
      ...schoolBase,
      instanceId: `id-${Date.now()}`,
      prestigeTier: 3,
      brandPerception: 3,
      cultureScore: 3,
      gutFeel: 3,
      careerFit: 3,
      employerPresence: 'No',
      scholarship: 0,
      proximity: 3,
      notes: '',
      isRuledOut: false
    }
    setSelectedSchools([...selectedSchools, newSchool])
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setSelectedSchools((items) => {
        const oldIndex = items.findIndex(i => i.instanceId === active.id)
        const newIndex = items.findIndex(i => i.instanceId === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const updateSchoolField = (instanceId, field, value) => {
    setSelectedSchools(selectedSchools.map(s => 
      s.instanceId === instanceId ? { ...s, [field]: value } : s
    ))
  }

  const removeSchool = (instanceId) => {
    if (confirm('REMOVING SCHOOL FROM COMPARISON?')) {
      setSelectedSchools(selectedSchools.filter(s => s.instanceId !== instanceId))
    }
  }

  const renderStars = (instanceId, field, current) => (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map(star => (
        <span 
          key={star} 
          className={star <= current ? styles.starFilled : styles.starEmpty}
          onClick={() => updateSchoolField(instanceId, field, star)}
        >
          {star <= current ? '★' : '☆'}
        </span>
      ))}
    </div>
  )

  if (!isLoaded) return <div className={styles.loading}>INITIALIZING...</div>

  return (
    <div className={styles.container}>
      <header className={styles.appHeader}>
        <h1>MBA DECISION ENGINE v2.0</h1>
        <div className={styles.headerLinks}>
          <button onClick={() => setIsHowItWorksOpen(true)}>[?] HOW THIS WORKS</button>
          <button onClick={() => confirm('RESET ALL?') && setSelectedSchools([])}>RESET ALL</button>
        </div>
      </header>

      <HowItWorks isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <RedditShareModal 
        isOpen={isRedditModalOpen} 
        onClose={() => setIsRedditModalOpen(false)} 
        schools={selectedSchools}
        weights={weights}
      />

      <div className={styles.toolbar}>
        <div className={styles.addSchool}>
          <select onChange={(e) => addSchool(e.target.value)} value="">
            <option value="" disabled>+ ADD SCHOOL (TOP 50)</option>
            {schoolsData.map(s => (
              <option key={s.id} value={s.id} disabled={selectedSchools.some(ss => ss.id === s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <button onClick={() => setIsWeightsOpen(!isWeightsOpen)}>[{isWeightsOpen ? 'CLOSE' : 'WEIGHTS'}]</button>
          <button onClick={() => window.print()}>[EXPORT HTML]</button>
          <button 
            disabled={selectedSchools.filter(s => !s.isRuledOut).length < 2}
            onClick={() => setIsRedditModalOpen(true)}
          >
            [SHARE TO REDDIT]
          </button>
        </div>
      </div>

      {isWeightsOpen && (
        <div className={styles.weightPanel}>
          <div className={styles.weightHeader}>
             <h3>SCORING WEIGHTS</h3>
             <button onClick={() => setWeights(DEFAULT_WEIGHTS)}>RESET DEFAULTS</button>
          </div>
          <div className={styles.weightGrid}>
             {Object.keys(weights).map(cat => (
               <div key={cat} className={styles.weightItem}>
                 <label>{cat.toUpperCase()}: {(weights[cat] * 100).toFixed(0)}%</label>
                 <input 
                  type="range" min="0" max="100" 
                  value={weights[cat] * 100} 
                  onChange={(e) => {
                    const newVal = parseInt(e.target.value) / 100
                    const remaining = 1 - newVal
                    const othersSum = Object.keys(weights).filter(k => k !== cat).reduce((a, b) => a + weights[b], 0)
                    const newWeights = { ...weights, [cat]: newVal }
                    if (othersSum > 0) {
                      Object.keys(weights).forEach(k => {
                        if (k !== cat) newWeights[k] = (weights[k] / othersSum) * remaining
                      })
                    }
                    setWeights(newWeights)
                  }}
                 />
               </div>
             ))}
          </div>
        </div>
      )}

      <div className={styles.comparisonGrid}>
        {selectedSchools.length === 0 ? (
          <div className={styles.emptyState}>[ SELECT SCHOOLS TO BEGIN ]</div>
        ) : (
          <div className={styles.scrollArea}>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className={styles.stickyHeader}>
                <div className={styles.labelCell}>SCHOOL (DRAG TO REORDER)</div>
                <SortableContext 
                  items={selectedSchools.map(s => s.instanceId)}
                  strategy={horizontalListSortingStrategy}
                >
                  {selectedSchools.map((school) => (
                    <SortableHeader 
                      key={school.instanceId} 
                      id={school.instanceId} 
                      school={school} 
                      weights={weights} 
                      allSchools={selectedSchools}
                      onRemove={removeSchool}
                    />
                  ))}
                </SortableContext>
              </div>
            </DndContext>

            {/* Data Rows */}
            <section className={styles.categorySection}>
              <div className={styles.categoryTitle}>PRESTIGE & BRAND</div>
              <div className={styles.row}>
                <div className={styles.labelCell}>PRESTIGE TIER</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'prestigeTier', school.prestigeTier)}
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                <div className={styles.labelCell}>BRAND PERCEPTION</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'brandPerception', school.brandPerception)}
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.categorySection}>
              <div className={styles.categoryTitle}>PROGRAM FEEL & CULTURE</div>
              <div className={styles.row}>
                <div className={styles.labelCell}>CULTURE SCORE</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'cultureScore', school.cultureScore)}
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                <div className={styles.labelCell}>GUT FEEL</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'gutFeel', school.gutFeel)}
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.categorySection}>
              <div className={styles.categoryTitle}>CAREER FIT</div>
              <div className={styles.row}>
                <div className={styles.labelCell}>RECRUITING STRENGTH</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'careerFit', school.careerFit)}
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                 <div className={styles.labelCell}>KEY EMPLOYER PRESENCE</div>
                 {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    <select 
                      value={school.employerPresence}
                      onChange={(e) => updateSchoolField(school.instanceId, 'employerPresence', e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="Partial">Partial</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                 ))}
              </div>
            </section>

            <section className={styles.categorySection}>
              <div className={styles.categoryTitle}>FINANCIAL</div>
              <div className={styles.row}>
                <div className={styles.labelCell}>EST. 2-YR TOTAL</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    <input 
                      className={styles.numInput} type="number"
                      value={school.estTotal}
                      onChange={(e) => updateSchoolField(school.instanceId, 'estTotal', parseInt(e.target.value))}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                <div className={styles.labelCell}>SCHOLARSHIP</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    <input 
                      className={styles.numInput} type="number"
                      value={school.scholarship}
                      onChange={(e) => updateSchoolField(school.instanceId, 'scholarship', parseInt(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.categorySection}>
              <div className={styles.categoryTitle}>LOCATION & LIFE</div>
              <div className={styles.row}>
                <div className={styles.labelCell}>CITY</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {school.location}
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                <div className={styles.labelCell}>PROXIMITY (1-5)</div>
                {selectedSchools.map(school => (
                  <div key={school.instanceId} className={styles.cell}>
                    {renderStars(school.instanceId, 'proximity', school.proximity)}
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.categorySection}>
                <div className={styles.categoryTitle}>NOTES & STATUS</div>
                <div className={styles.row}>
                    <div className={styles.labelCell}>RULED OUT?</div>
                    {selectedSchools.map(school => (
                      <div key={school.instanceId} className={styles.cell}>
                        <input 
                          type="checkbox" checked={school.isRuledOut}
                          onChange={(e) => updateSchoolField(school.instanceId, 'isRuledOut', e.target.checked)}
                        />
                      </div>
                    ))}
                </div>
                <div className={styles.row}>
                   <div className={styles.labelCell}>NOTES</div>
                   {selectedSchools.map(school => (
                      <div key={school.instanceId} className={styles.cell}>
                        <textarea 
                          className={styles.notesArea} value={school.notes}
                          onChange={(e) => updateSchoolField(school.instanceId, 'notes', e.target.value)}
                        />
                      </div>
                   ))}
                </div>
             </section>
          </div>
        )}
      </div>
    </div>
  )
}

