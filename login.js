/* Login / sign up → Supabase Auth → role check → customer or admin dashboard */
const $=id=>document.getElementById(id);
const siteBase=new URL(".",location.href).href;          // works on GitHub Pages sub-folder too
const show=(id,text,ok)=>{const m=$(id);m.textContent=text;m.className="msg "+(ok?"ok":"bad")};

function setTab(signup){
  $("tabLogin").classList.toggle("active",!signup);$("tabSignup").classList.toggle("active",signup);
  $("loginForm").classList.toggle("hidden",signup);$("signupForm").classList.toggle("hidden",!signup);
}
$("tabLogin").onclick=()=>setTab(false);
$("tabSignup").onclick=()=>setTab(true);
if(location.hash==="#signup")setTab(true);

// Came from "Login / Sign up to Order": go back to finish the order (cart was saved)
const fromOrder=new URLSearchParams(location.search).get("next")==="order";
if(fromOrder)$("orderNote").classList.remove("hidden");

async function goToDashboard(){
  const acc=await getAccount();
  if(!acc)return;
  location.replace(fromOrder&&acc.profile.role!=="admin"?"index.html#order":dashboardFor(acc));
}

if(!sb){
  show("loginMsg","Could not connect. Please check your internet and reload.",false);
}else{
  goToDashboard();   // already logged in → straight to the right dashboard
}

$("loginForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("loginEmail").value.trim(), password=$("loginPass").value;
  if(!email||!password)return show("loginMsg","Enter your email and password.",false);
  const btn=e.submitter;btn.disabled=true;show("loginMsg","Logging in…",true);
  const {error}=await sb.auth.signInWithPassword({email,password});
  btn.disabled=false;
  if(error)return show("loginMsg",error.message.includes("Email not confirmed")?"Please confirm your email first (check your inbox).":"Wrong email or password.",false);
  goToDashboard();
};

$("signupForm").onsubmit=async e=>{
  e.preventDefault();
  const full_name=$("suName").value.trim(), phone=$("suPhone").value.trim(), email=$("suEmail").value.trim(), password=$("suPass").value;
  if(!full_name||!phone||!email)return show("signupMsg","Please fill in all fields.",false);
  if(password.length<8)return show("signupMsg","Password must be at least 8 characters.",false);
  const btn=e.submitter;btn.disabled=true;show("signupMsg","Creating your account…",true);
  const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name,phone},emailRedirectTo:siteBase+(fromOrder?"login.html?next=order":"login.html")}});
  btn.disabled=false;
  if(error)return show("signupMsg",error.message,false);
  if(data.session)return goToDashboard();                 // email confirmation turned off
  show("signupMsg","✅ Account created! Check your email and tap the confirmation link, then log in.",true);
  e.target.reset();
};

$("forgotBtn").onclick=async()=>{
  const email=$("loginEmail").value.trim();
  if(!email)return show("loginMsg","Type your email above, then tap “Forgot password?”.",false);
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:siteBase+"account.html#reset"});
  show("loginMsg",error?error.message:"📧 If that email has an account, a reset link is on its way.",!error);
};
