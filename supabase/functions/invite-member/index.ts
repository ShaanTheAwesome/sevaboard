// Edge Function: invite-member
//
// Lets an admin add a new SevaBoard member from the Team & Roles page
// without ever exposing the Supabase service-role key to the browser.
//
// Flow:
//   1. The caller's JWT (forwarded automatically by supabase.functions.invoke)
//      is used to look up their profile and confirm role = 'admin'. This runs
//      through the normal anon client, so it's subject to RLS.
//   2. Only once that check passes do we create a service-role client and use
//      it to send a Supabase Auth invite email and assign the chosen role /
//      department on the new profile row.
//
// Required secrets (set once via `supabase secrets set ...`):
//   SITE_URL - the deployed app origin, e.g. https://sevaboard.vercel.app
//              (used to build the invite email's redirect link)
// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically for every Edge Function and do not need to be set manually.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const VALID_ROLES = ["admin", "team_lead", "member", "volunteer"]
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const siteUrl = Deno.env.get("SITE_URL")

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !siteUrl) {
    console.error("invite-member: missing required environment configuration")
    return jsonResponse({ error: "Server misconfiguration" }, 500)
  }

  // Scoped to the caller's JWT -- subject to normal RLS. Used only to verify
  // who is calling and whether they're an admin.
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
    return jsonResponse({ error: "Only admins can invite members" }, 403)
  }

  let body: { email?: unknown; full_name?: unknown; role?: unknown; department_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const role = body.role
  const departmentId = body.department_id ?? null

  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: "A valid email address is required" }, 400)
  }
  if (typeof role !== "string" || !VALID_ROLES.includes(role)) {
    return jsonResponse({ error: "Invalid role" }, 400)
  }
  if (departmentId !== null && typeof departmentId !== "string") {
    return jsonResponse({ error: "Invalid department" }, 400)
  }

  // Only reachable after the admin check above -- bypasses RLS.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: fullName ? { full_name: fullName } : undefined,
      redirectTo: `${siteUrl}/set-password`,
    }
  )

  if (inviteError || !inviteData?.user) {
    return jsonResponse({ error: inviteError?.message ?? "Failed to send invite" }, 400)
  }

  // handle_new_user() already created a profiles row with the default role
  // ('member', no department) and the email/full_name above. Now apply the
  // role and department the admin actually chose.
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      role,
      department_id: departmentId,
      ...(fullName ? { full_name: fullName } : {}),
    })
    .eq("id", inviteData.user.id)

  if (updateError) {
    console.error("invite-member: failed to set role/department", updateError)
    return jsonResponse(
      {
        success: true,
        id: inviteData.user.id,
        warning: "Invitation sent, but the role/department couldn't be saved. Edit the member to set them.",
      },
      200
    )
  }

  return jsonResponse({ success: true, id: inviteData.user.id }, 200)
})
