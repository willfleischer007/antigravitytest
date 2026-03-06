'use client'

import styles from './HowItWorks.module.css'

export default function HowItWorks({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>[?] HOW THIS WORKS</h2>
          <button onClick={onClose}>[CLOSE]</button>
        </div>
        <div className={styles.content}>
          <section>
            <h3>i. What This App Does</h3>
            <p>
              MBA Decision Engine lets you compare up to 10 MBA programs side-by-side and score them 
              based on what matters most to you. You set the weights. You enter the ratings. 
              The app does the math. No algorithm is telling you what to think — 
              it's a calculator, not a recommendation engine.
            </p>
          </section>

          <section>
            <h3>ii. How Scoring Works</h3>
            <ul>
              <li>Five categories: Prestige, Culture, Career Fit, Financial, and Location.</li>
              <li>Star ratings (1-5) are converted to a 0-20 point scale per field.</li>
              <li>Financial scoring is relative: the school with the lowest net cost scores 20; the highest scores 0.</li>
              <li>Each category's fields are averaged, then multiplied by your weight percentage.</li>
              <li>The sum produces a 0-100 composite score.</li>
            </ul>
          </section>

          <section>
            <h3>iii. How Weights Work</h3>
            <p>
              Users can adjust how much each category contributes to the final score using sliders 
              in the [WEIGHTS] panel. Weights always sum to 100%. Adjusting one slider 
              proportionally nudges the others.
            </p>
          </section>

          <section>
            <h3>iv. School Data & Tuition Sources</h3>
            <p>
              School list: Bloomberg Businessweek Best Business Schools 2025-26 (US).<br/>
              Tuition figures: Sourced from published COA pages in March 2026.<br/>
              Estimated 2-year total: (Annual Tuition x 2) + (Living Allowance x 2).
            </p>
          </section>

          <section>
            <h3>v. What the Score Is NOT</h3>
            <p>
              The score is only as good as the ratings you enter. It reflects your inputs, not objective truth. 
              A higher score does not mean a school is 'better.' It means it scored higher given 
              your specific inputs and weight preferences.
            </p>
          </section>

          <div className={styles.footer}>
             --------------------------------------------------<br/>
             FOUND AN ERROR? [SUBMIT ISSUE ON GITHUB]<br/>
             --------------------------------------------------
          </div>
        </div>
      </div>
    </div>
  )
}
