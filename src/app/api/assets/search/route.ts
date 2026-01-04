import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, location_id")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()
    const locationId = (searchParams.get("locationId") || "").trim()

    const adminClient = profile.role === "admin" ? createSupabaseAdminClient() : null
    const client = adminClient || supabase

    // Para no-admin: validar sedes accesibles y forzar filtro
    let allowedLocationIds: string[] = []
    if (!adminClient) {
      const { data: userLocs } = await supabase
        .from("user_locations")
        .select("location_id")
        .eq("user_id", user.id)

      allowedLocationIds = (userLocs || []).map((l) => l.location_id).filter(Boolean)
      if (!allowedLocationIds.length && profile.location_id) {
        allowedLocationIds.push(profile.location_id)
      }
      if (!allowedLocationIds.length) {
        return NextResponse.json({ assets: [] })
      }
      // Si se solicita locationId, validar pertenencia
      if (locationId && !allowedLocationIds.includes(locationId)) {
        return NextResponse.json({ error: "Sede no permitida" }, { status: 403 })
      }
    }

    let assetQuery = client
      .from("assets")
      .select("id, asset_tag, asset_type, status, brand, model, location_id, asset_location:locations!location_id(code, name)")
      .is("deleted_at", null)

    if (locationId) {
      assetQuery = assetQuery.eq("location_id", locationId)
    } else if (!adminClient && allowedLocationIds.length) {
      assetQuery = assetQuery.in("location_id", allowedLocationIds)
    }

    if (query.length >= 2) {
      assetQuery = assetQuery.or(`asset_tag.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
    }

    const { data, error } = await assetQuery
      .order("asset_tag", { ascending: true })
      .limit(locationId ? 200 : 10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assets: data ?? [] })
  } catch (err: any) {
    console.error("[assets/search]", err)
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
  }
}
