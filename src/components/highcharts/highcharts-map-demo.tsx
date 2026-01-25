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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const HighchartsReact = dynamic(() => import('highcharts-react-official'), {
  ssr: false,
})

type MapDatum = [hcKey: string, value: number]
type MapFeature = {
  name: string
  hcKey: string
  continent: string
}

function buildMapData(): MapDatum[] {
  const features = (worldMap as any)?.features ?? []
  const data = features
    .map((f: any) => String(f?.properties?.['hc-key'] ?? ''))
    .filter(Boolean)
    .map((hcKey: string) => [hcKey, 20])
  return data
}

export function HighchartsMapDemo() {
  const [Highcharts, setHighcharts] = useState<any>(null)
  const [data, setData] = useState<MapDatum[]>(() => buildMapData())
  const [selected, setSelected] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctKeys, setCorrectKeys] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('All regions')

  const mapFeatures = useMemo<MapFeature[]>(() => {
    const features = (worldMap as any)?.features ?? []
    return features
      .map((feature: any) => {
        const name = String(feature?.properties?.name ?? '')
        const hcKey = String(feature?.properties?.['hc-key'] ?? '')
        const continent = String(feature?.properties?.continent ?? '')
        return { name, hcKey, continent }
      })
      .filter((feature: MapFeature) => feature.name && feature.hcKey)
  }, [])

  const regionOptions = useMemo(() => {
    const regions = new Set<string>()
    for (const feature of mapFeatures) {
      if (feature.continent) regions.add(feature.continent)
    }
    return Array.from(regions).sort((a, b) => a.localeCompare(b))
  }, [mapFeatures])

  const nameToKey = useMemo(() => {
    const mapping = new Map<string, string>()
    for (const feature of mapFeatures) {
      if (!mapping.has(feature.name)) {
        mapping.set(feature.name, feature.hcKey)
      }
    }

    return mapping
  }, [mapFeatures])

  const filteredFeatures = useMemo(() => {
    if (selectedRegion === 'All regions') return mapFeatures
    return mapFeatures.filter((feature) => feature.continent === selectedRegion)
  }, [mapFeatures, selectedRegion])

  const correctKeySet = useMemo(() => new Set(correctKeys), [correctKeys])

  const countryNames = useMemo(() => {
    return filteredFeatures
      .filter((feature) => !correctKeySet.has(feature.hcKey))
      .map((feature) => feature.name)
      .sort((a: string, b: string) => a.localeCompare(b))
  }, [correctKeySet, filteredFeatures])

  const regionKeySet = useMemo(() => {
    if (selectedRegion === 'All regions') return null
    return new Set(filteredFeatures.map((feature) => feature.hcKey))
  }, [filteredFeatures, selectedRegion])

  const filteredData = useMemo(() => {
    if (!regionKeySet) return data
    return data.filter(([hcKey]) => regionKeySet.has(hcKey))
  }, [data, regionKeySet])

  const seriesData = useMemo(() => {
    if (correctKeys.length === 0) return filteredData
    return filteredData.map(([hcKey, value]) => {
      if (!correctKeySet.has(hcKey)) return [hcKey, value] as MapDatum
      return {
        'hc-key': hcKey,
        value,
        color: '#22c55e',
      }
    })
  }, [correctKeySet, correctKeys.length, filteredData])

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
      tooltip: {
        enabled: false,
        pointFormat: '<h3>{point.name}</h3>',
      },
      series: [
        {
          type: 'map',
          name: 'Name',
          data: seriesData,
          joinBy: 'hc-key',
          allAreas: selectedRegion === 'All regions',
          borderColor: 'rgba(0, 0, 0, 0.15)',
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
  }, [selectedRegion, seriesData])

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Highcharts Maps: World</CardTitle>
          <CardDescription>
            Pan/zoom with the built-in controls, then click a country name to
            select it. Then pick the correct country from the map on the left.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                Region: {selectedRegion}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={selectedRegion}
                onValueChange={setSelectedRegion}
              >
                <DropdownMenuRadioItem value="All regions">
                  All regions
                </DropdownMenuRadioItem>
                {regionOptions.map((region) => (
                  <DropdownMenuRadioItem key={region} value={region}>
                    {region}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
      {/* <CardFooter className="text-muted-foreground text-sm">
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
      </CardFooter> */}
    </Card>
  )
}
