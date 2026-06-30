import { Link, useNavigate } from "react-router"

import { useDataState, useLocalState } from "@keldan-systems/state-mutex"

import useTimer from "@/data/indexDB/hooks/useTimer"
import formatIndexAsDate from "@/utilities/formatIndexAsDate"
import formatIndexAsDay from "@/utilities/formatIndexAsDay"

// import resetTrading from "@/data/indexDB/controllers/resetTrading"

import timerStart from "@/data/indexDB/controllers/timerStart"
import timerStop from "@/data/indexDB/controllers/timerStop"
import { useEffect, useState, type HTMLAttributes, type PropsWithChildren } from "react"
import { FaVideo } from "react-icons/fa6"
import useMarkets from "@/data/indexDB/hooks/useMarkets"
import ConformationModal, { CONFORMATION_MODAL } from "@/display/coordinators/ConformationModal"
import ResetModal, { RESET_MODAL } from "@/display/coordinators/ResetModal"
import LoadAllModal, { LOADALL_MODAL } from "@/display/coordinators/LoadAllModal"
import useLoadingStatus from "@/data/indexDB/hooks/useLoadingStatus"
import formatNumber from "@/utilities/formatNumber"
import DeleteAllModal, { DELETEALL_MODAL } from "@/display/coordinators/DeleteAllModal"
// import usePriceSummaries from "@/data/indexDB/hooks/usePriceSummaries"
// import loadDataForAllSymbols from "@/data/indexDB/controllers/loadDataForAllSymbols"
// import loadDataForAllKeys from "@/data/indexDB/controllers/loadDataForAllKeys"

type ComponentProps = {
  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function HomePage({ name = "HomePage", ...rest }: PropsWithChildren<ComponentProps>) {
  useEffect(() => {
    timerStop(true)
  }, [])

  useLocalState<boolean>("CONFIRMED-WARNINGS", false)

  const navigate = useNavigate()

  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>()

  const { marketsCount, loadedMarketsCount } = useLoadingStatus()

  const isFullyLoaded = marketsCount === loadedMarketsCount

  const timer = useTimer()

  const { currentIndex } = timer ?? {}

  const handleShowResetModal = async () => {
    const element = document?.getElementById(RESET_MODAL) as HTMLDialogElement

    if (element) {
      element.showModal()
    }
  }

  const handleShowDeleteAllModal = async () => {
    const element = document?.getElementById(DELETEALL_MODAL) as HTMLDialogElement

    if (element) {
      element.showModal()
    }
  }

  const handleStartTrading = async () => {
    await timerStart()
    navigate("/prices")
  }

  useEffect(() => {
    if (navigator.storage?.estimate != null) {
      navigator.storage.estimate().then((estimate) => {
        setStorageEstimate(estimate)
      })
    }
  }, [loadedMarketsCount])

  return (
    <div {...rest} data-component={name}>
      <div className="h-full w-full overflow-hidden">
        <ConformationModal />
        <ResetModal />
        <LoadAllModal />
        <DeleteAllModal />
        <div className="p-6 h-full w-full flex flex-col gap-2 justify-center">
          {/* heading */}
          <div className="mt-6 h-32 flex flex-col gap-4 justify-center items-center">
            <div className="text-6xl font-extrabold leading-none tracking-tight text-primary">Price Simulator</div>
            <div className="text-2xl font-extrabold leading-none tracking-tight text-gray-500">
              <span>A game to explain how trading in financial markets works.</span>
            </div>
          </div>
          {/* main */}
          <div className="flex-auto  flex flex-col gap-8 justify-center items-center ">
            <div className=" flex flex-row gap-8 justify-center items-center flex-wrap">
              <div className="card w-96 h-80 bg-base-200 shadow-xl overflow-hidden">
                <div className="card-body">
                  <h4 className="card-title truncate">Scenarios</h4>
                  <div className="h-8 text-gray-500">
                    <span>Using pre-defined scenarios that introduce the skills needed to succeed in this trading game.</span>
                    <div className="text-xs mt-4">Time will stop between each scenario to give you a chance to review the knowledge acquired.</div>
                  </div>
                </div>
                <div className="card-actions justify-between p-4">
                  <div className="p-4 cursor-pointer">
                    <FaVideo className="text-primary" />
                  </div>
                  <Link to="/scenarios">
                    <button className="btn btn-primary">Work through the scenarios</button>
                  </Link>
                </div>
              </div>

              <div className="card w-96 h-80 bg-base-200 shadow-xl overflow-hidden">
                <div className="card-body">
                  <h4 className="card-title truncate">Markets</h4>
                  <div className="h-8 text-gray-500">
                    <div>Take me back to 1970, and see how well you can grow a starting investment of $5,000</div>
                    <div className="text-xs mt-4">
                      <span>As its not real money, you just hit this</span>
                      {/* <Link to="/reset"> */}
                      <button className="btn btn-xs btn-error mx-2" onClick={handleShowResetModal}>
                        button
                      </button>
                      {/* </Link> */}
                      <span>to start over again anytime.</span>
                    </div>
                    <div className="text-xs mt-4">
                      You will retire on 5 May 2023, so you have about 5 hours in the game to make your fortune once the clock starts running.
                    </div>
                  </div>
                </div>
                <div className="card-actions justify-between p-4">
                  <div className="p-4 cursor-pointer">
                    <FaVideo className="text-primary" />
                  </div>

                  <button className="btn btn-primary" onClick={handleStartTrading}>
                    Dive in and start trading
                  </button>
                </div>
              </div>

              <div className="card w-96 h-80 bg-base-200 shadow-xl overflow-hidden">
                <div className="card-body">
                  <h4 className="card-title truncate">Theoretical Rates</h4>
                  <div className="h-8 text-gray-500">
                    <div>This is the sort of tool a professional team of investors would use to plan there trades</div>
                    <div className="text-xs mt-4">
                      You will get access to this tool after you have a balance of $50,000. The more money you have the easer it is to make money.
                    </div>
                  </div>
                </div>
                <div className="card-actions justify-between p-4">
                  <div className="p-4 cursor-pointer">
                    <FaVideo className="text-primary" />
                  </div>
                  <Link to="/markets/overview">
                    <button className="btn btn-primary" disabled>
                      Analyze the market
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="font-extrabold leading-none tracking-tight text-gray-500">
              <span className="text-sm">Currently in the game it is &nbsp;</span>
              <span className="text-sm">{formatIndexAsDay(currentIndex)}, </span>
              <span className="text-lg">{formatIndexAsDate(currentIndex)}</span>
            </div>
            <div>
              {isFullyLoaded === false && (
                <div className="text-secondary opacity-25">
                  {loadedMarketsCount} of {marketsCount} markets have prices downloaded
                </div>
              )}
            </div>
          </div>
          {/* aside */}
          <div className="h-32 flex flex-col gap-4 justify-center items-center">
            <div className="flex flex-col gap-2 text-md font-extrabold leading-none tracking-tight text-gray-500 text-center">
              <div>This is a game, set in 1970, and is not intended to be financial advice.</div>
              <div>There are no GDPR wavers as we don't use cookies, once loaded, the game runs locally.</div>
              <div className="font-light leading-none tracking-tight text-gray-500">
                <span className="text-sm opacity-50">
                  {storageEstimate != null ? (
                    <>
                      The game is currently using {formatNumber((storageEstimate.usage ?? 0) / 1000000, 0)} MB of the available space (
                      {formatNumber((storageEstimate.quota ?? 0) / 1000000, 0)} MB) : click
                    </>
                  ) : (
                    <>Click </>
                  )}
                  <span className="text-error cursor-pointer px-2 " onClick={handleShowDeleteAllModal}>
                    here
                  </span>
                  to delete everything
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
