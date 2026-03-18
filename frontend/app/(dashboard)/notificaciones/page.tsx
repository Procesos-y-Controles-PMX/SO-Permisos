'use client'

import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import type { TipoAlerta } from '@/types'

// ── Alert config ───────────────────────────────────────────

const alertConfig: Record<TipoAlerta, { icon: React.ReactNode; bg: string; border: string; dot: string }> = {
  vencimiento: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-red-50',
    border: 'border-red-100',
    dot: 'bg-red-500',
  },
  solicitud_nueva: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dot: 'bg-blue-500',
  },
  solicitud_aprobada: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-green-50',
    border: 'border-green-100',
    dot: 'bg-green-500',
  },
  solicitud_rechazada: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    dot: 'bg-orange-500',
  },
}

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {}
  items.forEach((n) => {
    const date = new Date(n.fecha_creacion).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(n)
  })
  return groups
}

// ── Component ──────────────────────────────────────────────

export default function NotificacionesPage() {
  const { data: notificaciones, loading, error, unreadCount, markAsRead, markAllRead } = useNotificaciones()
  const grouped = groupByDate(notificaciones)

  if (loading) {
    return (
      <>
        <PageHeader title="Notificaciones" subtitle="Cargando notificaciones..." />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse"><div className="h-16 bg-gray-100 rounded-lg" /></Card>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Notificaciones" subtitle="Error al cargar datos" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle={`Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />

      {notificaciones.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-gray-300 text-lg mb-1">🔔</p>
          <p className="text-gray-400 text-[13px]">No tienes notificaciones.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 pl-1">
                {date}
              </p>

              <div className="space-y-2">
                {items.map((notif) => {
                  const cfg = alertConfig[notif.tipo_alerta as TipoAlerta] || alertConfig.vencimiento
                  return (
                    <Card
                      key={notif.id}
                      className={`
                        !p-4 cursor-pointer transition-all duration-200
                        ${notif.leida
                          ? 'opacity-60 hover:opacity-90'
                          : `!border-l-4 ${cfg.border} shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
                        }
                      `}
                    >
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="w-full text-left flex items-start gap-3.5"
                      >
                        <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-relaxed ${notif.leida ? 'text-gray-500' : 'text-slate-700 font-medium'}`}>
                            {notif.mensaje}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(notif.fecha_creacion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.leida && (
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-2`} />
                        )}
                      </button>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
