import LoginLayout from '@/components/login/LoginLayout'
import LoginForm from '@/components/login/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — Sistema de Permisos CEMEX',
  description:
    'Accede al Sistema de Gestión de Permisos CEMEX. Plataforma para la administración y control de permisos y licencias de sucursales.',
}

export default function LoginPage() {
  return (
    <LoginLayout>
      <LoginForm />
    </LoginLayout>
  )
}
