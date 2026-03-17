'use client'

import Image from 'next/image'

interface LoginLayoutProps {
  children: React.ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ====== LEFT PANEL — Dark branding side ====== */}
      <div className="relative w-full lg:w-[48%] bg-slate-900 text-white flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden min-h-[340px] lg:min-h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Gradient orb top-right */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          {/* Gradient orb bottom-left */}
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/promexma-logo.png"
            alt="Promexma"
            width={180}
            height={48}
            className="brightness-0 invert"
            priority
          />
        </div>

        {/* Hero text */}
        <div className="relative z-10 my-auto py-10 lg:py-0">
          <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-tight tracking-tight">
            <span className="text-slate-200">Sistema de Gestión</span>
            <br />
            <span className="text-white">de Permisos</span>
          </h1>

          {/* Red accent bar */}
          <div className="w-12 h-1 bg-red-600 rounded-full mt-5 mb-6" />

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md">
            Plataforma integral para la administración, control y
            seguimiento de permisos y licencias de las sucursales CEMEX.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1px] bg-slate-600" />
            <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-medium">
              Promexma
            </span>
          </div>
          <span className="text-[11px] text-slate-600">
            Uso exclusivo interno
          </span>
        </div>
      </div>

      {/* ====== RIGHT PANEL — Form side (white) ====== */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 md:p-12 lg:p-16">
        {children}
      </div>
    </div>
  )
}
