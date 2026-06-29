import timerStop from "@/data/indexDB/controllers/timerStop"
import useScenarioFor from "@/data/indexDB/hooks/useScenarioFor"
import timerUpdate from "@/data/indexDB/controllers/timerUpdate"
import preloadScenarioPrices from "@/data/indexDB/controllers/preloadScenarioPrices"

import useFavoriteList from "@/data/localStorage/hooks/useFavoriteList"
import useRangeSelection from "@/data/localStorage/hooks/useRangeSelection"
import BalanceModal from "@/display/coordinators/BalanceModal"
import SymbolManager from "@/display/coordinators/SymbolManager"
import TradingFooter from "@/display/coordinators/TradingFooter"
import { Settings } from "@/display/Settings"
import sizeForCount from "@/utilities/sizeForCount"
import { useState, useEffect, type HTMLAttributes, type PropsWithChildren } from "react"

import { useParams } from "react-router"
import actionProcess from "@/data/indexDB/controllers/actionProcess"
import ScenarioHeader from "@/display/coordinators/ScenarioHeader"
import ProcessErrorModal, { PROCESSERROR_MODAL } from "@/display/coordinators/ProcessErrorModal"

type ComponentProps = {
  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function ScenarioPage({ name = "ScenarioPage", ...rest }: PropsWithChildren<ComponentProps>) {
  const { ref } = useParams()

  const [processError, setProcessError] = useState<any>(null)
  const [pricesReady, setPricesReady] = useState(false)

  const scenario = useScenarioFor(ref)

  const favoriteSymbols = useFavoriteList()
  const range = useRangeSelection("1m")

  const scenarioSymbols = scenario?.symbols?.split(",")

  useEffect(() => {
    console.log("[TimerDebug] ScenarioPage mount - stopping timer initially")
    timerStop(true)
    return () => {
      console.log("[TimerDebug] ScenarioPage unmount - stopping timer")
      timerStop(true)
    }
  }, [])

  useEffect(() => {
    if (!scenarioSymbols?.length) {
      setPricesReady(false)
      return
    }

    let cancelled = false
    setPricesReady(false)
    timerUpdate({ activeSymbols: scenarioSymbols })

    preloadScenarioPrices(scenarioSymbols).then(() => {
      if (!cancelled) {
        setPricesReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scenarioSymbols?.join(",")])

  if (scenario === undefined) {
    return <div>Loading scenario…</div>
  }

  if (scenarioSymbols === undefined) {
    return <div>No Scenario</div>
  }

  if (!pricesReady) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <span className="loading loading-spinner loading-lg" />
        <div className="text-base-content/60">Loading prices for {scenarioSymbols.join(", ")}…</div>
      </div>
    )
  }

  const scenarioSettings = JSON.parse(scenario?.settings ?? "{}")

  const displayWrapperClassName = "h-full w-full min-h-0 min-w-0 flex flex-row flex-wrap overflow-hidden justify-start items-start"

  const displayClassName = sizeForCount(scenarioSymbols.length ?? 1) + " p-2"

  const actionProcessWithErrors = async (instructions: any) => {
    try {
      await actionProcess(instructions)
    } catch (error: any) {
      setProcessError(error.message)

      const element = document?.getElementById(PROCESSERROR_MODAL) as HTMLDialogElement

      if (element) {
        element.showModal()
      }
    }
  }

  const settings = { ...scenarioSettings, range, ...{ onAction: actionProcessWithErrors } } as Settings

  return (
    <div {...rest} data-component={name}>
      <div className="h-full w-full">
        <BalanceModal />
        <ProcessErrorModal processError={processError} />
        <div className="h-full w-full flex flex-col">
          <ScenarioHeader scenario={scenario} />
          <div className="flex-auto p-2">
            <div className={displayWrapperClassName}>
              {scenarioSymbols.map((symbol) => {
                return (
                  <div className={displayClassName} key={symbol}>
                    <div className="h-full w-full">
                      <SymbolManager className="h-full w-full" symbol={symbol} settings={settings} favoriteSymbols={favoriteSymbols} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <TradingFooter settings={settings} />
        </div>
      </div>
    </div>
  )
}
