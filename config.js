/* ================= Supabase connection (shared by all pages) =================
   Project "chatkara". The publishable key is safe in public code: row-level security
   in the database decides what each visitor, customer or admin may read or change. */
const SUPABASE_URL="https://xltbxcefrvushxlpumvx.supabase.co";
const SUPABASE_KEY="sb_publishable_7DW6Y9ntzFnrMePnQXUnew_pX1gHAMu";

// Needs the supabase-js script loaded first; the site still works (without accounts) if it failed to load.
const sb=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;

// Escape text before putting it into HTML (customer-entered data must never run as code)
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rupees=n=>"₹"+Number(n||0).toLocaleString("en-IN");

// Current user + profile ({user, profile} or null)
async function getAccount(){
  if(!sb)return null;
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return null;
  const {data:profile}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();
  return {user:session.user,profile:profile||{role:"customer"}};
}
const dashboardFor=acc=>acc?.profile?.role==="admin"?"admin.html":"account.html";
