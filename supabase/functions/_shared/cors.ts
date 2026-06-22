// Shared CORS headers for Supabase Edge Functions invoked from the browser
// via supabase.functions.invoke(). Kept permissive on Access-Control-Allow-Origin
// because every function in this project enforces its own auth/role checks
// internally -- CORS is not the security boundary here.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
