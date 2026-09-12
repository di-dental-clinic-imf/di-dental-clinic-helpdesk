const API_URL = "https://script.google.com/macros/s/AKfycbzPIr6NHzx_sDdcZUMUXlQ19KkJE_1UTMm3XjR7N0z6kZJAoxmPWYJqioiQx17z4Yn7GQ/exec";

const loginSection = document.getElementById("loginSection");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword?.addEventListener("click", () => {
  const visible = passwordInput.type === "text";
  passwordInput.type = visible ? "password" : "text";
  togglePassword.textContent = visible ? "Show" : "Hide";
  togglePassword.setAttribute("aria-label", visible ? "Show password" : "Hide password");
  togglePassword.setAttribute("aria-pressed", String(!visible));
});
const appContent = document.getElementById("appContent");
const registerForm = document.getElementById("registerForm");
const treatmentForm = document.getElementById("treatmentForm");
const messageBox = document.getElementById("message");
const connectionStatus = document.getElementById("connectionStatus");
const searchInput = document.getElementById("patientSearch");
const searchResults = document.getElementById("patientSearchResults");
const clearPatientSearchButton = document.getElementById("clearPatientSearch");
const selectedPatient = document.getElementById("selectedPatient");
const patientIdInput = document.getElementById("patientId");
const treatmentType = document.getElementById("treatmentType");
const treatmentCase = document.getElementById("treatmentCase");
const caseSummary = document.getElementById("caseSummary");
let searchTimer = null;
let treatmentCases = [];
let treatmentPrices = {};

function getToken(){ return sessionStorage.getItem("diClinicToken") || ""; }
function getUser(){ try{return JSON.parse(sessionStorage.getItem("diClinicUser")||"null");}catch(e){return null;} }
function showMessage(text,type){ messageBox.textContent=text; messageBox.className=`message ${type}`; }
function clearMessage(){ messageBox.textContent=""; messageBox.className="message hidden"; }
function clearFindPatient(){
  clearTimeout(searchTimer);
  searchTimer=null;
  searchInput.value="";
  searchResults.innerHTML="";
  searchResults.classList.add("hidden");
  selectedPatient.innerHTML="";
  selectedPatient.classList.add("hidden");
  patientIdInput.value="";
  treatmentCases=[];
  treatmentCase.innerHTML='<option value="">New Treatment Case</option>';
  treatmentCase.disabled=true;
  caseSummary.innerHTML="";
  caseSummary.classList.add("hidden");
  treatmentType.value="";
  const payment=document.getElementById("paymentAmount");
  if(payment) payment.value="";
  const treatmentAmount=document.getElementById("treatmentAmount");
  if(treatmentAmount) treatmentAmount.value="";
  clearPatientSearchButton?.blur();
}

function clearPatientState(){
  clearTimeout(searchTimer);
  searchTimer=null;
  searchInput.value="";
  searchResults.innerHTML="";
  searchResults.classList.add("hidden");
  selectedPatient.innerHTML="";
  selectedPatient.classList.add("hidden");
  patientIdInput.value="";
  treatmentCases=[];
  treatmentCase.innerHTML='<option value="">New Treatment Case</option>';
  treatmentCase.disabled=true;
  caseSummary.innerHTML="";
  caseSummary.classList.add("hidden");
  treatmentType.value="";
  document.getElementById("paymentAmount").value="";
}
function setBusy(button,busy){ if(!button.dataset.originalText) button.dataset.originalText=button.textContent; button.disabled=busy; button.textContent=busy?"Please wait...":button.dataset.originalText; }

async function callApi(payload, authenticated=true){
  const body={...payload};
  if(authenticated) body.token=getToken();
  const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const text=await response.text();
  let result; try{result=JSON.parse(text);}catch(e){throw new Error("The server returned an unexpected response.");}
  if(result.message && /session expired|authentication required|invalid session/i.test(result.message)){ logout(false); }
  return result;
}

function logout(show=true){ clearPatientState(); sessionStorage.removeItem("diClinicToken"); sessionStorage.removeItem("diClinicUser"); appContent.classList.add("hidden"); loginSection.classList.remove("hidden"); loginSection.classList.add("active"); document.getElementById("password").value=""; clearMessage(); connectionStatus.textContent="Logged out"; if(show) showMessage("You have been logged out.","success"); }

function showLoggedIn(){
  const user=getUser();
  if(!user || !getToken()) return;
  if(user.role!=="Help Desk" && user.role!=="Admin"){ logout(false); showMessage("This account does not have Help Desk access.","error"); return; }
  loginSection.classList.add("hidden"); appContent.classList.remove("hidden"); document.getElementById("loggedInUser").textContent=`Logged in: ${user.name} (${user.role})`; connectionStatus.textContent="Connected";
}

clearPatientSearchButton?.addEventListener("click",clearFindPatient);

loginForm.addEventListener("submit",async e=>{
  e.preventDefault(); const button=e.submitter; setBusy(button,true); clearMessage();
  try{
    const result=await callApi({action:"login",username:document.getElementById("username").value.trim(),password:document.getElementById("password").value},false);
    if(!result.success){showMessage(result.message||"Login failed.","error");return;}
    clearPatientState();
    sessionStorage.setItem("diClinicToken",result.token); sessionStorage.setItem("diClinicUser",JSON.stringify(result.user));
    showLoggedIn(); showMessage(`Welcome, ${result.user.name}.`,"success"); loginForm.reset();
  }catch(err){showMessage(`Unable to contact the clinic API.\n${err.message}`,"error");}
  finally{setBusy(button,false);}
});

document.getElementById("logoutButton").addEventListener("click",async()=>{ try{if(getToken()) await callApi({action:"logout"});}catch(e){} logout(true); });

function addWhatsAppButton(mobile, patientName, appointmentDate, appointmentTime){
  const cleanMobile=String(mobile||"").replace(/\D/g,"");
  if(cleanMobile.length!==10) return;
  const message=`Hello ${patientName},\n\nYour appointment at DI Dental Clinic is confirmed for ${formatDisplayDate(appointmentDate)} at ${formatDisplayTime(appointmentTime)}.\n\nThank you.`;
  const button=document.createElement("button");
  button.type="button";
  button.className="whatsapp-button";
  button.textContent="Send WhatsApp";
  button.addEventListener("click",()=>{
    const url="https://wa.me/91"+cleanMobile+"?text="+encodeURIComponent(message);
    window.open(url,"_blank");
  });
  messageBox.appendChild(button);
}

function formatDisplayDate(value){
  const parts=String(value||"").split("-");
  if(parts.length!==3) return value;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m=Number(parts[1]);
  return m>=1&&m<=12?`${parts[2]}-${months[m-1]}-${parts[0]}`:value;
}

function formatDisplayTime(value){
  const parts=String(value||"").split(":");
  if(parts.length<2) return value;
  let h=Number(parts[0]); const min=parts[1];
  if(isNaN(h)) return value;
  const period=h>=12?"PM":"AM"; h=h%12||12;
  return `${String(h).padStart(2,"0")}:${min} ${period}`;
}

registerForm.addEventListener("submit",async e=>{
  e.preventDefault(); const button=e.submitter; setBusy(button,true); clearMessage();
  const payload={action:"register",name:document.getElementById("name").value.trim(),mobile:document.getElementById("mobile").value.trim(),appointmentDate:document.getElementById("appointmentDate").value,appointmentTime:document.getElementById("appointmentTime").value};
  try{const result=await callApi(payload); if(result.success){showMessage(`Patient registered successfully.\nPatient ID: ${result.patientId}\nName: ${result.patientName}`,"success"); addWhatsAppButton(result.mobile,result.patientName,result.appointmentDate,result.appointmentTime); registerForm.reset(); setDefaultDates();}else showMessage(result.message||"Registration failed.","error");}catch(err){showMessage(`Unable to contact the clinic API.\n${err.message}`,"error");}finally{setBusy(button,false);}
});

treatmentForm.addEventListener("submit",async e=>{
  e.preventDefault(); const button=e.submitter;
  if(!patientIdInput.value){showMessage("Please search for and select a patient first.","error");return;}
  if(!treatmentType.value){showMessage("Please select a treatment type.","error");return;}
  setBusy(button,true); clearMessage();
  try{
    const result=await callApi({action:"recordPayment",patientId:patientIdInput.value,treatment:treatmentType.value,caseId:treatmentCase.value,amount:document.getElementById("paymentAmount").value});
    if(result.success){
      showMessage(`Payment recorded successfully.\nPatient: ${result.patientName}\nTreatment: ${result.treatment}\nCase ID: ${result.caseId}\nPayment: ₹${Number(result.amount||0).toLocaleString("en-IN")}\nPaid so far: ₹${Number(result.amountPaid||0).toLocaleString("en-IN")}\nBalance: ₹${Number(result.balance||0).toLocaleString("en-IN")}`,"success");
      await loadTreatmentCases(patientIdInput.value);
      treatmentForm.reset();
      renderTreatmentCases();
      updateNewCasePrice();
    }else showMessage(result.message||"Payment failed.","error");
  }catch(err){showMessage(`Unable to contact the clinic API.\n${err.message}`,"error");}
  finally{setBusy(button,false);}
});

searchInput.addEventListener("input",()=>{clearTimeout(searchTimer); const q=searchInput.value.trim(); if(q.length<2){searchResults.classList.add("hidden");searchResults.innerHTML="";return;} searchTimer=setTimeout(()=>searchPatients(q),250);});

async function searchPatients(query){
  try{
    const result=await callApi({action:"searchPatients",query});
    if(!result.success){showMessage(result.message||"Search failed.","error");return;}
    renderResults(result.patients||[]);
  }catch(err){
    // A cached Apps Script/PWA response can occasionally produce a stale 404.
    // Retry once with a cache-busting parameter while keeping the same session token.
    if(String(err.message||"").includes("HTTP 404")){
      try{
        const body={action:"searchPatients",query,token:getToken()};
        const response=await fetch(API_URL+"?search="+Date.now(),{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body),cache:"no-store"});
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const result=JSON.parse(await response.text());
        if(!result.success){showMessage(result.message||"Search failed.","error");return;}
        renderResults(result.patients||[]);
        return;
      }catch(retryErr){
        showMessage(`Unable to search patients.\n${retryErr.message}`,"error");
        return;
      }
    }
    showMessage(`Unable to search patients.\n${err.message}`,"error");
  }
}

function renderResults(patients){
  searchResults.innerHTML=""; if(!patients.length){searchResults.innerHTML='<div class="patient-result"><strong>No patients found</strong><span>Try another name, mobile number or Patient ID.</span></div>';searchResults.classList.remove("hidden");return;}
  patients.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="patient-result";b.innerHTML=`<strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.mobile)} · ${escapeHtml(p.patientId)}</span>`;b.addEventListener("click",()=>selectPatient(p));searchResults.appendChild(b);}); searchResults.classList.remove("hidden");
}
async function selectPatient(p){
  patientIdInput.value=p.patientId;
  selectedPatient.innerHTML=`<strong>${escapeHtml(p.name)}</strong><br>Patient ID: ${escapeHtml(p.patientId)} · ${escapeHtml(p.mobile)}`;
  selectedPatient.classList.remove("hidden");
  searchResults.classList.add("hidden");
  await loadTreatmentCases(p.patientId);
}

async function loadTreatmentCases(patientId){
  treatmentCases=[];
  treatmentCase.innerHTML='<option value="">New Treatment Case</option>';
  treatmentCase.disabled=true;
  caseSummary.classList.add("hidden");
  try{
    const result=await callApi({action:"getTreatmentCases",patientId});
    if(!result.success){showMessage(result.message||"Unable to load treatment cases.","error");return;}
    treatmentCases=result.cases||[];
    renderTreatmentCases();
  }catch(err){
    showMessage(`Unable to load treatment cases.\n${err.message}`,"error");
  }
}

function renderTreatmentCases(){
  const selectedTreatment=treatmentType.value;
  const matching=treatmentCases.filter(c=>!selectedTreatment || c.treatment===selectedTreatment);
  treatmentCase.innerHTML='<option value="">New Treatment Case</option>';
  matching.forEach(c=>{
    const option=document.createElement("option");
    option.value=c.caseId;
    option.textContent=`${c.caseId} · ${c.treatment} · Paid ₹${Number(c.amountPaid||0).toLocaleString("en-IN")}${c.status?` · ${c.status}`:""}`;
    treatmentCase.appendChild(option);
  });
  treatmentCase.disabled=!patientIdInput.value;
  updateCaseSummary();
}

function updateCaseSummary(){
  const id=treatmentCase.value;
  const c=treatmentCases.find(x=>x.caseId===id);
  if(!c){caseSummary.classList.add("hidden");caseSummary.innerHTML="";return;}
  caseSummary.innerHTML=`<strong>${escapeHtml(c.caseId)}</strong> · ${escapeHtml(c.treatment)}<br>Standard: ₹${Number(c.standardAmount||0).toLocaleString("en-IN")} · Agreed: ₹${Number(c.agreedAmount||0).toLocaleString("en-IN")}<br>Paid: ₹${Number(c.amountPaid||0).toLocaleString("en-IN")} · Balance: ₹${Number(c.balance||0).toLocaleString("en-IN")}`;
  caseSummary.classList.remove("hidden");
}

treatmentType.addEventListener("change",()=>{ renderTreatmentCases(); updateNewCasePrice(); });
treatmentCase.addEventListener("change",updateCaseSummary);
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

function setDefaultDates(){
  const d=new Date(); const dateInput=document.getElementById("appointmentDate"); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); dateInput.value=local;
}

document.querySelectorAll(".tab[data-section]").forEach(tab=>{tab.addEventListener("click",()=>{document.querySelectorAll(".tab[data-section]").forEach(t=>t.classList.remove("active"));tab.classList.add("active");document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));const target=document.getElementById(tab.dataset.section);target.classList.add("active");target.scrollIntoView({behavior:"smooth",block:"start"});});});

async function loadTreatmentPrices(){
  try{
    const result=await callApi({action:"getTreatmentPrices"});
    if(result.success){
      treatmentPrices={};
      (result.prices||[]).forEach(p=>{ treatmentPrices[String(p.treatment||"").trim()]=Number(p.standardAmount||0); });
      updateNewCasePrice();
    }
  }catch(e){}
}

function updateNewCasePrice(){
  const id=treatmentCase.value;
  const c=treatmentCases.find(x=>x.caseId===id);
  if(c){ updateCaseSummary(); return; }
  const price=Number(treatmentPrices[treatmentType.value]||0);
  if(price>0){
    caseSummary.innerHTML=`Standard treatment amount: ₹${price.toLocaleString("en-IN")}<br>Agreed amount is set by Admin.`;
    caseSummary.classList.remove("hidden");
  }else{
    caseSummary.classList.add("hidden");
    caseSummary.innerHTML="";
  }
}

setDefaultDates(); showLoggedIn();
if(getToken()) loadTreatmentPrices();
