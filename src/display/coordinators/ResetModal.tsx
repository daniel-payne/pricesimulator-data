import clearUserData from "@/data/indexDB/controllers/clearUserData"
import type { HTMLAttributes, PropsWithChildren } from "react"

export const RESET_MODAL = "ResetModal"

type ComponentProps = {
  open?: boolean

  name?: string
} & HTMLAttributes<HTMLDivElement>

export default function ResetModal({ name = "ResetModal", children, ...rest }: PropsWithChildren<ComponentProps>) {
  const handleCancel = () => {
    const element = document?.getElementById(RESET_MODAL) as HTMLDialogElement

    if (element) {
      element.close()
    }
  }

  const handleConfirm = async () => {
    await clearUserData()

    handleCancel()
  }

  return (
    <div {...rest} data-controller={name}>
      <dialog id={RESET_MODAL} className="modal">
        <div className="modal-box">
          <h3 className="text-error font-bold text-lg">Warning</h3>
          <p className="py-4">
            You will lose all your trades and be taken back to 1970 with another <strong className="text-success">$5,000</strong> to start trading with.
          </p>
          <div className="modal-action">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="ms-2 btn btn-error" onClick={handleConfirm}>
              Reset
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
