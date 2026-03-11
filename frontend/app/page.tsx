'use client'
import { useEffect, useState } from 'react'
// Usamos ruta relativa ya que tu carpeta 'lib' está al mismo nivel que 'app'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // IMPORTANTE: Aquí llamamos a tu FastAPI (puerto 8000)
        const response = await fetch('http://localhost:8000/supabase-check')
        
        if (!response.ok) {
          throw new Error('El servidor FastAPI no responde (¿está encendido?)')
        }

        const result = await response.json()

        if (result.error) {
          setError(result.error)
        } else {
          setData(result.datos || [])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-24 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 border-b border-slate-800 pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SO-Permisos Dashboard
          </h1>
          <p className="mt-2 text-slate-400 italic">
            Visualización de datos: Next.js + FastAPI + Supabase
          </p>
        </div>

        {/* Status Card */}
        <section className="grid gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              Registros en la Base de Datos
            </h2>

            {loading ? (
              <div className="flex flex-col gap-3">
                <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-800 rounded-lg animate-pulse w-3/4"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
                ⚠️ Error: {error}
              </div>
            ) : (
              <div className="grid gap-4">
                {data.length > 0 ? (
                  data.map((item) => (
                    <div 
                      key={item.id} 
                      className="group p-4 bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-blue-400 font-mono text-sm mb-1">ID: #{item.id}</p>
                          <p className="text-lg font-medium text-slate-200">{item.status}</p>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
                    No se encontraron registros en la tabla.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-12 text-center text-slate-600 text-sm">
          <p>Proyecto de Sistemas Operativos - 2026</p>
        </footer>
      </div>
    </main>
  )
}