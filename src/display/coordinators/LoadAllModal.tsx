import clearUserData from "@/data/indexDB/controllers/clearUserData"
import marketsLoadAll from "@/data/indexDB/controllers/marketsLoadAll"
import ohlcLoadAll from "@/data/indexDB/controllers/ohlcLoadAll"
import useLoadingStatus from "@/data/indexDB/hooks/useLoadingStatus"
import { useEffect, useState, type HTMLAttributes, type PropsWithChildren } from "react"

export const LOADALL_MODAL = "LoadAllModal"

type ComponentProps = {
  open?: boolean

  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function LoadAllModal({ name = "LoadAllModal", children, ...rest }: PropsWithChildren<ComponentProps>) {
  const { marketsCount, loadedMarketsCount } = useLoadingStatus()
  const [disabledButton, setDisabledButton] = useState<boolean>((marketsCount ?? 0) === loadedMarketsCount)

  const handleCancel = () => {
    const element = document?.getElementById(LOADALL_MODAL) as HTMLDialogElement

    if (element) {
      element.close()
    }
  }

  const handleConfirm = async () => {
    setDisabledButton(true)

    await ohlcLoadAll()

    handleCancel()
  }


  useEffect(() => {
    if (marketsCount === loadedMarketsCount) {
      handleCancel()
    }
  }, [marketsCount, loadedMarketsCount])

  return (
    <div {...rest} data-controller={name}>
      <dialog id={LOADALL_MODAL} className="modal">
        <div className="modal-box">
          <h3 className="text-error font-bold text-lg">Warning</h3>
          <div className="py-4">
            <p>You Will need to download the market prices (90mb),</p>
            <p>This might take a few minutes.</p>
            <p className="p-2 opacity-25">
              {loadedMarketsCount} of {marketsCount} markets have prices downloaded
            </p>
          </div>

          <div className="modal-action">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="ms-2 btn btn-error" disabled={disabledButton} onClick={handleConfirm}>
              Load All Markets
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
