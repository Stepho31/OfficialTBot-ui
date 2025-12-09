import { LessonCard } from "@/components/education/LessonCard"

export default function EducationPage() {
  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <h1 className="text-3xl font-bold mb-8" style={{ 
        background: 'linear-gradient(135deg, #5b8cff 0%, #8b5cf6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Education Center
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Forex Basics Section */}
        <section>
          <h2 className="section-title" style={{ margin: '24px 0 12px', fontSize: '18px' }}>Forex Basics</h2>
          <div className="grid gap-6" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <LessonCard
              title="What is a Pip?"
              description="A simple explanation of pip movements and how they affect trade sizing."
              youtubeId="dQw4w9WgXcQ"
            />
            <LessonCard
              title="Lot Sizes Explained"
              description="Understanding micro, mini, and standard lots."
              youtubeId="dQw4w9WgXcQ"
            />
          </div>
        </section>

        {/* Risk & Psychology Section */}
        <section>
          <h2 className="section-title" style={{ margin: '24px 0 12px', fontSize: '18px' }}>Risk & Psychology</h2>
          <div className="grid gap-6" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <LessonCard
              title="Risk Management 101"
              description="Why risk percentage per trade matters."
              youtubeId="dQw4w9WgXcQ"
            />
            <LessonCard
              title="Trading Psychology"
              description="Emotions that impact trading decisions."
              youtubeId="dQw4w9WgXcQ"
            />
          </div>
        </section>

        {/* Signals & Automation Section */}
        <section>
          <h2 className="section-title" style={{ margin: '24px 0 12px', fontSize: '18px' }}>Signals & Automation</h2>
          <div className="grid gap-6" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <LessonCard
              title="How to Read Signals"
              description="A guide to understanding AutoPip AI signal output."
              youtubeId="dQw4w9WgXcQ"
            />
            <LessonCard
              title="Automated Trading Overview"
              description="How automated systems work behind the scenes."
              youtubeId="dQw4w9WgXcQ"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

