const configured =
  typeof window.SUPABASE_URL === "string" &&
  typeof window.SUPABASE_ANON_KEY === "string" &&
  !window.SUPABASE_URL.includes("YOUR_") &&
  !window.SUPABASE_ANON_KEY.includes("YOUR_") &&
  typeof window.supabase !== "undefined";

const sb = configured
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

let loans = [], editing = null, signup = false;

const $ = x => document.getElementById(x);
const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(+n||0);
const today = () => new Date().toISOString().slice(0,10);

function notice(t){$("notice").textContent=t;$("notice").classList.remove("hidden")}
function fmt(d){return d?new Date(d+"T00:00:00").toLocaleDateString("en-IN"):"Not set"}
function frequencyMonths(f){return f==="quarterly"?3:f==="halfyearly"?6:12}
function interest(l){
  const annual = +l.principal * +l.interest_rate / 100;
  return l.frequency==="quarterly" ? annual/4 : l.frequency==="halfyearly" ? annual/2 : annual;
}
function fields(){
  const e=$("type").value==="emi";
  $("emiFields").classList.toggle("hidden",!e);
  $("intFields").classList.toggle("hidden",e);
  $("emi").required=e;
}
function isOverdue(l){
  return l.loan_type==="interest" && l.due_date && l.due_date < today();
}
async function load(){
  const r=await sb.from("loans").select("*").order("created_at");
  if(r.error){alert(r.error.message);return}
  loans=r.data||[];
  render();
}
async function payments(id){
  const r=await sb.from("payments").select("*").eq("loan_id",id).order("payment_date",{ascending:false});
  if(r.error){alert(r.error.message);return []}
  return r.data||[];
}
async function paymentTotals(id){
  const ps=await payments(id);
  return {
    payments:ps,
    interestPaid:ps.filter(p=>p.payment_type==="interest").reduce((s,p)=>s+(+p.amount||0),0),
    principalPaid:ps.filter(p=>p.payment_type==="principal").reduce((s,p)=>s+(+p.amount||0),0)
  };
}
function filteredLoans(){
  const q=$("search").value.trim().toLowerCase();
  const f=$("filter").value;
  return loans.filter(l=>{
    const match=!q || l.name.toLowerCase().includes(q) || (l.notes||"").toLowerCase().includes(q);
    const type=f==="all" || l.loan_type===f || (f==="overdue" && isOverdue(l));
    return match && type;
  });
}
async function render(){
  const emiTotal=loans.filter(x=>x.loan_type==="emi").reduce((s,x)=>s+ +x.principal,0);
  const intTotal=loans.filter(x=>x.loan_type==="interest").reduce((s,x)=>s+ +x.principal,0);
  const dueTotal=loans.filter(x=>x.loan_type==="interest").reduce((s,x)=>s+interest(x),0);
  $("total").textContent=money(emiTotal+intTotal);
  $("emiTotal").textContent=money(emiTotal);
  $("intTotal").textContent=money(intTotal);
  $("dueTotal").textContent=money(dueTotal);
  $("overdueTotal").textContent=loans.filter(isOverdue).length;

  let allInterestPaid=0;
  for(const l of loans){
    const t=await paymentTotals(l.id);
    allInterestPaid+=t.interestPaid;
  }
  $("paidTotal").textContent=money(allInterestPaid);

  const box=$("loans");
  box.innerHTML="";
  const list=filteredLoans();
  if(!list.length){
    box.innerHTML=`<div class="card">${loans.length?"No loans match your search/filter.":"No loans yet. Click <b>+ Add Loan</b> to begin."}</div>`;
    return;
  }

  for(const l of list){
    const totals=await paymentTotals(l.id);
    const overdue=isOverdue(l);
    const dueInterest=l.loan_type==="interest"?interest(l):0;
    const status=l.loan_type==="interest"
      ? (overdue?`<span class="badge overdue">Overdue</span>`:`<span class="badge ok">On track</span>`)
      : `<span class="badge">Monthly EMI</span>`;

    const a=document.createElement("article");
    a.className="card loan";
    const detail=l.loan_type==="emi"
      ? `Monthly EMI: <b>${money(l.emi)}</b><br>Rate: <b>${l.interest_rate}% p.a.</b>`
      : `Rate: <b>${l.interest_rate}% p.a.</b><br>${l.frequency} interest: <b>${money(dueInterest)}</b><br>Next due: <b>${fmt(l.due_date)}</b> ${status}`;

    a.innerHTML=`
      <div class="loanTop">
        <div><h3>${l.name}</h3><span class="badge">${l.loan_type==="emi"?"EMI Loan":"Interest Only"}</span></div>
        <strong class="balance">${money(l.principal)}</strong>
      </div>
      <div class="details">${detail}</div>
      <div class="payment-summary">
        <div class="mini">Interest paid<b>${money(totals.interestPaid)}</b></div>
        <div class="mini">Principal paid<b>${money(totals.principalPaid)}</b></div>
        <div class="mini">${l.loan_type==="interest"?"Current interest":"Next EMI"}<b>${l.loan_type==="interest"?money(dueInterest):money(l.emi)}</b></div>
      </div>
      <div class="actions">
        <button data-a="pay">Record Payment</button>
        <button data-a="edit">Edit</button>
        <button data-a="history">History</button>
        <button data-a="del" class="danger">Delete</button>
      </div>
      <div class="history hidden"></div>`;

    a.querySelector('[data-a="pay"]').onclick=()=>showPay(l.id);
    a.querySelector('[data-a="edit"]').onclick=()=>showEdit(l.id);
    a.querySelector('[data-a="del"]').onclick=async()=>{
      if(!confirm("Delete this loan and its payment history?"))return;
      const r=await sb.from("loans").delete().eq("id",l.id);
      if(r.error)alert(r.error.message);else load();
    };
    a.querySelector('[data-a="history"]').onclick=async()=>{
      const h=a.querySelector(".history");
      h.classList.toggle("hidden");
      if(!h.classList.contains("hidden")){
        const ps=totals.payments;
        h.innerHTML=ps.length
          ? ps.map(p=>`<div>${fmt(p.payment_date)} — <b>${money(p.amount)}</b> — ${p.payment_type==="emi"?"EMI":p.payment_type}${p.note?" — "+p.note:""}</div>`).join("<hr>")
          : "No payments recorded.";
      }
    };
    box.appendChild(a);
  }
}
function showAdd(){
  editing=null;
  $("loanTitle").textContent="Add Loan";
  $("loanForm").reset();
  $("type").value="interest";
  fields();
  $("loanSec").classList.remove("hidden");
  $("paySec").classList.add("hidden");
}
function showEdit(id){
  const l=loans.find(x=>x.id===id); editing=id;
  $("loanTitle").textContent="Edit Loan";
  $("name").value=l.name;$("type").value=l.loan_type;$("principal").value=l.principal;
  $("rate").value=l.interest_rate;$("emi").value=l.emi||"";
  $("frequency").value=l.frequency||"yearly";$("dueDate").value=l.due_date||"";
  $("notes").value=l.notes||"";fields();
  $("loanSec").classList.remove("hidden");$("paySec").classList.add("hidden");
}
function showPay(id){
  const l=loans.find(x=>x.id===id);
  $("payLoanId").value=id;
  $("payLoanName").textContent=l.name;
  $("payDate").value=today();
  $("amount").value=l.loan_type==="emi"?l.emi:"";
  $("payType").value="interest";
  $("payNote").value="";
  const isEmi=l.loan_type==="emi";
  $("payTitle").textContent=isEmi?"Record EMI Payment":"Record Payment";
  $("payTypeWrap").classList.toggle("hidden",isEmi);
  $("emiPaymentHelp").classList.toggle("hidden",!isEmi);
  $("emiSplit").classList.toggle("hidden",!isEmi);
  if(isEmi) updateEmiSplit();
  $("paySec").classList.remove("hidden");
  $("loanSec").classList.add("hidden");
}
function updateEmiSplit(){
  const id=$("payLoanId").value, l=loans.find(x=>x.id===id);
  if(!l||l.loan_type!=="emi")return;
  const amount=+$("amount").value||0;
  const monthlyRate=(+l.interest_rate||0)/100/12;
  const interestPart=monthlyRate*(+l.principal||0);
  const principalPart=Math.max(0,Math.min(amount,amount-interestPart));
  $("emiInterest").textContent=money(Math.min(amount,interestPart));
  $("emiPrincipal").textContent=money(principalPart);
}
$("type").onchange=fields;
$("add").onclick=showAdd;
$("cancelLoan").onclick=()=>$("loanSec").classList.add("hidden");
$("cancelPay").onclick=()=>$("paySec").classList.add("hidden");
$("search").oninput=render;
$("filter").onchange=render;

$("loanForm").onsubmit=async e=>{
  e.preventDefault();
  const p={
    name:$("name").value.trim(),loan_type:$("type").value,principal:+$("principal").value,
    interest_rate:+$("rate").value,emi:+$("emi").value||0,frequency:$("frequency").value,
    due_date:$("dueDate").value||null,notes:$("notes").value.trim()||null
  };
  const r=editing?await sb.from("loans").update(p).eq("id",editing):await sb.from("loans").insert(p);
  if(r.error)alert(r.error.message);else{$("loanSec").classList.add("hidden");load();}
};

$("amount").oninput=updateEmiSplit;
$("payForm").onsubmit=async e=>{
  e.preventDefault();
  const id=$("payLoanId").value, amt=+$("amount").value;
  if(!amt||amt<=0)return;
  const l=loans.find(x=>x.id===id);
  if(!l)return;

  if(l.loan_type==="emi"){
    const monthlyRate=(+l.interest_rate||0)/100/12;
    const interestPart=Math.min(amt,Math.max(0,monthlyRate*(+l.principal||0)));
    const principalPart=Math.max(0,amt-interestPart);

    const r=await sb.from("payments").insert({
      loan_id:id,payment_date:$("payDate").value,amount:amt,
      payment_type:"emi",note:$("payNote").value.trim()||null
    });
    if(r.error){alert(r.error.message);return}

    if(principalPart>0){
      const u=await sb.from("loans").update({
        principal:Math.max(0,(+l.principal||0)-principalPart)
      }).eq("id",id);
      if(u.error){alert(u.error.message);return}
    }
  }else{
    const type=$("payType").value;
    const r=await sb.from("payments").insert({
      loan_id:id,payment_date:$("payDate").value,amount:amt,
      payment_type:type,note:$("payNote").value.trim()||null
    });
    if(r.error){alert(r.error.message);return}

    if(type==="principal"){
      const q=await sb.from("loans").select("principal").eq("id",id).single();
      if(q.error){alert(q.error.message);return}
      const u=await sb.from("loans").update({
        principal:Math.max(0,+q.data.principal-amt)
      }).eq("id",id);
      if(u.error){alert(u.error.message);return}
    }
  }

  $("paySec").classList.add("hidden");
  load();
};

$("backup").onclick=async()=>{
  const r=await sb.from("loans").select("*");
  if(r.error){alert(r.error.message);return}
  const all=[];
  for(const l of r.data||[])all.push({...l,payments:await payments(l.id)});
  const b=new Blob([JSON.stringify({version:3,exported:new Date().toISOString(),loans:all},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="loan-tracker-v3-backup.json";a.click();
  URL.revokeObjectURL(a.href);
};

$("toggle").onclick=e=>{
  e.preventDefault();signup=!signup;
  $("authTitle").textContent=signup?"Create account":"Sign in";
  $("authBtn").textContent=signup?"Create account":"Sign in";
  $("password").autocomplete=signup?"new-password":"current-password";
  $("toggle").textContent=signup?"Already have an account? Sign in":"Create a new account";
};

$("authForm").onsubmit=async e=>{
  e.preventDefault();
  if(!sb){$("authMsg").textContent="Supabase is not configured. Check config.js.";return}
  $("authBtn").disabled=true;
  $("authMsg").textContent=signup?"Creating account...":"Signing in...";
  try{
    const email=$("email").value.trim(), password=$("password").value;
    const r=signup
      ? await sb.auth.signUp({email,password})
      : await sb.auth.signInWithPassword({email,password});
    if(r.error)throw r.error;
    if(signup&&!r.data.session){
      $("authMsg").textContent="Account created. Check your email to confirm it, then sign in.";
      return;
    }
    if(r.data.user)await show(r.data.user);
  }catch(err){
    $("authMsg").textContent=err.message||String(err);
  }finally{$("authBtn").disabled=false}
};

async function show(u){
  $("auth").classList.add("hidden");$("app").classList.remove("hidden");
  $("userArea").classList.remove("hidden");$("userEmail").textContent=u.email||"";
  await load();
}
$("logoutBtn").onclick=()=>sb.auth.signOut();

async function init(){
  if(!configured){notice("Supabase setup required: check config.js and the Supabase script.");return}
  try{
    const r=await sb.auth.getSession();
    if(r.error)throw r.error;
    if(r.data.session?.user)await show(r.data.session.user);
  }catch(err){$("authMsg").textContent=err.message||String(err)}
  sb.auth.onAuthStateChange((event,s)=>{
    if(event==="SIGNED_IN"&&s)show(s.user);
    if(event==="SIGNED_OUT")location.reload();
  });
}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
init();
