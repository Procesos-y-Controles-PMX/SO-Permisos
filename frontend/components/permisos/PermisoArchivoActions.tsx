'use client'

import { useState } from 'react'
import { getFileUrl, downloadStorageFile } from '@/lib/storage'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

interface PermisoArchivoActionsProps {
  filePath: string
  className?: string
  viewClassName?: string
  downloadClassName?: string
  iconOnly?: boolean
}

export default function PermisoArchivoActions({
  filePath,
  className = '',
  viewClassName = 'inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium transition-colors',
  downloadClassName = 'inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-[11px] font-medium transition-colors disabled:opacity-50',
  iconOnly = false,
}: PermisoArchivoActionsProps) {
  const [downloading, setDownloading] = useState(false)

  const handleView = async () => {
    const { url, error } = await getFileUrl(filePath)
    if (url) window.open(url, '_blank')
    if (error) alert('Error al abrir archivo: ' + error)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { error } = await downloadStorageFile(filePath)
      if (error) alert('Error al descargar archivo: ' + error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`inline-flex items-center ${iconOnly ? 'gap-3' : 'gap-2'} ${className}`}>
      <button
        type="button"
        onClick={handleView}
        className={
          iconOnly
            ? 'inline-flex p-1 text-blue-500 hover:text-blue-700 rounded-md hover:bg-blue-50 transition-colors'
            : viewClassName
        }
        title="Ver documento"
      >
        <EyeIcon />
        {!iconOnly && ' Ver'}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className={
          iconOnly
            ? 'inline-flex p-1 text-emerald-600 hover:text-emerald-800 rounded-md hover:bg-emerald-50 transition-colors disabled:opacity-50'
            : downloadClassName
        }
        title="Descargar documento"
      >
        <DownloadIcon />
        {!iconOnly && (downloading ? ' Descargando...' : ' Descargar')}
      </button>
    </div>
  )
}
