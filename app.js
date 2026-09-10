const KEY="myLoanTrackerV1";
let loans=JSON.parse(localStorage.getItem(KEY)||"[]");
let editingId=null;

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const save=()=>{localStorage.setItem(KEY,JSON.stringify(loans));render()};
function annualInterest(l){return Number(l.principal)*Number(l.rate)/100}
function periodInterest(l){
  const a=annualInterest(l);
  return l.frequency==="quarterly"?a/4:l.frequency==="halfyearly"?a/2:a;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function render(){
  const emiTotal=loans.filter(l=>l.type==="emi").reduce((s,l)=>s+Number(l.principal),0);
  const interestTotal=loans.filter(l=>l.type==="interest").reduce((s,l)=>s+Number(l.principal),0);
  $("emiTotal").textContent=money(emiTotal); $("interestTotal").textContent=money(interestTotal);
  $("totalOutstanding").textContent=money(emiTotal+interestTotal);
  const box=$("loans"); box.innerHTML="";
  if(!loans.length){box.innerHTML='<div class="card"><p>No loans yet.</p><button class="primary" onclick="showAdd()">+ Add your first loan</button></div>';return}
  const tpl=$("loanTemplate");
  loans.forEach(l=>{
    const node=tpl.content.cloneNode(true), article=node.querySelector(".loan");
    article.dataset.id=l.id;
    node.querySelector(".loanName").textContent=l.name;
    node.querySelector(".loanType").textContent=l.type==="emi"?"EMI Loan":"Interest Only";
    node.querySelector(".balance").textContent=money(l.principal);
    const details=node.querySelector(".details");
    if(l.type==="emi"){
      details.innerHTML=`Monthly EMI: <b>${money(l.emi)}</b><br>Interest rate: <b>${l.rate}% p.a.</b>`;
    }else{
      const due=l.dueDate?new Date(l.dueDate+"T00:00:00").toLocaleDateString("en-IN"):"Not set";
      details.innerHTML=`Rate: <b>${l.rate}% p.a.</b><br>${l.frequency} interest: <b>${money(periodInterest(l))}</b><br>Next due: <b>${due}</b>`;
    }
    node.querySelector(".pay").onclick=()=>showPayment(l.id);
    node.querySelector(".edit").onclick=()=>showEdit(l.id);
    node.querySelector(".delete").onclick=()=>{if(confirm("Delete this loan and its payment history?")){loans=loans.filter(x=>x.id!==l.id);save()}};
    node.querySelector(".history").onclick=e=>{
      const hb=article.querySelector(".historyBox"); hb.classList.toggle("hidden");
      hb.innerHTML=l.payments?.length?l.payments.slice().reverse().map(p=>`<div class="historyRow"><span>${new Date(p.date+"T00:00:00").toLocaleDateString("en-IN")}<br>${esc(p.note||p.type)}</span><b>${money(p.amount)}</b></div>`).join(""):"No payments recorded.";
    };
    box.appendChild(node);
  });
}
function showAdd(){
  editingId=null;$("formTitle").textContent="Add Loan";$("loanForm").reset();
  $("formSection").classList.remove("hidden"); $("paymentSection").classList.add("hidden"); updateTypeFields();
  scrollTo({top:$("formSection").offsetTop-10,behavior:"smooth"});
}
function showEdit(id){
  const l=loans.find(x=>x.id===id); if(!l)return; editingId=id;
  $("formTitle").textContent="Edit Loan"; $("name").value=l.name;$("type").value=l.type;$("principal").value=l.principal;$("rate").value=l.rate;
  $("emi").value=l.emi||"";$("frequency").value=l.frequency||"yearly";$("dueDate").value=l.dueDate||"";
  updateTypeFields();$("formSection").classList.remove("hidden");$("paymentSection").classList.add("hidden");scrollTo({top:$("formSection").offsetTop-10,behavior:"smooth"});
}
function updateTypeFields(){const emi=$("type").value==="emi";$("emiFields").classList.toggle("hidden",!emi);$("interestFields").classList.toggle("hidden",emi);$("emi").required=emi}
$("type").onchange=updateTypeFields;
$("addBtn").onclick=showAdd;$("cancelBtn").onclick=()=> $("formSection").classList.add("hidden");
$("loanForm").onsubmit=e=>{
 e.preventDefault();
 const data={name:$("name").value.trim(),type:$("type").value,principal:Number($("principal").value),rate:Number($("rate").value),emi:Number($("emi").value)||0,frequency:$("frequency").value,dueDate:$("dueDate").value};
 if(editingId){const old=loans.find(l=>l.id===editingId);Object.assign(old,data)}else{data.id=crypto.randomUUID();data.payments=[];loans.push(data)}
 $("formSection").classList.add("hidden");save();
};
function showPayment(id){
 const l=loans.find(x=>x.id===id);$("paymentLoanId").value=id;$("paymentLoanName").textContent=l.name;$("paymentDate").value=new Date().toISOString().slice(0,10);$("paymentAmount").value="";$("paymentType").value="interest";$("paymentNote").value="";
 $("paymentSection").classList.remove("hidden");$("formSection").classList.add("hidden");scrollTo({top:$("paymentSection").offsetTop-10,behavior:"smooth"});
}
$("cancelPayment").onclick=()=>$("paymentSection").classList.add("hidden");
$("paymentForm").onsubmit=e=>{
 e.preventDefault();const l=loans.find(x=>x.id===$("paymentLoanId").value);const amount=Number($("paymentAmount").value),type=$("paymentType").value;
 l.payments=l.payments||[];l.payments.push({date:$("paymentDate").value,amount,type,note:$("paymentNote").value.trim()});
 if(type==="principal") l.principal=Math.max(0,Number(l.principal)-amount);
 $("paymentSection").classList.add("hidden");save();
};
$("exportBtn").onclick=()=>{
 const blob=new Blob([JSON.stringify({version:1,exported:new Date().toISOString(),loans},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="loan-tracker-backup.json";a.click();URL.revokeObjectURL(a.href);
};
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();