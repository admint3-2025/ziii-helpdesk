import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 })
    }

    // Admin: usar client de servicio para traer todas las sedes
    if (profile.role === "admin") {
      const admin = createSupabaseAdminClient()
      const { data, error } = await admin
        .from("locations")
        .select("id, code, name")
        .order("code", { ascending: true })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ locations: data || [] })
    }

    // Supervisores/agentes: limitar a sedes asignadas (sin depender solo de RLS)
    const { data: userLocs, error: locErr } = await supabase
      .from("user_locations")
      .select("location_id")
      .eq("user_id", user.id)

    if (locErr) return NextResponse.json({ error: locErr.message }, { status: 500 })

    const locationIds = (userLocs || []).map((l) => l.location_id).filter(Boolean)

    // fallback al location_id del profile si no hay registros en user_locations
    if (!locationIds.length && (profile as any).location_id) {
      locationIds.push((profile as any).location_id)
    }

    if (!locationIds.length) {
      return NextResponse.json({ locations: [] })
    }

    const { data, error } = await supabase
      .from("locations")
      .select("id, code, name")
      .in("id", locationIds)
      .order("code", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ locations: data || [] })
  } catch (err: any) {
    console.error("[locations/options]", err)
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
  }
}
