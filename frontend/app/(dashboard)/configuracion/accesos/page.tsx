"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccessLogsBoard from "@/components/admin/AccessLogsBoard";
import { useAuth } from "@/contexts/AuthContext";

export default function AccesosPage() {
  const router = useRouter();
  const { isOwnerAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isOwnerAdmin) {
      router.replace("/configuracion/sucursales");
    }
  }, [loading, isOwnerAdmin, router]);

  if (loading || !isOwnerAdmin) return null;

  return <AccessLogsBoard />;
}
