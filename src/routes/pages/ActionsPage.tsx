// import addTransaction from "@/data/indexDB/controllers/addTransaction"
// import clearData from "@/data/indexDB/controllers/clearData"
// import resetTrading from "@/data/indexDB/controllers/resetTrading"
// import closeTrade from "@/data/indexDB/controllers/closeTrade"
// import loadData from "@/data/indexDB/controllers/loadData"
// import openContract from "@/data/indexDB/controllers/openContract"
import timerNextDay from "@/data/indexDB/controllers/timerNextDay"
import timerReset from "@/data/indexDB/controllers/timerReset"
import timerStart from "@/data/indexDB/controllers/timerStart"
import timerStop from "@/data/indexDB/controllers/timerStop"
import { ScenarioSpeed } from "@/data/indexDB/enums/ScenarioSpeed"
import useTimer from "@/data/indexDB/hooks/useTimer"
// import formatTimestamp from "@/utilities/formatTimestamp"
// import formatTimestampDay from "@/utilities/formatTimestampDay"

import { FormEvent, useEffect, useState, type HTMLAttributes, type PropsWithChildren } from "react"
import { Link } from "react-router-dom"

import { TradeDirection } from "@/data/indexDB/enums/TradeDirection"

import { OptionDirection } from "@/data/indexDB/enums/OptionDirection"
import { OptionExecution } from "@/data/indexDB/enums/OptionExecution"
// import discoverTradeRate from "@/data/indexDB/controllers/discoverTradeRate"

import formatIndexAsDay from "@/utilities/formatIndexAsDay"
import formatIndexAsDate from "@/utilities/formatIndexAsDate"
import clearUserData from "@/data/indexDB/controllers/clearUserData"
import applicationLoad from "@/data/indexDB/controllers/applicationLoad"
import ohlcLoadAll from "@/data/indexDB/controllers/ohlcLoadAll"
import clearAllData from "@/data/indexDB/controllers/clearAllData"
import ratesLoadAll from "@/data/indexDB/controllers/ratesLoadAll.1"

import addTransaction from "@/data/indexDB/controllers/addTransaction"
import ohlcLoadFor from "@/data/indexDB/controllers/ohlcLoadFor"
import recalculateAll from "@/data/indexDB/controllers/recalculateAll"
import lastIndexOfMonth from "@/utilities/lastIndexOfMonth"
import openContract from "@/data/indexDB/controllers/openContract"
import closeTrade from "@/data/indexDB/controllers/closeTrade"
import discoverTradeRate from "@/data/indexDB/controllers/discoverTradeRate"
import openTrade from "@/data/indexDB/controllers/openTrade"

import usePriceSummaries from "@/data/indexDB/hooks/usePriceSummaries"
import discoverOptionPrice from "@/data/indexDB/controllers/discoverOptionPrice"
import formatValue from "@/utilities/formatValue"
import useMarkets from "@/data/indexDB/hooks/useMarkets"

type ComponentProps = {
  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function ActionsPage({ name = "ActionsPage", ...rest }: PropsWithChildren<ComponentProps>) {
  const timer = useTimer()
  const markets = useMarkets()
  const priceSummaries = usePriceSummaries()

  const [deposit, setDeposit] = useState<number>(1000)

  const [symbol, setSymbol] = useState<string>("EURUSD")
  const [amount, setAmount] = useState<number>(1_000_000)
  const [size, setSize] = useState<number | string>(1)

  const [tradeDirection, setTradeDirection] = useState<TradeDirection>(TradeDirection.Call)
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined)
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined)

  const [tradeExpiry, setTradeExpiry] = useState<number>(timer?.currentIndex ?? 0)

  const [optionDirection, setOptionDirection] = useState<OptionDirection>(OptionDirection.BuyCall)
  const [optionExecution, setOptionExecution] = useState<OptionExecution>(OptionExecution.European)

  const [contractId, setContractID] = useState<string | undefined>(undefined)
  const [tradeId, setTradeID] = useState<string | undefined>(undefined)
  const [primaryId, setPrimaryID] = useState<string | undefined>(undefined)

  const [openingRate, setOpeningRate] = useState<number | undefined>(undefined)
  const [closingRate, setClosingRate] = useState<number | undefined>(undefined)

  const [optionExpiry, setOptionExpiry] = useState<number>(0)
  const [primaryDelta, setPrimaryDelta] = useState<string | undefined>("25")
  const [secondaryDelta] = useState<string | undefined>(undefined)
  const [tertiaryDelta] = useState<string | undefined>(undefined)
  const [quaternaryDelta] = useState<string | undefined>(undefined)

  const [optionPrice, setOptionPrice] = useState<string | undefined>(undefined)

  const [optionData, setOptionData] = useState<any | undefined>(undefined)

  useEffect(() => {
    const currentIndex = timer?.currentIndex

    const lastDayIndex = lastIndexOfMonth(currentIndex, "WED", 3)

    if (lastDayIndex != null) {
      setTradeExpiry(lastDayIndex)
      setOptionExpiry(lastDayIndex)
    }
  }, [timer?.currentIndex])

  const handleUpdateDeposit = (e: FormEvent<HTMLInputElement>) => {
    setDeposit(+e.currentTarget.value)
  }

  const handleUpdateSymbol = (e: FormEvent<HTMLInputElement>) => {
    setSymbol(e.currentTarget.value)
  }

  const handleUpdateTradeDirection = (e: FormEvent<HTMLInputElement>) => {
    const direction = e.currentTarget.value as TradeDirection

    setTradeDirection(direction)

    // if (direction === TradeDirection.Call) {
    //   setOptionDirection(OptionDirection.Buy)
    //   setOptionChoice(OptionChoice.Put)
    //   setOptionExecution(OptionType.European)
    // } else {
    //   setOptionDirection(OptionDirection.Buy)
    //   setOptionChoice(OptionChoice.Call)
    //   setOptionExecution(OptionType.European)
    // }
  }

  const handleUpdateOptionDirection = (e: FormEvent<HTMLInputElement>) => {
    const direction = e.currentTarget.value as OptionDirection

    setOptionDirection(direction)
  }

  const handleUpdateOptionChoice = (e: FormEvent<HTMLInputElement>) => {
    // const choice = e.currentTarget.value as OptionChoice
    // setOptionChoice(choice)
  }

  const handleUpdateOptionType = (e: FormEvent<HTMLInputElement>) => {
    // const type = e.currentTarget.value as OptionType
    // setOptionExecution(type)
  }

  const handleUpdateSize = (e: FormEvent<HTMLInputElement>) => {
    setSize(e.currentTarget.value)
  }

  const handleUpdateAmount = (e: FormEvent<HTMLInputElement>) => {
    setAmount(+e.currentTarget.value)
  }

  const handleUpdateStopLoss = (e: FormEvent<HTMLInputElement>) => {
    setStopLoss(+e.currentTarget.value as any)
  }

  const handleUpdateTakeProfit = (e: FormEvent<HTMLInputElement>) => {
    setTakeProfit(+e.currentTarget.value as any)
  }

  const handleUpdatePrimaryDelta = (e: FormEvent<HTMLInputElement>) => {
    setPrimaryDelta(e.currentTarget.value as any)
  }

  const actionLoadApplication = async () => {
    await applicationLoad()
  }

  const actionLoadAllData = async () => {
    await ohlcLoadAll()
    await ratesLoadAll()
  }

  const actionLoadSymbol = (symbol: string) => async () => {
    await ohlcLoadFor(symbol)
    await recalculateAll()
  }

  const actionClearAllData = async () => {
    await clearAllData()
  }

  const actionClearUserData = async () => {
    await clearUserData()
  }

  const actionAddTransaction = async () => {
    await addTransaction(deposit, "CLIENT")
  }

  const actionOpenContract = async () => {
    if (symbol == null || tradeDirection == null || size == null || Number.isNaN(size)) {
      return
    }
    const contract = await openContract(symbol, tradeDirection, Number.parseFloat(size.toString()))

    if (contract?.id != null) {
      setContractID(contract?.id)
    }
  }

  const actionCloseContract = async () => {
    if (contractId != null) {
      await closeTrade(contractId)

      setContractID(undefined)
    }
  }

  const actionDiscoverOpeningRate = async () => {
    await timerStop()

    const rate = await discoverTradeRate(symbol, tradeDirection)

    setOpeningRate(rate ?? undefined)
  }

  const actionOpenTrade = async () => {
    if (openingRate) {
      const trade = await openTrade(symbol, tradeDirection, amount, openingRate, stopLoss, takeProfit)
      if (trade?.id != null) {
        setTradeID(trade.id)
        setOpeningRate(undefined)

        timerStart(ScenarioSpeed.Fast)
      }
    }
  }

  const actionDiscoverClosingRate = async () => {
    await timerStop()

    const direction = tradeDirection === TradeDirection.Call ? TradeDirection.Put : TradeDirection.Call
    const rate = await discoverTradeRate(symbol, direction)

    setClosingRate(rate ?? undefined)
  }

  const actionCloseTrade = async () => {
    if (tradeId != null) {
      await closeTrade(tradeId, closingRate)

      setTradeID(undefined)
      setClosingRate(undefined)
    }
  }

  const actionDiscoverPrimaryPrice = async () => {
    const { contractCost } =
      (await discoverOptionPrice(symbol, "USD", amount, optionDirection, optionExecution, Number.parseFloat(primaryDelta ?? "0"), optionExpiry)) ?? {}

    setOptionPrice(formatValue(contractCost))
  }

  const actionOpenPrimaryOption = async () => {}
  const actionExecutePrimaryOption = async () => {
    setPrimaryID(undefined)
  }

  return (
    <div {...rest} data-component={name}>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-row flex-wrap gap-2 items-center">
            <Link to="/" className="btn btn-primary btn-sm mx-2">
              Home
            </Link>

            <div className="text-secondary text-2xl font-bold">Actions</div>
          </div>
          <div className="text-secondary  ms-6">
            <strong>{formatIndexAsDay(timer?.currentIndex)}</strong> {formatIndexAsDate(timer?.currentIndex)}
          </div>
        </div>

        <div className="m-4 flex flex-col">
          <div className="divider">Data</div>
          <div className="m-4 flex flex-row flex-wrap gap-4">
            <button className="btn btn-success" onClick={actionLoadApplication}>
              Load Application
            </button>
            <button className="btn btn-success" onClick={actionLoadSymbol("OJ.F")}>
              Load OJ.F
            </button>
            <button className="btn btn-success" onClick={actionLoadSymbol("EURUSD")}>
              Load EURUSD
            </button>
            <button className="btn btn-success" onClick={actionLoadAllData}>
              Load All Data
            </button>
            <button className="btn btn-error" onClick={actionClearAllData}>
              Clear All Data
            </button>
            <button className="btn btn-warning" onClick={actionClearUserData}>
              Clear User Data
            </button>
          </div>
          <div className="mx-4 flex flex-row">
            {priceSummaries?.filter((market) => market.status === "READY").length ?? "No"} of {markets?.length ?? "0"} Markets loaded{" "}
          </div>

          <div className="divider">Timer</div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <button className="btn btn-primary" onClick={() => timerNextDay(true)}>
              Next Day
            </button>

            <button className="btn btn-warning" onClick={() => timerStart(ScenarioSpeed.Slow)}>
              Slow
            </button>
            <button className="btn btn-warning" onClick={() => timerStart(ScenarioSpeed.Medium)}>
              Medium
            </button>
            <button className="btn btn-warning" onClick={() => timerStart(ScenarioSpeed.Fast)}>
              Fast
            </button>

            <button className="btn btn-error" onClick={() => timerStop()}>
              Stop
            </button>

            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("1971-06-14")}>
              Reset 1971
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2000-01-09")}>
              Reset 2000
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2010-01-05")}>
              Reset 2010
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2015-01-05")}>
              Reset 2015
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2016-01-05")}>
              Reset 2016
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2017-01-05")}>
              Reset 2017
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2018-01-04")}>
              Reset 2018
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2019-01-07")}>
              Reset 2019
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => timerReset("2020-01-05")}>
              Reset 2020
            </button>
          </div>

          <div className="divider">Transactions</div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <label className="input input-bordered flex items-center gap-2 w-48">
              Deposit
              <input type="text" className="grow" value={deposit} onChange={handleUpdateDeposit} />
            </label>
          </div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <button className="btn btn-success" onClick={actionAddTransaction}>
              Add Transaction
            </button>
          </div>

          <div className="divider">Quotes</div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <label className="input input-bordered flex items-center gap-2 w-48">
              Symbol
              <input type="text" className="grow" value={symbol} onChange={handleUpdateSymbol} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Amount
              <input type="text" className="grow" value={amount} onChange={handleUpdateAmount} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Size
              <input type="text" className="grow" value={size} onChange={handleUpdateSize} />
            </label>
          </div>

          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <label className="input  flex items-center gap-2 w-auto">
              Call (Buy)
              <input
                type="radio"
                name="radio-trade-direction"
                value={TradeDirection.Call}
                className="radio"
                checked={tradeDirection === TradeDirection.Call}
                onChange={handleUpdateTradeDirection}
              />
            </label>
            <label className="input  flex items-center gap-2 w-auto">
              Put (Sell)
              <input
                type="radio"
                name="radio-trade-direction"
                value={TradeDirection.Put}
                className="radio"
                checked={tradeDirection === TradeDirection.Put}
                onChange={handleUpdateTradeDirection}
              />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Take
              <input type="text" className="grow" placeholder="$" value={takeProfit} onChange={handleUpdateTakeProfit} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Stop
              <input type="text" className="grow" placeholder="$" value={stopLoss} onChange={handleUpdateStopLoss} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              TradExp
              <input type="text" className="grow" placeholder="yyyy-mm-dd" value={formatIndexAsDate(tradeExpiry) as any} onChange={() => {}} />
            </label>
          </div>

          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <label className="input  flex items-center gap-2 w-auto">
              Buy
              <input
                type="radio"
                name="radio-option-direction"
                value={OptionDirection.BuyCall}
                className="radio"
                checked={optionDirection === OptionDirection.BuyCall}
                onChange={handleUpdateOptionDirection}
              />
            </label>
            <label className="input  flex items-center gap-2 w-auto">
              Sell
              <input
                type="radio"
                name="radio-option-direction"
                value={OptionDirection.SellCall}
                className="radio"
                checked={optionDirection === OptionDirection.SellCall}
                onChange={handleUpdateOptionDirection}
              />
            </label>
            {/* <label className="input  flex items-center gap-2 w-auto">
              Call (Gtr Sell)
              <input
                type="radio"
                name="radio-option-choice"
                value={OptionChoice.Put}
                className="radio"
                checked={optionChoice === OptionChoice.Put}
                onChange={handleUpdateOptionChoice}
              />
            </label>
            <label className="input  flex items-center gap-2 w-auto">
              Put (Gtr Buy)
              <input
                type="radio"
                name="radio-option-choice"
                value={OptionChoice.Call}
                className="radio"
                checked={optionChoice === OptionChoice.Call}
                onChange={handleUpdateOptionChoice}
              />
            </label> */}
            <label className="input  flex items-center gap-2 w-auto">
              American
              <input
                type="radio"
                name="radio-option-type"
                value={OptionExecution.American}
                className="radio"
                checked={optionExecution === OptionExecution.American}
                onChange={handleUpdateOptionType}
              />
            </label>
            <label className="input  flex items-center gap-2 w-auto">
              European
              <input
                type="radio"
                name="radio-option-type"
                value={OptionExecution.European}
                className="radio"
                checked={optionExecution === OptionExecution.European}
                onChange={handleUpdateOptionType}
              />
            </label>
          </div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <label className="input input-bordered flex items-center gap-2 w-48">
              OptExp
              <input type="text" className="grow" placeholder="yyyy-mm-dd" value={formatIndexAsDate(optionExpiry) as any} onChange={() => {}} />
            </label>
            {/* </div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center"> */}
            <label className="input input-bordered flex items-center gap-2 w-48">
              Primary
              <input type="text" className="grow" placeholder="+/- pt" value={primaryDelta} onChange={handleUpdatePrimaryDelta} />
            </label>
            {/* <label className="input input-bordered flex items-center gap-2 w-48">
              Secondary
              <input type="text" className="grow" placeholder="+/- pt" defaultValue={secondaryDelta} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Tertiary
              <input type="text" className="grow" placeholder="+/- pt" defaultValue={tertiaryDelta} />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-48">
              Quaternary
              <input type="text" className="grow" placeholder="+/- pt" defaultValue={quaternaryDelta} />
            </label> */}
          </div>

          <div className="divider"></div>
          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <button className="btn btn-warning w-32" onClick={actionOpenContract}>
              Open <br />
              Contract
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Contract ID" defaultValue={contractId ?? ""} />
            <button className="btn btn-warning w-32" onClick={actionCloseContract}>
              Close <br />
              Contract
            </button>
          </div>

          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <button className="btn btn-success w-32" onClick={actionDiscoverOpeningRate}>
              Discover <br />
              Rate
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Opening Rate" defaultValue={openingRate ?? ""} />
            <button className="btn btn-warning  w-32" onClick={actionOpenTrade}>
              Open <br />
              Trade
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Trade ID" defaultValue={tradeId ?? ""} />

            <button className="btn btn-success w-32" onClick={actionDiscoverClosingRate}>
              Discover <br />
              Rate
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Closing Rate" defaultValue={closingRate ?? ""} />
            <button className="btn btn-warning  w-32" onClick={actionCloseTrade}>
              Close <br />
              Trade
            </button>
          </div>

          <div className="m-4 flex flex-row flex-wrap gap-4 items-center">
            <button className="btn btn-success btn-outline w-32" onClick={actionDiscoverPrimaryPrice}>
              Discover <br />
              Price
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Option Price" defaultValue={optionPrice ?? ""} />
            <button className="btn btn-warning btn-outline w-32" onClick={actionOpenPrimaryOption}>
              Open <br />
              Option
            </button>
            <input type="text" className="w-32 input input-bordered " placeholder="Option ID" defaultValue={primaryId ?? ""} />
            <button className="btn btn-warning btn-outline w-32" onClick={actionExecutePrimaryOption}>
              Exercise <br />
              Option
            </button>
          </div>

          <pre>{JSON.stringify(optionData, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
