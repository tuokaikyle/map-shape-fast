'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
    .map((hcKey: string) => [hcKey, Math.round(Math.random() * 100)])
  console.log(features.map((f: any) => f.properties)[50])
  return data
}

export function HighchartsMapDemo() {
  const [Highcharts, setHighcharts] = useState<any>(null)
  const [data, setData] = useState<MapDatum[]>(() => buildRandomMapData())
  const [selected, setSelected] = useState<string | null>(null)

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

  const randomize = useCallback(() => {
    setSelected(null)
    setData(buildRandomMapData())
  }, [])

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
      legend: {
        title: { text: 'Random value (0–100)' },
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b><br/>Value: {point.value}',
      },
      series: [
        {
          type: 'map',
          name: 'Value',
          data,
          joinBy: 'hc-key',
          states: { hover: { color: '#f59e0b' } },
          borderColor: 'rgba(0,0,0,0.15)',
          borderWidth: 0.5,
          nullColor: 'rgba(0,0,0,0.04)',
          dataLabels: { enabled: false },
          point: {
            events: {
              click: function (this: any) {
                setSelected(String(this?.name ?? ''))
              },
            },
          },
        },
      ],
      credits: { enabled: false },
    }
  }, [data])

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
          <Button type="button" onClick={randomize}>
            Randomize
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelected(null)}
          >
            Clear selection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        {selected ? (
          <span>
            Selected:{' '}
            <span className="text-foreground font-medium">{selected}</span>
          </span>
        ) : (
          <span>Tip: click a country to select it.</span>
        )}
      </CardFooter>
    </Card>
  )
}
