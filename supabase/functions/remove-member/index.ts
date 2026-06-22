// Edge Function: remove-member
//
// Lets an admin fully remove a SevaBoard member — deletes their auth.users
// row (which cascades to profiles via ON DELETE CASCADE), so the person can
// no longer log in and their profile data is cleaned up in one step.
//
// Why an Edge Function instead of a direct profiles DELETE from the client:
//   A client-side DELETE on profiles would remove the profiles row but leave
//   the auth.users account intact — the person could still authenticate,
//   and AuthContext's .single() lookup would fail. Deleting via
//   auth.admin.deleteUser() is the correct path: auth.users is removed
//   first, and the cascade takes care of profiles automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("remove-member: missing required environment configuration")
    return jsonResponse({ error: "Server misconfiguration" }, 500)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401)
  }

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", callerData.user.id)
    .single()

  if (callerProfileError || callerProfile?.role !== "admin") {
    return jsonResponse({ error: "Only admins can remove members" }, 403)
  }

  let body: { user_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const userId = typeof body.user_id === "string" ? body.user_id.trim() : ""

  if (!userId) {
    return jsonResponse({ error: "user_id is required" }, 400)
  }

  if (userId === callerData.user.id) {
    return jsonResponse({ error: "You cannot remove your own account" }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    return jsonResponse({ error: deleteError.message ?? "Failed to remove member" }, 400)
  }

  return jsonResponse({ success: true, id: userId }, 200)
})
