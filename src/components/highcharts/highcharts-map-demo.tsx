'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

import worldMap from '@highcharts/map-collection/custom/world.geo.json'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const HighchartsReact = dynamic(() => import('highcharts-react-official'), {
  ssr: false,
})

type RegionId =
  | 'world'
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north-america'
  | 'south-america'
  | 'oceania'

const REGIONS: Array<{ id: RegionId; label: string }> = [
  { id: 'world', label: 'World' },
  { id: 'africa', label: 'Africa' },
  { id: 'asia', label: 'Asia' },
  { id: 'europe', label: 'Europe' },
  { id: 'north-america', label: 'North America' },
  { id: 'south-america', label: 'South America' },
  { id: 'oceania', label: 'Oceania' },
]

async function loadRegionGeoJson(region: Exclude<RegionId, 'world'>) {
  switch (region) {
    case 'africa': {
      const m =
        await import('@highcharts/map-collection/custom/africa.geo.json')
      return (m as any).default ?? m
    }
    case 'asia': {
      const m = await import('@highcharts/map-collection/custom/asia.geo.json')
      return (m as any).default ?? m
    }
    case 'europe': {
      const m =
        await import('@highcharts/map-collection/custom/europe.geo.json')
      return (m as any).default ?? m
    }
    case 'north-america': {
      const m =
        await import('@highcharts/map-collection/custom/north-america.geo.json')
      return (m as any).default ?? m
    }
    case 'south-america': {
      const m =
        await import('@highcharts/map-collection/custom/south-america.geo.json')
      return (m as any).default ?? m
    }
    case 'oceania': {
      const m =
        await import('@highcharts/map-collection/custom/oceania.geo.json')
      return (m as any).default ?? m
    }
  }
}

export function HighchartsMapDemo() {
  const [Highcharts, setHighcharts] = useState<any>(null)
  const [region, setRegion] = useState<RegionId>('world')
  const [mapGeoJSON, setMapGeoJSON] = useState<any>(worldMap as any)
  const [isSwitching, setIsSwitching] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    import('highcharts/highmaps')
      .then((m) => {
        if (cancelled) return
        setHighcharts(m.default ?? m)
      })
      .catch(() => {
        // leave Highcharts as null; the UI will show a fallback message
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (region === 'world') {
        setMapGeoJSON(worldMap as any)
        return
      }

      setIsSwitching(true)
      try {
        const geo = await loadRegionGeoJson(region)
        if (cancelled) return
        setMapGeoJSON(geo)
      } finally {
        if (!cancelled) setIsSwitching(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [region])

  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? 'World'

  // Extract country names from GeoJSON
  const countryNames = useMemo(() => {
    if (!mapGeoJSON?.features) return []

    const names = mapGeoJSON.features
      .map((feature: any) => feature.properties?.name)
      .filter((name: string) => name)
      .sort((a: string, b: string) => a.localeCompare(b))

    return names
  }, [mapGeoJSON])

  const options = useMemo(() => {
    return {
      chart: {
        map: mapGeoJSON,
        height: 520,
        spacing: [16, 16, 16, 16],
        animation: { duration: 450 },
      },
      title: {
        text: undefined,
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom',
        },
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b>',
      },
      series: [
        {
          type: 'map',
          name: 'Areas',
          data: [],
          allAreas: true,
          enableMouseTracking: true,
          states: { hover: { color: 'rgba(245,158,11,0.55)' } },
          borderColor: 'rgba(0,0,0,0.15)',
          borderWidth: 0.5,
          nullColor: 'rgba(0,0,0,0.03)',
          dataLabels: { enabled: false },
        },
      ],
      credits: { enabled: false },
    }
  }, [mapGeoJSON])

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Highcharts Maps: {regionLabel}</CardTitle>
          <CardDescription>
            Choose a region/continent to display. The map will transition to the
            selected region.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Region</label>
          <select
            className="border-input focus-visible:ring-ring h-9 rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionId)}
            disabled={!Highcharts || isSwitching}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Map section */}
          <div className="relative flex-1">
            {!Highcharts ? (
              <div className="text-muted-foreground flex h-[520px] items-center justify-center rounded-lg border">
                Loading Highcharts…
              </div>
            ) : (
              <HighchartsReact
                key={region}
                highcharts={Highcharts}
                constructorType="mapChart"
                options={options}
              />
            )}
            {isSwitching ? (
              <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm">
                <div className="text-muted-foreground text-sm">
                  Loading {regionLabel}…
                </div>
              </div>
            ) : null}
          </div>

          {/* Country list sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Countries ({countryNames.length})
              </h3>
              <div className="max-h-[520px] space-y-1 overflow-y-auto">
                {countryNames.map((name: string) => (
                  <button
                    key={name}
                    onClick={() => setSelectedCountry(name)}
                    className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      selectedCountry === name ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        {selectedCountry && (
          <div className="bg-muted mb-2 w-full rounded-md border p-3">
            <span className="text-sm font-medium">Selected Country: </span>
            <span className="text-sm">{selectedCountry}</span>
          </div>
        )}
        <span className="text-muted-foreground text-sm">
          Tip: use the map navigation buttons to zoom/pan.
        </span>
      </CardFooter>
    </Card>
  )
}
