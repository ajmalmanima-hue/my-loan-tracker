const configured=!window.SUPABASE_URL.includes("YOUR_")&&!window.SUPABASE_ANON_KEY.includes("YOUR_");const sb=configured?supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY):null;let loans=[],editing=null,signup=false;
const $=x=>document.getElementById(x), money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(+n||0), today=()=>new Date().toISOString().slice(0,10);
function notice(t){$("notice").textContent=t;$("notice").classList.remove("hidden")}
function interest(l){let a=+l.principal*+l.interest_rate/100;return l.frequency==="quarterly"?a/4:l.frequency==="halfyearly"?a/2:a}
function fmt(d){return d?new Date(d+"T00:00:00").toLocaleDateString("en-IN"):"Not set"}
function fields(){let e=$("type").value==="emi";$("emiFields").classList.toggle("hidden",!e);$("intFields").classList.toggle("hidden",e);$("emi").required=e}
async function load(){let r=await sb.from("loans").select("*").order("created_at");if(r.error)return alert(r.error.message);loans=r.data||[];render()}
async function payments(id){let r=await sb.from("payments").select("*").eq("loan_id",id).order("payment_date");if(r.error){alert(r.error.message);return []}return r.data||[]}
async function render(){let e=loans.filter(x=>x.loan_type==="emi").reduce((s,x)=>s+ +x.principal,0),i=loans.filter(x=>x.loan_type==="interest").reduce((s,x)=>s+ +x.principal,0),d=loans.filter(x=>x.loan_type==="interest").reduce((s,x)=>s+interest(x),0);$("total").textContent=money(e+i);$("emiTotal").textContent=money(e);$("intTotal").textContent=money(i);$("dueTotal").textContent=money(d);let box=$("loans");box.innerHTML="";if(!loans.length){box.innerHTML='<div class="card">No loans yet. Click <b>+ Add Loan</b> to begin.</div>';return}for(let l of loans){let a=document.createElement("article");a.className="card loan";let detail=l.loan_type==="emi"?`Monthly EMI: <b>${money(l.emi)}</b><br>Rate: <b>${l.interest_rate}% p.a.</b>`:`Rate: <b>${l.interest_rate}% p.a.</b><br>${l.frequency} interest: <b>${money(interest(l))}</b><br>Next due: <b>${fmt(l.due_date)}</b>`;a.innerHTML=`<div class="loanTop"><div><h3>${l.name}</h3><span class="badge">${l.loan_type==="emi"?"EMI Loan":"Interest Only"}</span></div><strong class="balance">${money(l.principal)}</strong></div><div class="details">${detail}</div><div class="actions"><button data-a="pay">Record Payment</button><button data-a="edit">Edit</button><button data-a="history">History</button><button data-a="del" class="danger">Delete</button></div><div class="history hidden"></div>`;a.querySelector('[data-a="pay"]').onclick=()=>showPay(l.id);a.querySelector('[data-a="edit"]').onclick=()=>showEdit(l.id);a.querySelector('[data-a="del"]').onclick=async()=>{if(confirm("Delete this loan and its payment history?")){let r=await sb.from("loans").delete().eq("id",l.id);if(r.error)alert(r.error.message);else load()}};a.querySelector('[data-a="history"]').onclick=async()=>{let h=a.querySelector(".history");h.classList.toggle("hidden");if(!h.classList.contains("hidden")){let ps=await payments(l.id);h.innerHTML=ps.length?ps.reverse().map(p=>`<div>${fmt(p.payment_date)} — <b>${money(p.amount)}</b> — ${p.payment_type}${p.note?" — "+p.note:""}</div>`).join("<hr>"):"No payments recorded."}};box.appendChild(a)}}
function showAdd(){editing=null;$("loanTitle").textContent="Add Loan";$("loanForm").reset();fields();$("loanSec").classList.remove("hidden");$("paySec").classList.add("hidden")}
function showEdit(id){let l=loans.find(x=>x.id===id);editing=id;$("loanTitle").textContent="Edit Loan";$("name").value=l.name;$("type").value=l.loan_type;$("principal").value=l.principal;$("rate").value=l.interest_rate;$("emi").value=l.emi||"";$("frequency").value=l.frequency||"yearly";$("dueDate").value=l.due_date||"";$("notes").value=l.notes||"";fields();$("loanSec").classList.remove("hidden")}
function showPay(id){let l=loans.find(x=>x.id===id);$("payLoanId").value=id;$("payLoanName").textContent=l.name;$("payDate").value=today();$("amount").value="";$("payType").value="interest";$("payNote").value="";$("paySec").classList.remove("hidden");$("loanSec").classList.add("hidden")}
$("type").onchange=fields;$("add").onclick=showAdd;$("cancelLoan").onclick=()=>$("loanSec").classList.add("hidden");$("cancelPay").onclick=()=>$("paySec").classList.add("hidden");
$("loanForm").onsubmit=async e=>{e.preventDefault();let p={name:$("name").value.trim(),loan_type:$("type").value,principal:+$("principal").value,interest_rate:+$("rate").value,emi:+$("emi").value||0,frequency:$("frequency").value,due_date:$("dueDate").value||null,notes:$("notes").value.trim()||null};let r=editing?await sb.from("loans").update(p).eq("id",editing):await sb.from("loans").insert(p);if(r.error)alert(r.error.message);else{$("loanSec").classList.add("hidden");load()}};
$("payForm").onsubmit=async e=>{e.preventDefault();let id=$("payLoanId").value,amt=+$("amount").value,type=$("payType").value;let r=await sb.from("payments").insert({loan_id:id,payment_date:$("payDate").value,amount:amt,payment_type:type,note:$("payNote").value.trim()||null});if(r.error)return alert(r.error.message);if(type==="principal"){let q=await sb.from("loans").select("principal").eq("id",id).single();if(q.error)return alert(q.error.message);let u=await sb.from("loans").update({principal:Math.max(0,+q.data.principal-amt)}).eq("id",id);if(u.error)return alert(u.error.message)}$("paySec").classList.add("hidden");load()};
$("backup").onclick=async()=>{let r=await sb.from("loans").select("*");if(r.error)return alert(r.error.message);let all=[];for(let l of r.data||[])all.push({...l,payments:await payments(l.id)});let b=new Blob([JSON.stringify({version:2,exported:new Date().toISOString(),loans:all},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="loan-tracker-v2-backup.json";a.click()};
$("toggle").onclick=()=>{signup=!signup;$("authTitle").textContent=signup?"Create account":"Sign in";$("authBtn").textContent=signup?"Create account":"Sign in";$("toggle").textContent=signup?"Already have an account? Sign in":"Create a new account"};
$("authForm").onsubmit=async e=>{e.preventDefault();if(!sb)return notice("First configure config.js with your Supabase Project URL and public anon/publishable key.");let r=signup?await sb.auth.signUp({email:$("email").value,password:$("password").value}):await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(r.error)return $("authMsg").textContent=r.error.message;if(signup&&!r.data.session)return $("authMsg").textContent="Account created. Check your email if confirmation is enabled.";show(r.data.user)};
async function show(u){$("auth").classList.add("hidden");$("app").classList.remove("hidden");$("userArea").classList.remove("hidden");$("userEmail").textContent=u.email||"";load()}$("logoutBtn").onclick=()=>sb.auth.signOut();async function init(){
  if(!configured){
    notice("Supabase setup required: edit config.js.");
    return;
  }

  let r=await sb.auth.getSession();

  if(r.data.session){
    show(r.data.session.user);
  }

  sb.auth.onAuthStateChange((event,s)=>{
    if(event==="SIGNED_IN"&&s){
      show(s.user);
    }

    if(event==="SIGNED_OUT"){
      location.reload();
    }
  });
}

if("serviceWorker"in navigator){
  navigator.serviceWorker.register("sw.js");
}

init();
