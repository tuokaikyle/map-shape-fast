'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

import worldMap from '@highcharts/map-collection/custom/world.geo.json'

import { Button } from '@/components/ui/button'
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

type MapDatum = [hcKey: string, value: number]

function buildRandomMapData(): MapDatum[] {
  const features = (worldMap as any)?.features ?? []
  const data = features
    .map((f: any) => String(f?.properties?.['hc-key'] ?? ''))
    .filter(Boolean)
    .map((hcKey: string) => [hcKey, 20])
  return data
}

export function HighchartsMapDemo() {
  const [Highcharts, setHighcharts] = useState<any>(null)
  const [data, setData] = useState<MapDatum[]>(() => buildRandomMapData())
  const [selected, setSelected] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctKeys, setCorrectKeys] = useState<string[]>([])

  const nameToKey = useMemo(() => {
    const features = (worldMap as any)?.features ?? []
    const mapping = new Map<string, string>()

    for (const feature of features) {
      const name = String(feature?.properties?.name ?? '')
      const hcKey = String(feature?.properties?.['hc-key'] ?? '')
      if (name && hcKey && !mapping.has(name)) {
        mapping.set(name, hcKey)
      }
    }

    return mapping
  }, [])

  const countryNames = useMemo(() => {
    const features = (worldMap as any)?.features ?? []
    return features
      .map((f: any) => String(f?.properties?.name ?? ''))
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b))
  }, [])

  const correctKeySet = useMemo(() => new Set(correctKeys), [correctKeys])

  const seriesData = useMemo(() => {
    if (correctKeys.length === 0) return data
    return data.map(([hcKey, value]) => {
      if (!correctKeySet.has(hcKey)) return [hcKey, value] as MapDatum
      return {
        'hc-key': hcKey,
        value,
        color: '#22c55e',
      }
    })
  }, [correctKeySet, correctKeys.length, data])

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
    if (!picked || !selected) return
    if (picked !== selected) return
    const key = nameToKey.get(selected)
    if (!key) return
    setCorrectKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
  }, [nameToKey, picked, selected])

  const options = useMemo(() => {
    return {
      chart: {
        map: worldMap,
        height: 520,
        spacing: [16, 16, 16, 16],
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
      colorAxis: {
        min: 0,
        max: 100,
        stops: [
          [0, '#eff6ff'],
          [0.5, '#60a5fa'],
          [1, '#1d4ed8'],
        ],
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b><br/>Value: {point.value}',
      },
      series: [
        {
          type: 'map',
          name: 'Value',
          data: seriesData,
          joinBy: 'hc-key',
          borderColor: 'rgba(0,0,0,0.15)',
          borderWidth: 0.5,
          nullColor: 'rgba(0,0,0,0.04)',
          dataLabels: { enabled: false },
          point: {
            events: {
              click: function (this: any) {
                const name = String(this?.name ?? '')
                setSelected(name)
              },
            },
          },
        },
      ],
      credits: { enabled: false },
    }
  }, [seriesData])

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Highcharts Maps: World</CardTitle>
          <CardDescription>
            Pan/zoom with the built-in controls, then click a country to select
            it. Use “Randomize” to regenerate data.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(null)
              setPicked(null)
              setCorrectKeys([])
            }}
          >
            Clear selection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            {!Highcharts ? (
              <div className="text-muted-foreground flex h-[520px] items-center justify-center rounded-lg border">
                Loading Highcharts…
              </div>
            ) : (
              <HighchartsReact
                highcharts={Highcharts}
                constructorType="mapChart"
                options={options}
              />
            )}
          </div>
          <div className="lg:w-64">
            <div className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
              Countries
            </div>
            <div className="h-[520px] overflow-auto rounded-lg border p-2">
              <ul className="space-y-1 text-sm">
                {countryNames.map((name: string) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="hover:bg-muted w-full rounded px-2 py-1 text-left"
                      onClick={() => setPicked(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        <div className="flex flex-col gap-1">
          {selected ? (
            <span>
              Selected:{' '}
              <span className="text-foreground font-medium">{selected}</span>
            </span>
          ) : (
            <span>Tip: click a country to select it.</span>
          )}
          {picked ? (
            <span>
              Picked:{' '}
              <span className="text-foreground font-medium">{picked}</span>
            </span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  )
}
