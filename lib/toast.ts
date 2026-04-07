import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const p = MySwal.mixin({
  customClass: {
    popup: 'rounded-[32px] p-4 sm:p-6 shadow-2xl bg-white border border-gray-100',
    title: 'font-black text-2xl text-gray-900 tracking-tight mt-2',
    htmlContainer: 'text-gray-500 font-medium text-base sm:text-lg mt-2',
    confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-3 font-bold shadow-lg shadow-emerald-500/30 transition-all m-2',
    cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl px-6 py-3 font-bold transition-all m-2',
  },
  buttonsStyling: false,
})

const defaultToast = (message: string) => {
  return p.fire({
    text: message,
    timer: 3000,
    showConfirmButton: false,
  })
}

defaultToast.success = (message: string, duration?: number) => {
  return p.fire({
    icon: 'success',
    title: 'Succès',
    text: message,
    timer: duration || 3000,
    showConfirmButton: true,
    confirmButtonText: 'Super !',
  })
}

defaultToast.error = (message: string, duration?: number) => {
  return p.fire({
    icon: 'error',
    title: 'Erreur',
    text: message,
    timer: duration,
    showConfirmButton: true,
    confirmButtonText: 'Compris',
  })
}

defaultToast.warning = (message: string, duration?: number) => {
  return p.fire({
    icon: 'warning',
    title: 'Attention',
    text: message,
    timer: duration || 4000,
    showConfirmButton: true,
    confirmButtonText: 'Compris',
  })
}

defaultToast.loading = (message: string) => {
  p.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      MySwal.showLoading()
    }
  })
  return message
}

defaultToast.dismiss = () => {
  MySwal.close()
}

defaultToast.promise = async <T>(
  promise: Promise<T>,
  msgs: { loading: string; success: string | ((data: T) => string); error: string | ((err: any) => string) }
) => {
  p.fire({
    title: msgs.loading,
    allowOutsideClick: false,
    didOpen: () => {
      MySwal.showLoading()
    }
  })
  try {
    const data = await promise
    const successMsg = typeof msgs.success === 'function' ? msgs.success(data) : msgs.success
    p.fire({
      icon: 'success',
      title: 'Succès',
      text: successMsg,
      timer: 3000,
      showConfirmButton: true,
      confirmButtonText: 'Génial !',
    })
    return data
  } catch (err: any) {
    const errorMsg = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error
    p.fire({
      icon: 'error',
      title: 'Action impossible',
      text: errorMsg,
      showConfirmButton: true,
      confirmButtonText: "D'accord",
    })
    throw err
  }
}

export const toast = defaultToast
