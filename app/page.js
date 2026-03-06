import dynamic from 'next/dynamic'

const DecisionEngine = dynamic(() => import('@/components/DecisionEngine'), {
  ssr: false,
})

export default function Home() {
  return (
    <div style={{ padding: '20px' }}>
      <DecisionEngine />
    </div>
  )
}
