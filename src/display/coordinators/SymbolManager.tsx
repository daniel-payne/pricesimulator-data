import type { HTMLAttributes, PropsWithChildren } from "react"
import consoleInfo from "@/utilities/consoleInfo"

import MarketContractDescription from "../components/MarketContractDescription"
import MarketSummaryDescription from "../components/MarketSummaryDescription"

import useMarketFor from "@/data/indexDB/hooks/useMarketFor"

import usePriceFor from "@/data/indexDB/hooks/usePriceFor"

import MarketHeader from "../components/MarketHeader"
import MarketFooter from "../components/MarketFooter"
import FormManager from "./FormManager"

import MarketPriceDescription from "../components/MarketPriceDescription"

import useViewSelection from "@/data/localStorage/hooks/useViewSelection"
import useContentSelection from "@/data/localStorage/hooks/useContentSelection"

import ClosesManager from "./ClosesManager"
import HighLowManager from "./HighLowManager"
import useActiveTradesFor from "@/data/indexDB/hooks/useActiveTradesFor"
import { View } from "../controllers/ViewChooser"
import { Content } from "../controllers/ContentChooser"
import { Behavior } from "../controllers/BehaviorSelector"
import { Action } from "../controllers/ActionSelector"
import { Settings } from "../Settings"

type ComponentProps = {
  symbol: string

  settings?: Settings
  favoriteSymbols?: Array<string>

  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function SymbolManager({
  symbol,

  settings = {},
  favoriteSymbols = [],

  name = "SymbolManager",
  ...rest
}: PropsWithChildren<ComponentProps>) {
  const market = useMarketFor(symbol)
  const price = usePriceFor(symbol)

  const { view = "contracted", content = "info" } = settings

  if (market == null || price == null) {
    consoleInfo(`SymbolManager: showing loading skeleton for ${symbol} — market=${market != null}, price=${price != null}`)
    return (
      <div {...rest} data-component={name}>
        <div className="h-full w-full rounded-xl p-4 bg-base-300 shadow-xl">
          <div className="h-full w-full flex flex-col gap-2 animate-pulse">
            <div className="h-5 w-32 rounded bg-base-content/10" />
            <div className="flex-auto flex flex-col gap-2 justify-center items-center opacity-30">
              <div className="loading loading-spinner loading-md" />
              <div className="text-xs text-base-content/50">Loading {symbol}…</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div {...rest} data-component={name}>
      <div className="h-full w-full rounded-xl p-4 bg-base-300 shadow-xl ">
        <div className="h-full w-full flex flex-col gap-2 ">
          <MarketHeader market={market} settings={settings} favoriteSymbols={favoriteSymbols} />
          <div className="flex-auto overflow-auto">
            {view === "expanded" && (
              <div className="h-full w-full relative">
                {content === "info" && (
                  <>
                    <MarketContractDescription market={market} />
                    <MarketSummaryDescription market={market} />
                  </>
                )}
                {content === "price" && <MarketPriceDescription market={market} price={price} />}
                {content === "sparkline" && <ClosesManager className="h-full w-full" symbol={symbol} settings={settings} />}
                {content === "chart" && <HighLowManager className="h-full w-full" symbol={symbol} settings={settings} />}
                {content === "form" && <FormManager className="h-full w-full " symbol={symbol} settings={settings} />}
                {content === "both" && (
                  <div className="h-full w-full flex flex-row gap-2">
                    <div className="flex-auto">
                      <HighLowManager className="h-full w-full" symbol={symbol} settings={settings} />
                    </div>
                    <div className="h-full w-128 border border-primary rounded-lg overflow-auto">
                      <FormManager className="h-full w-full" symbol={symbol} settings={settings} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <MarketFooter market={market} price={price} settings={settings} />
        </div>
      </div>
    </div>
  )
}

/*


        <div className="p-2">
          <div className="flex flex-row justify-between ">
            <MarketNameDescription market={market} />
            {favorites != null && <MarketBehaviors market={market} isFavorite={isFavorite} />}
          </div>
          {display === MarketDisplay.Info && (
            <>
              <div className="flex flex-col gap-2 pt-2">
                <MarketContractDescription market={market} />
                <MarketSummaryDescription market={market} />
              </div>
              {hasNoPrices && (
                <div className="flex flex-row justify-end">
                  <button className="btn btn-sm btn-primary" disabled={market.priceCount > 0} onClick={() => ohlcLoadFor(market.symbol)}>
                    Load Data
                  </button>
                </div>
              )}
            </>
          )}
          {display === MarketDisplay.Line && <SymbolSparkline symbol={market?.symbol} />}
            </div>

*/
