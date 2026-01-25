import Link from 'next/link'

import { HighchartsMapDemo } from '@/components/highcharts/highcharts-map-demo'
import { Button } from '@/components/ui/button'

export default function HighchartsMapPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Highcharts Map Playground
          </h1>
          <p className="text-muted-foreground text-sm">
            A minimal Next.js client-only example using Highcharts Maps.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>

      <HighchartsMapDemo />
    </main>
  )
}
