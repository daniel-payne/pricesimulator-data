import Chart from "chart.js/auto"
import annotationPlugin from "chartjs-plugin-annotation"

import { Chart as Multi } from "react-chartjs-2"

import "chartjs-adapter-date-fns"

Chart.register([annotationPlugin])

import type { HTMLAttributes, PropsWithChildren } from "react"
import cssVar from "@/utilities/cssVar"
import type { PriceOrNothing } from "@/data/indexDB/types/Price"

import type { Range } from "@/display/controllers/RangeChooser"

import { TradeStatus } from "@/data/indexDB/enums/TradeStatus"
import { Trade } from "@/data/indexDB/types/Trade"

type ComponentProps = {
  highs: Array<number | null | undefined> | null | undefined
  lows: Array<number | null | undefined> | null | undefined
  closes: Array<number | null | undefined> | null | undefined

  price: PriceOrNothing

  firstActiveIndex?: number | null | undefined
  firstInterDayIndex?: number | null | undefined

  activeTrades: Array<Trade> | null | undefined
  inactiveTrades: Array<Trade> | null | undefined

  range?: Range | null | undefined

  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function HighLowChart({
  highs,
  lows,
  closes,
  price,
  firstActiveIndex,
  firstInterDayIndex,
  activeTrades,
  inactiveTrades,
  range = "1m",
  name = "HighLowChart",
  ...rest
}: PropsWithChildren<ComponentProps>) {
  if (highs == null || lows == null || price == null) {
    return null
  }

  if ((highs?.length ?? 0) === 0) {
    return null
  }

  const isMarketClosed = price?.isMarketClosed

  //const currentTimestamp = price?.currentTimestamp ?? price?.priorTimestamp
  const currentIndex = price?.currentIndex
  const currentOpen = price?.currentOpen

  const priorIndex = price?.priorIndex
  const priorOpen = price?.priorOpen
  const priorClose = price?.priorClose

  const endDataIndex = currentIndex ?? priorIndex ?? 0

  // Use firstInterDayIndex from the market record (first day where open != close)
  // as the authoritative dataStart — it skips fixed-rate / flat-data eras.
  // MUST be clamped to endDataIndex: for many markets the full-history
  // firstInterDayIndex is beyond the current simulated timer date.
  const firstSpreadIndex = highs.findIndex((h, i) =>
    h != null && lows[i] != null && h !== lows[i]
  )
  const firstNullIndex = highs.findIndex((v) => v != null)

  const clampedFirstActive =
    firstActiveIndex != null && firstActiveIndex >= 0 && firstActiveIndex <= endDataIndex
      ? firstActiveIndex
      : null

  const clampedFirstInterDay =
    firstInterDayIndex != null && firstInterDayIndex >= 0 && firstInterDayIndex <= endDataIndex
      ? firstInterDayIndex
      : null

  let dataStart =
    clampedFirstInterDay != null
      ? clampedFirstInterDay
      : firstSpreadIndex >= 0 && firstSpreadIndex <= endDataIndex
      ? firstSpreadIndex
      : firstNullIndex >= 0
      ? firstNullIndex
      : 0

  if (clampedFirstActive != null && dataStart < clampedFirstActive) {
    dataStart = clampedFirstActive
  }

  // --- Calculate visible window BEFORE slicing so we only create the data we need ---
  // This is critical: category scales spread all data points evenly across the full chart
  // width regardless of x-axis min/max, so we must pre-clip the data to the visible range.
  const nextActiveTrade = activeTrades?.[0]
  const endIndex = nextActiveTrade?.expiryIndex ?? price?.currentIndex ?? 0

  let startIndex = nextActiveTrade?.entryIndex ?? endDataIndex

  if (range === "1m") {
    startIndex = startIndex - 1 * 30
  } else if (range === "3m") {
    startIndex = startIndex - 3 * 30
  } else if (range === "1y") {
    startIndex = startIndex - 1 * 365
  } else if (range === "5y") {
    startIndex = startIndex - 5 * 365
  } else if (range === "at") {
    startIndex = dataStart
  }

  // Never start before the first bar with real spread
  if (startIndex < dataStart) {
    startIndex = dataStart
  }

  // When market is open with no active trade, today would land at the very
  // right edge — add padding so the pricePoint/openLine are visible inside the chart
  const rightPad = !isMarketClosed && nextActiveTrade == null ? 2 : 0
  const sliceEnd = endDataIndex + rightPad

  // Slice only the visible window (padding days will be null/undefined)
  const sliceStart = startIndex
  const displayHighs = (highs?.slice(sliceStart, sliceEnd + 1) ?? []).map((v) => v)
  const displayLows = (lows?.slice(sliceStart, sliceEnd + 1) ?? []).map((v) => v)
  const displayCloses = (closes?.slice(sliceStart, sliceEnd + 1) ?? []).map((v) => v)

  // Mask TODAY and all future padding positions.
  // The full-year CSV is pre-loaded so padding slots contain real future prices — null them all.
  if (!isMarketClosed && currentIndex != null) {
    const todayPos = currentIndex - sliceStart
    if (todayPos >= 0 && todayPos < displayHighs.length) {
      // Today: mask high/low, keep open for the connecting line source
      displayHighs[todayPos] = null
      displayLows[todayPos] = null
      displayCloses[todayPos] = currentOpen ?? null
      // Future padding days: null everything
      for (let i = todayPos + 1; i < displayHighs.length; i++) {
        displayHighs[i] = null
        displayLows[i] = null
        displayCloses[i] = null
      }
    }
  }

  // Labels are global day-indices so trade annotations keep their correct positions
  const labels = displayHighs.map((_, i) => sliceStart + i)

  const datasets = [] as any

  // nextActiveTrade already computed above

  let fillTo = 1

  if (range === "1m" || range === "3m") {
    datasets.push({
      type: "line",
      label: "closes",
      data: displayCloses,
      pointRadius: displayCloses.map((_, i) => {
        const globalIdx = sliceStart + i
        return (globalIdx === currentIndex && !isMarketClosed) ? 0 : 4
      }),
      borderWidth: 0,
      fill: false,
      //borderColor: cssVar("--graph-point"),
      backgroundColor: cssVar("--graph-point"),
      // backgroundColor: function (context: any) {
      //   if (range === "1m" || range === "3m") {
      //     const index = context.dataIndex

      //     if (index > 0) {
      //       const currentValue = context.dataset.data[index]
      //       let lastValue = context.dataset.data[index - 1]

      //       if (lastValue == null) {
      //         lastValue = context.dataset.data[index - 2]
      //         if (lastValue == null) {
      //           lastValue = context.dataset.data[index - 3]
      //           if (lastValue == null) {
      //             lastValue = context.dataset.data[index - 4]
      //             if (lastValue == null) {
      //               lastValue = context.dataset.data[index - 5]
      //             }
      //           }
      //         }
      //       }

      //       if (currentValue > lastValue) {
      //         return cssVar("--outcome-profit-75")
      //       } else if (currentValue < lastValue) {
      //         return cssVar("--outcome-loss-75")
      //       } else {
      //         return cssVar("--outcome-neutral-75")
      //       }
      //     }
      //   }
      // },
      // tension: 0,
      // spanGaps: true,
    })

    fillTo += 1
  }

  datasets.push({
    type: "line",
    label: "high",
    data: displayHighs,
    pointRadius: 0,
    borderWidth: 1,
    fill: fillTo,
    borderColor: cssVar("--graph-range"),
    backgroundColor: cssVar("--graph-range"),
    tension: 0.2,
    spanGaps: true,
  })

  datasets.push({
    type: "line",
    label: "low",
    data: displayLows,
    pointRadius: 0,
    borderWidth: 1,
    fill: false,
    borderColor: cssVar("--graph-range"),
    tension: 0.2,
    spanGaps: true,
  })

  // startIndex / endIndex already computed above before slicing

  let pricePointValue
  let pricePointIndex
  let pricePointColor

  if (isMarketClosed) {
    pricePointValue = priorClose
    pricePointIndex = currentIndex ?? priorIndex
    if ((priorClose ?? 0) > (priorOpen ?? 0)) {
      pricePointColor = cssVar("--outcome-profit-50")
    } else if ((priorClose ?? 0) < (priorOpen ?? 0)) {
      pricePointColor = cssVar("--outcome-loss-50")
    } else {
      pricePointColor = cssVar("--outcome-neutral-50")
    }
  } else {
    pricePointValue = currentOpen
    pricePointIndex = currentIndex
    if ((currentOpen ?? 0) >= (priorClose ?? 0)) {
      pricePointColor = cssVar("--outcome-profit-50")
    } else {
      pricePointColor = cssVar("--outcome-loss-50")
    }
  }

  const options = {
    animations: false,
    maintainAspectRatio: false,
    spanGaps: true,

    elements: {
      line: {
        borderColor: cssVar("--graph-range"),
        borderWidth: 1,
      },
      point: {
        radius: 0,
      },
    },
    tooltips: {
      enabled: false,
    },
    scales: {
      y: {
        display: true,
        position: "right",
      },

      x: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      decimation: {
        enabled: true,
      },
      tooltip: {
        enabled: false,
      },
      annotation: {
        annotations: {
          priceLine: {
            type: "line",
            yScaleID: "y",
            yMin: pricePointValue,
            yMax: pricePointValue,
            borderColor: pricePointColor,
            borderWidth: 1,
            adjustScaleRange: false,
            display: true,
          },
        },
      },
    },
  } as any

  const maxIndex = nextActiveTrade?.expiryIndex ?? endIndex

  for (const activeTrade of activeTrades ?? []) {
    if (activeTrade?.entryPrice != null) {
      const entryIndex = activeTrade.entryIndex
      const expiryIndex = activeTrade.expiryIndex
      if (entryIndex == null || expiryIndex == null) {
        continue
      }
      const isVisible = entryIndex <= maxIndex && expiryIndex >= startIndex
      if (!isVisible) {
        continue
      }

      let minLossPoint = activeTrade.direction === "CALL" ? 0 : activeTrade.entryPrice * 100
      let maxLossPoint = activeTrade.direction === "CALL" ? activeTrade.entryPrice : 0

      let minProfitPoint = activeTrade.direction === "CALL" ? activeTrade.entryPrice : activeTrade.entryPrice
      let maxProfitPoint = activeTrade.direction === "CALL" ? activeTrade.entryPrice * 1000 : 0

      const firstTradeLoss = {
        type: "line",
        xScaleID: "x",
        yScaleID: "y",
        borderWidth: 12,
        yMin: minLossPoint,
        yMax: maxLossPoint,
        xMin: activeTrade?.expiryIndex,
        xMax: activeTrade?.expiryIndex,
        borderColor: cssVar("--outcome-loss-25"),
        backgroundColor: cssVar("--outcome-loss-25"),
        adjustScaleRange: false,
        display: true,
      }

      const firstTradeProfit = {
        type: "line",
        xScaleID: "x",
        yScaleID: "y",
        borderWidth: 12,
        yMin: minProfitPoint,
        yMax: maxProfitPoint,
        xMin: activeTrade?.expiryIndex,
        xMax: activeTrade?.expiryIndex,
        borderColor: cssVar("--outcome-profit-25"),
        backgroundColor: cssVar("--outcome-profit-25"),
        adjustScaleRange: false,
        display: true,
      }

      options.plugins.annotation.annotations[`loss-${activeTrade.id}`] = firstTradeLoss
      options.plugins.annotation.annotations[`profit-${activeTrade.id}`] = firstTradeProfit
    }
  }

  for (const trade of inactiveTrades ?? []) {
    if (trade?.entryPrice != null) {
      const entryIndex = trade.entryIndex
      const tradeEndIndex = trade.exitIndex ?? trade.expiryIndex ?? entryIndex
      if (entryIndex == null || tradeEndIndex == null) {
        continue
      }
      const isVisible = entryIndex <= maxIndex && tradeEndIndex >= startIndex
      if (!isVisible) {
        continue
      }

      const isInProfit = (trade.profit ?? 0) > 0

      const lineColor = isInProfit ? "--outcome-profit-25" : "--outcome-loss-25"
      const cssColor = cssVar(lineColor)

      const entryPoint = {
        type: "point",
        xScaleID: "x",
        yScaleID: "y",
        borderWidth: 2,

        yValue: trade?.entryPrice,
        xValue: trade?.entryIndex,

        borderColor: cssColor,
        backgroundColor: cssColor,
        adjustScaleRange: false,
        display: true,
      }

      const exitPoint = {
        type: "point",
        xScaleID: "x",
        yScaleID: "y",
        borderWidth: 2,

        yValue: trade?.exitPrice,
        xValue: trade?.exitIndex,

        borderColor: cssColor,
        backgroundColor: cssColor,
        adjustScaleRange: false,
        display: true,
      }

      const marginLine = {
        type: "line",
        xScaleID: "x",
        yScaleID: "y",
        borderWidth: 6,

        yMin: trade?.entryPrice,
        xMin: trade?.entryIndex,

        yMax: trade?.exitPrice,
        xMax: trade?.exitIndex,

        borderColor: cssColor,
        backgroundColor: cssColor,
        adjustScaleRange: false,
        display: true,
      }

      options.plugins.annotation.annotations[`entryPoint-${trade.id}`] = entryPoint
      options.plugins.annotation.annotations[`exitPoint-${trade.id}`] = exitPoint
      options.plugins.annotation.annotations[`marginLine-${trade.id}`] = marginLine
    }
  }

  // Draw the open-day segment and price dot as datasets (avoids annotation scale-lookup issues)
  if (!isMarketClosed && currentIndex != null && priorIndex != null && priorClose != null && currentOpen != null) {
    // Grey connecting line from yesterday's close to today's open
    const openLineData = labels.map((lbl) => {
      if (lbl === priorIndex) return priorClose
      if (lbl === currentIndex) return currentOpen
      return null
    })
    datasets.push({
      type: "line",
      label: "openLine",
      data: openLineData,
      pointRadius: 0,
      borderColor: cssVar("--graph-range"),
      borderWidth: 6,
      fill: false,
      spanGaps: true,
      tension: 0,
    })

    // Coloured square dot at today's open
    const pricePointData = labels.map((lbl) => (lbl === currentIndex ? currentOpen : null))
    datasets.push({
      type: "line",
      label: "pricePointDot",
      data: pricePointData,
      pointRadius: labels.map((lbl) => (lbl === currentIndex ? 10 : 0)),
      pointStyle: "rect",
      backgroundColor: pricePointColor,
      borderColor: pricePointColor,
      borderWidth: 2,
      fill: false,
      spanGaps: false,
    })
  }

  return (
    <div {...rest} data-component={name}>
      <div style={{ position: "relative", margin: "auto", width: "99%", height: "99%" }}>
        <Multi datasetIdKey="id" type="line" data={{ labels, datasets }} options={options} />
      </div>
    </div>
  )
}
