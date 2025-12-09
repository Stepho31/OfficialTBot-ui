import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface LessonCardProps {
  title: string
  description: string
  youtubeId: string
}

export function LessonCard({ title, description, youtubeId }: LessonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>{title}</CardTitle>
        <CardDescription style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            title={title}
          />
        </div>
      </CardContent>
    </Card>
  )
}

