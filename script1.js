const KEY='sanFinancePro_v6_fixas';
const defaultData={
  salario:0,
  movs:[],
  debts:[],
  jobs:[],
  wishes:[],
  creditCards:[],
  creditPurchases:[],
  creditInvoicePayments:[]
};
let data=load();
data=repairData(data);
save();
let tipo='gasto';
let selectedMonth=localStorage.getItem(KEY+'_selectedMonth')||nowMonth();
function uid(){
  if(window.crypto && typeof window.crypto.randomUUID==='function') return window.crypto.randomUUID();
  return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
}
function repairIds(list,prefix){
  const seen=new Set();
  return (Array.isArray(list)?list:[]).map((item,i)=>{
    item=item&&typeof item==='object'?item:{};
    const old=String(item.id||'');
    if(!old || seen.has(old)){ item.id=prefix+'_'+uid(); }
    seen.add(String(item.id));
    return item;
  });
}
function repairData(d){
  d=d&&typeof d==='object'?d:{};
  d.movs=repairIds(d.movs,'mov');
  d.debts=repairIds(d.debts,'debt').map(x=>{
    if(x.fixa){
      if(!Array.isArray(x.paidMonths)) x.paidMonths=(Array.isArray(x.pagos)&&x.pagos.includes(0))?[nowMonth()]:[];
      x.pagos=Array.isArray(x.pagos)?x.pagos:[];
    }
    return x;
  });
  d.jobs=repairIds(d.jobs,'job');
  d.wishes=repairIds(d.wishes,'wish');
  d.creditCards=repairIds(d.creditCards,'card');
  d.creditPurchases=repairIds(d.creditPurchases,'purchase');
  d.creditInvoicePayments=repairIds(d.creditInvoicePayments,'invoicepay');
  d.jobs=(Array.isArray(d.jobs)?d.jobs:[]).map(j=>{
    j=j&&typeof j==='object'?j:{};
    j.costs=repairIds(j.costs,'jobcost');
    return j;
  });
  return Object.assign({}, defaultData, d);
}
function load(){try{return repairData(JSON.parse(localStorage.getItem(KEY))||defaultData)}catch{return repairData(defaultData)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function fmt(v){return 'R$ '+Number(v||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function nowMonth(){return new Date().toISOString().slice(0,7)}
function monthName(m){let [y,mo]=m.split('-');return new Date(Number(y),Number(mo)-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','')}
function monthLabelSmart(m){return monthName(m).toUpperCase()}
function normalizeYM(v){return /^\d{4}-\d{2}$/.test(v||'')?v:nowMonth()}
function setSelectedMonth(v){selectedMonth=normalizeYM(v);localStorage.setItem(KEY+'_selectedMonth',selectedMonth);closeMonthPicker();render()}
function changeMonth(delta){selectedMonth=addMonths(selectedMonth,delta);localStorage.setItem(KEY+'_selectedMonth',selectedMonth);render();syncMonthPicker()}
function goCurrentMonth(){selectedMonth=nowMonth();localStorage.setItem(KEY+'_selectedMonth',selectedMonth);render();syncMonthPicker()}
function openMonthPicker(){syncMonthPicker();const o=document.getElementById('monthOverlay');if(o)o.classList.add('open')}
function closeMonthPicker(ev){if(ev&&ev.target&&ev.target.id!=='monthOverlay')return;const o=document.getElementById('monthOverlay');if(o)o.classList.remove('open')}
function syncMonthPicker(){const i=document.getElementById('smartMonthInput');if(i)i.value=selectedMonth;const t=document.getElementById('monthSheetTitle');if(t)t.textContent=monthName(selectedMonth)}
function movMonth(m){if(m.ym)return m.ym; const d=String(m.date||''); const parts=d.split('/'); if(parts.length===3)return parts[2]+'-'+parts[1].padStart(2,'0'); return nowMonth()}
function movsInMonth(month=selectedMonth){return (data.movs||[]).filter(m=>movMonth(m)===month)}
function jobsInMonth(month=selectedMonth){return (data.jobs||[]).filter(j=>!j.dataEvento || String(j.dataEvento).slice(0,7)===month)}
function show(id,btn){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');closeFab();render();updateFab()}
function setTipo(t){tipo=t;tabGasto.className='pill'+(t==='gasto'?' activeG':'');tabEntrada.className='pill'+(t==='entrada'?' activeE':'');movCat.style.display=t==='entrada'?'none':''}

function debtAppliesInMonth(d, month){
  if(!d) return false;
  const start=d.inicio||nowMonth();
  if(d.fixa) return month>=start;

  const months=parseInt(d.meses)||1;
  for(let i=0;i<months;i++){
    if(addMonths(start,i)===month) return true;
  }
  return false;
}
function debtIndexForMonth(d, month){
  const start=d.inicio||nowMonth();
  const months=parseInt(d.meses)||1;
  for(let i=0;i<months;i++){
    if(addMonths(start,i)===month) return i;
  }
  return -1;
}
function currentMonthDebts(month=nowMonth()){
  return (data.debts||[]).filter(d=>debtAppliesInMonth(d, month));
}
function currentMonthDebtTotal(month=nowMonth()){
  return currentMonthDebts(month).reduce((sum,d)=>{
    const idx=d.fixa?0:debtIndexForMonth(d,month);
    if(idx<0) return sum;
    return sum+(parseFloat(d.valor)||0);
  },0);
}
function currentMonthDebtPaid(month=nowMonth()){
  return currentMonthDebts(month).reduce((sum,d)=>{
    if(d.fixa){
      return (d.paidMonths||[]).includes(month) ? sum+(parseFloat(d.valor)||0) : sum;
    }
    const idx=debtIndexForMonth(d,month);
    if(idx<0) return sum;
    return (d.pagos||[]).includes(idx) ? sum+(parseFloat(d.valor)||0) : sum;
  },0);
}

function totals(month=selectedMonth){
  const movs=movsInMonth(month);
  const entrada=movs.filter(m=>m.tipo==='entrada').reduce((a,b)=>a+b.valor,0);
  const gastos=movs.filter(m=>m.tipo==='gasto').reduce((a,b)=>a+b.valor,0);
  const dividasMes=currentMonthDebtTotal(month);
  const dividasPagas=currentMonthDebtPaid(month);
  const jobsPagos=jobsInMonth(month).filter(j=>isJobPaid(j)).reduce((a,b)=>a+(parseFloat(b.valor)||0),0);
  const saldo=entrada+jobsPagos-gastos-dividasPagas;
  return{entrada:entrada+jobsPagos,entradasExtras:entrada,gastos,dividasPagas,totalDividas:dividasMes,saldo,saida:gastos+dividasPagas,jobsPagos}
}

function addMov(){
  const nome=movNome.value.trim(), valor=parseFloat(movValor.value);
  if(!nome||!valor){alert('Preenche nome e valor.');return false}
  if(valor>50000 && !confirm('Valor muito alto. Confirmar lançamento?')) return false;
  data.movs.unshift({id:uid(),tipo,nome,valor,cat:tipo==='entrada'?'💰':movCat.value,ym:nowMonth(),date:new Date().toLocaleDateString('pt-BR'),time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});
  movNome.value='';movValor.value='';save();render();return true
}
function delMov(id){
  if(!confirm('Apagar este lançamento?')) return;
  data.movs=(data.movs||[]).filter(m=>m.id!==id);
  data.creditInvoicePayments=(data.creditInvoicePayments||[]).filter(p=>p.movId!==id);
  (data.jobs||[]).forEach(j=>{if(Array.isArray(j.costs)) j.costs=j.costs.map(c=>c.movId===id?Object.assign({},c,{movId:''}):c)});
  save();render();
}
function toggleDebtType(){
  if(typeof debtTipo === 'undefined') return;
  if(debtTipo.value==='fixa'){
    debtMeses.value=1;
    debtMeses.disabled=true;
    debtMeses.placeholder='Não precisa';
  }else{
    debtMeses.disabled=false;
    debtMeses.placeholder='Meses';
  }
}
function addDebt(){
  const nome=debtNome.value.trim(), valor=parseFloat(debtValor.value), inicio=debtInicio.value||nowMonth();
  const fixa=(typeof debtTipo !== 'undefined' && debtTipo.value==='fixa');
  const meses=fixa ? 1 : parseInt(debtMeses.value);
  let dia=parseInt(debtDia.value);
  if(!dia || dia < 1 || dia > 31) dia=10;
  if(!nome||!valor||(!fixa&&!meses)){alert('Preenche nome, valor e meses.');return}
  data.debts.unshift({id:uid(),nome,valor,meses,fixa,inicio,dia,pagos:[],paidMonths:[]});
  debtNome.value='';debtValor.value='';debtMeses.value='';debtInicio.value='';debtDia.value='';
  const fc=document.getElementById('formDebtCard'); if(fc) fc.classList.remove('open');
  if(typeof debtTipo !== 'undefined'){debtTipo.value='parcelada'; toggleDebtType();}
  save();render()
}
function toggleDebt(id,idx){
  const d=data.debts.find(x=>x.id===id);
  if(!d)return;
  if(d.fixa){
    if(!Array.isArray(d.paidMonths)) d.paidMonths=[];
    const month=selectedMonth||nowMonth();
    if(d.paidMonths.includes(month)) d.paidMonths=d.paidMonths.filter(m=>m!==month);
    else d.paidMonths.push(month);
    d.paidMonths.sort();
    save();render();return;
  }
  if(!Array.isArray(d.pagos)) d.pagos=[];
  if(d.pagos.includes(idx)) d.pagos=d.pagos.filter(p=>p!==idx); else d.pagos.push(idx);
  d.pagos.sort((a,b)=>a-b); save(); render();
}
function delDebt(id){if(confirm('Apagar essa dívida?')){data.debts=data.debts.filter(d=>d.id!==id);save();render()}}
function addMonths(ym,n){let [y,m]=ym.split('-').map(Number);m+=n; y+=Math.floor((m-1)/12); m=((m-1)%12)+1; return y+'-'+String(m).padStart(2,'0')}
let savingJob=false;
function addJob(){
  if(savingJob) return;
  savingJob=true;
  setTimeout(()=>{savingJob=false},800);
  const cliente=jobCliente.value.trim(), valor=parseFloat(jobValor.value), status=jobStatus.value, obs=jobObs.value.trim();
  const dataEvento=jobDataEvento.value;
  if(!cliente||!valor){alert('Preenche cliente e valor.');savingJob=false;return}
  if(!dataEvento){alert('Coloque a data do evento.');savingJob=false;return}
  data.jobs=repairIds(data.jobs,'job');
  const newJob={id:uid(),cliente,valor,status:jobStatusLabel(status),obs,dataEvento,costs:[]};
  if(isJobPaid(newJob)){newJob.paidAt=new Date().toISOString();newJob.paidMonth=nowMonth();}
  data.jobs.unshift(newJob);
  // Quando o job é lançado para um mês futuro, o app muda para o mês do evento
  // para o cadastro aparecer imediatamente na lista de Jobs.
  selectedMonth=String(dataEvento).slice(0,7);
  localStorage.setItem(KEY+'_selectedMonth',selectedMonth);
  jobCliente.value='';jobValor.value='';jobObs.value='';jobDataEvento.value='';
  const fc=document.getElementById('formJobCard'); if(fc) fc.classList.remove('open');
  save();render();savingJob=false
}
function jobEventInfo(dateStr){
  if(!dateStr) return '';
  const today=new Date(); today.setHours(0,0,0,0);
  const d=new Date(dateStr+'T00:00:00');
  const diff=Math.round((d-today)/86400000);
  const date=d.toLocaleDateString('pt-BR');
  if(diff===0) return `📅 ${date} • hoje`;
  if(diff===1) return `📅 ${date} • amanhã`;
  if(diff>1) return `📅 ${date} • faltam ${diff} dias`;
  return `📅 ${date} • evento concluído`;
}
function sortJobsByEventDate(list){
  return [...list].sort((a,b)=>new Date((a.dataEvento||'2999-12-31')+'T00:00:00')-new Date((b.dataEvento||'2999-12-31')+'T00:00:00'));
}

const JOB_FLOW=[
  {label:'Orçamento enviado',short:'Orçamento',color:'#ffd84d'},
  {label:'Fechado',short:'Fechado',color:'#2368ff'},
  {label:'Gravado',short:'Gravado',color:'#9427ff'},
  {label:'Editando',short:'Editando',color:'#f09a28'},
  {label:'Entregue',short:'Entregue',color:'#4bd23a'},
  {label:'Pago',short:'Pago',color:'#35f477'}
];
function jobIndex(status){
  const s=(status||'').toLowerCase();
  if(s.includes('orçamento')||s.includes('orcamento')||s.includes('pendente')) return 0;
  if(s.includes('fechado')) return 1;
  if(s.includes('gravado')) return 2;
  if(s.includes('editando')) return 3;
  if(s.includes('entregue')) return 4;
  if(s.includes('pago')) return 5;
  return 0;
}
function isJobPaid(j){return jobIndex(j.status)>=5}
function jobStatusLabel(status){return JOB_FLOW[jobIndex(status)].label}
function jobStatusOptions(current){return JOB_FLOW.map(st=>`<option ${jobIndex(current)===jobIndex(st.label)?'selected':''}>${st.label}</option>`).join('')}
function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function updateJob(id,status){
  data.jobs=repairIds(data.jobs,'job');
  let j=data.jobs.find(x=>x.id===id);
  if(j){
    const wasPaid=isJobPaid(j);
    j.status=status;
    const nowPaid=isJobPaid(j);
    if(nowPaid&&!wasPaid){j.paidAt=new Date().toISOString();j.paidMonth=nowMonth();}
    if(!nowPaid&&wasPaid){delete j.paidAt;delete j.paidMonth;}
    save();render();
  }
}
function delJob(id){data.jobs=repairIds(data.jobs,'job');if(confirm('Apagar job?')){data.jobs=data.jobs.filter(j=>j.id!==id);save();render()}}

function jobCostTotal(j){
  return (j&&Array.isArray(j.costs)?j.costs:[]).reduce((sum,c)=>sum+(parseFloat(c.valor)||0),0);
}
function addJobCost(id){
  const j=(data.jobs||[]).find(x=>x.id===id);
  if(!j) return;
  const nome=(prompt('Qual foi o custo desse job? Ex: Uber, alimentação, assistente, estacionamento')||'').trim();
  if(!nome) return;
  const valor=parseFloat((prompt('Valor do custo em R$')||'0').replace(',','.'));
  if(!valor || valor<=0){alert('Digite um valor válido.');return}
  if(!Array.isArray(j.costs)) j.costs=[];
  const costId=uid();
  let movId='';
  const also=confirm('Quer registrar esse custo também como uma saída no financeiro geral?');
  if(also){
    movId=uid();
    data.movs.unshift({
      id:movId,tipo:'gasto',nome:'SAN • '+j.cliente+' • '+nome,valor,
      cat:'🎬 SAN / Job',ym:nowMonth(),
      date:new Date().toLocaleDateString('pt-BR'),
      time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      jobId:j.id,jobCostId:costId
    });
  }
  j.costs.push({id:costId,nome,valor,movId,createdAt:new Date().toISOString()});
  save();render();
}
function delJobCost(jobId,costId){
  const j=(data.jobs||[]).find(x=>x.id===jobId);
  if(!j || !Array.isArray(j.costs)) return;
  const c=j.costs.find(x=>x.id===costId);
  if(!c) return;
  if(!confirm('Apagar este custo do job?')) return;
  if(c.movId) data.movs=(data.movs||[]).filter(m=>m.id!==c.movId);
  j.costs=j.costs.filter(x=>x.id!==costId);
  save();render();
}
function addWish(){
  const nome=wishNome.value.trim(), valor=parseFloat(wishValor.value), guardado=parseFloat(wishGuardado.value||0);
  if(!nome||!valor){alert('Preenche desejo e meta.');return}
  data.wishes.unshift({id:uid(),nome,valor,guardado});
  wishNome.value='';wishValor.value='';wishGuardado.value='';const fc=document.getElementById('formWishCard'); if(fc) fc.classList.remove('open');save();render()
}
function addWishMoney(id){
  const v=parseFloat(prompt('Quanto você vai adicionar nessa meta?')||0);
  if(v>0){let w=data.wishes.find(x=>x.id===id);w.guardado+=v;save();render()}
}
function delWish(id){if(confirm('Apagar desejo?')){data.wishes=data.wishes.filter(w=>w.id!==id);save();render()}}

function exportBackup(){
  const payload={
    app:'SAN Finance',
    version:'Alpha3-Planejamento-SANBusiness',
    exportedAt:new Date().toISOString(),
    storageKey:KEY,
    data:data
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const date=new Date().toISOString().slice(0,10);
  a.href=url;
  a.download='san-finance-backup-'+date+'.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

function importBackup(event){
  const file=event.target.files && event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(){
    try{
      const parsed=JSON.parse(reader.result);
      const imported=parsed.data || parsed;
      if(!imported || typeof imported!=='object') throw new Error('Arquivo vazio');
      if(!Array.isArray(imported.movs)) imported.movs=[];
      if(!Array.isArray(imported.debts)) imported.debts=[];
      if(!Array.isArray(imported.jobs)) imported.jobs=[];
      if(!Array.isArray(imported.wishes)) imported.wishes=[];
      if(!Array.isArray(imported.creditCards)) imported.creditCards=[];
      if(!Array.isArray(imported.creditPurchases)) imported.creditPurchases=[];
      if(!Array.isArray(imported.creditInvoicePayments)) imported.creditInvoicePayments=[];
      if(confirm('Restaurar este backup? Isso vai substituir os dados atuais do app.')){
        data=repairData(imported);
        save();
        render();
        alert('Backup restaurado com sucesso.');
      }
    }catch(e){
      alert('Não consegui importar esse arquivo. Verifique se é um backup válido do SAN Finance.');
    }
    event.target.value='';
  };
  reader.readAsText(file);
}

function csvEscape(value){
  const s=String(value ?? '');
  return '"' + s.replace(/"/g,'""') + '"';
}
function exportCSV(){
  const rows=[];
  rows.push(['tipo','nome_descricao','valor','categoria_status','data','extra_1','extra_2','extra_3']);

  (data.movs||[]).forEach(m=>{
    rows.push([
      m.tipo==='entrada'?'entrada':'gasto',
      m.nome||'',
      m.valor||0,
      m.cat||'',
      m.date||'',
      m.time||'',
      '',
      ''
    ]);
  });

  (data.debts||[]).forEach(d=>{
    rows.push([
      d.fixa?'conta_fixa':'divida',
      d.nome||'',
      d.valor||0,
      (d.pagos||[]).length + '/' + (d.meses||1) + ' pagos',
      d.inicio||'',
      'vencimento dia ' + (d.dia||10),
      'meses ' + (d.meses||1),
      'restante ' + (((d.meses||1)-(d.pagos||[]).length)*(parseFloat(d.valor)||0))
    ]);
  });

  (data.jobs||[]).forEach(j=>{
    rows.push([
      'job',
      j.cliente||'',
      j.valor||0,
      j.status||'',
      j.dataEvento||'',
      j.obs||'',
      '',
      ''
    ]);
  });

  (data.wishes||[]).forEach(w=>{
    rows.push([
      'meta',
      w.nome||'',
      w.valor||0,
      'guardado ' + (w.guardado||0),
      '',
      'progresso ' + Math.round(((w.guardado||0)/(w.valor||1))*100) + '%',
      '',
      ''
    ]);
  });

  (data.creditCards||[]).forEach(c=>{
    rows.push([
      'cartao',
      c.nome||'',
      c.limite||0,
      'fechamento ' + (c.fechamento||''),
      '',
      'vencimento ' + (c.vencimento||''),
      '',
      ''
    ]);
  });

  (data.creditPurchases||[]).forEach(cp=>{
    rows.push([
      'compra_cartao',
      cp.nome||'',
      cp.valor||0,
      cp.cardName||cp.cardId||'',
      cp.data||'',
      'parcelas ' + (cp.parcelas||1),
      cp.cat||'',
      ''
    ]);
  });

  const csv=rows.map(r=>r.map(csvEscape).join(';')).join('\n');
  const blob=new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const date=new Date().toISOString().slice(0,10);
  a.href=url;
  a.download='san-finance-dados-'+date+'.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

function resetAll(){
  const first=confirm('Tem certeza que deseja limpar TODOS os dados do SAN Finance? Essa ação não poderá ser desfeita.');
  if(!first) return;
  const second=confirm('Última confirmação: você já baixou um backup? Clique em OK para apagar tudo.');
  if(!second) return;
  localStorage.removeItem(KEY);
  data=JSON.parse(JSON.stringify(defaultData));
  save();
  render();
  show('home', document.querySelector('.tab'));
  alert('Dados apagados com sucesso.');
}
function dueDateLabel(d, idx){
  const ym=addMonths(d.inicio, idx);
  const [y,m]=ym.split('-').map(Number);
  const last=new Date(y,m,0).getDate();
  const day=Math.min(d.dia||10,last);
  return String(day).padStart(2,'0')+'/'+String(m).padStart(2,'0')+'/'+y;
}
function nextDebtDue(d){
  const next = Math.min(d.pagos.length, d.meses-1);
  return dueDateLabel(d,next);
}
function debtStatusText(d){
  const left=d.meses-d.pagos.length;
  if(left<=0) return 'quitada';
  const next=Math.min(d.pagos.length,d.meses-1);
  return 'próx. pagamento: '+dueDateLabel(d,next);
}
function editDebtDay(id){
  const d=data.debts.find(x=>x.id===id);
  if(!d)return;
  const novo=parseInt(prompt('Qual dia do mês essa conta vence?', d.dia||10));
  if(!novo || novo<1 || novo>31){alert('Digite um dia entre 1 e 31.');return}
  d.dia=novo; save(); render();
}

function creditMonthAmount(cardId, month){
  return (data.creditPurchases||[])
    .filter(p=>p.cardId===cardId)
    .reduce((sum,p)=>{
      const parcelas = parseInt(p.parcelas)||1;
      const valorParcela = (parseFloat(p.valor)||0) / parcelas;
      for(let i=0;i<parcelas;i++){
        if(addMonths(p.inicio,i)===month) return sum + valorParcela;
      }
      return sum;
    },0);
}
function creditTotalUsed(cardId){
  return (data.creditPurchases||[])
    .filter(p=>p.cardId===cardId)
    .reduce((sum,p)=>sum+(parseFloat(p.valor)||0),0);
}
function monthsBetween(a,b){
  const [ay,am]=String(a).split('-').map(Number);
  const [by,bm]=String(b).split('-').map(Number);
  return (by-ay)*12+(bm-am);
}
function creditOutstanding(cardId, month=nowMonth()){
  return (data.creditPurchases||[]).filter(p=>p.cardId===cardId).reduce((sum,p)=>{
    const parcelas=Math.max(1,parseInt(p.parcelas)||1);
    const valor=parseFloat(p.valor)||0;
    const start=p.inicio||nowMonth();
    const elapsed=monthsBetween(start,month);
    const paidCount=Math.max(0,Math.min(parcelas,elapsed));
    const remaining=Math.max(0,parcelas-paidCount);
    return sum+(valor/parcelas)*remaining;
  },0);
}
function invoicePayment(cardId,month){
  return (data.creditInvoicePayments||[]).find(p=>p.cardId===cardId && p.ym===month);
}
function invoiceIsPaid(cardId,month){return !!invoicePayment(cardId,month)}
function payCreditInvoice(cardId,month=selectedMonth){
  const card=(data.creditCards||[]).find(c=>c.id===cardId);
  if(!card) return;
  const invoice=creditMonthAmount(cardId,month);
  if(invoice<=0){alert('Não há fatura para este mês.');return}
  if(invoiceIsPaid(cardId,month)){alert('Essa fatura já está marcada como paga.');return}
  if(!confirm(`Marcar a fatura ${card.nome} de ${fmt(invoice)} como paga e registrar como saída?`)) return;
  const movId=uid();
  const [y,m]=month.split('-').map(Number);
  const last=new Date(y,m,0).getDate();
  const day=Math.min(parseInt(card.vencimento)||10,last);
  const date=String(day).padStart(2,'0')+'/'+String(m).padStart(2,'0')+'/'+y;
  data.movs.unshift({
    id:movId,tipo:'gasto',nome:'Fatura '+card.nome,valor:invoice,cat:'💳 Cartão',
    ym:month,date,time:'',cardId,invoiceMonth:month
  });
  data.creditInvoicePayments.unshift({id:uid(),cardId,ym:month,valor:invoice,movId,paidAt:new Date().toISOString()});
  save();render();
}
function undoCreditInvoice(cardId,month=selectedMonth){
  const p=invoicePayment(cardId,month);
  if(!p) return;
  if(!confirm('Desmarcar esta fatura como paga? A saída criada também será removida.')) return;
  if(p.movId) data.movs=(data.movs||[]).filter(m=>m.id!==p.movId);
  data.creditInvoicePayments=(data.creditInvoicePayments||[]).filter(x=>x.id!==p.id);
  save();render();
}
function addCreditCard(){
  const nome=cardNome.value.trim();
  const limite=parseFloat(cardLimite.value);
  let venc=parseInt(cardVencimento.value);
  let fech=parseInt(cardFechamento.value);
  if(!nome||!limite){alert('Preenche nome e limite do cartão.');return}
  if(!venc||venc<1||venc>31) venc=10;
  if(!fech||fech<1||fech>31) fech=1;
  if(!data.creditCards) data.creditCards=[];
  data.creditCards.unshift({id:uid(),nome,limite,vencimento:venc,fechamento:fech});
  cardNome.value='';cardLimite.value='';cardVencimento.value='';cardFechamento.value='';
  const fc=document.getElementById('formCardCadastro'); if(fc) fc.classList.remove('open');
  save();render();
}
function addCreditPurchase(){
  if(!data.creditCards||data.creditCards.length===0){alert('Cadastre um cartão primeiro.');return}
  const cardId=purchaseCard.value;
  const nome=purchaseNome.value.trim();
  const valor=parseFloat(purchaseValor.value);
  const parcelas=parseInt(purchaseParcelas.value)||1;
  const inicio=purchaseInicio.value||nowMonth();
  if(!nome||!valor){alert('Preenche nome e valor da compra.');return}
  if(!data.creditPurchases) data.creditPurchases=[];
  data.creditPurchases.unshift({id:uid(),cardId,nome,valor,parcelas,inicio,pagas:[]});
  purchaseNome.value='';purchaseValor.value='';purchaseParcelas.value='';purchaseInicio.value=nowMonth();
  const fc=document.getElementById('formCompraCartao'); if(fc) fc.classList.remove('open');
  save();render();
}
function delCreditCard(id){
  if(!confirm('Apagar cartão e compras vinculadas a ele?')) return;
  const payIds=(data.creditInvoicePayments||[]).filter(p=>p.cardId===id).map(p=>p.movId).filter(Boolean);
  data.movs=(data.movs||[]).filter(m=>!payIds.includes(m.id));
  data.creditInvoicePayments=(data.creditInvoicePayments||[]).filter(p=>p.cardId!==id);
  data.creditCards=(data.creditCards||[]).filter(c=>c.id!==id);
  data.creditPurchases=(data.creditPurchases||[]).filter(p=>p.cardId!==id);
  save();render();
}
function delCreditPurchase(id){
  if(!confirm('Apagar essa compra do cartão?')) return;
  data.creditPurchases=(data.creditPurchases||[]).filter(p=>p.id!==id);
  save();render();
}
function cardStatus(card,month=selectedMonth){
  const invoice=creditMonthAmount(card.id,month);
  const used=creditOutstanding(card.id,nowMonth());
  const available=(parseFloat(card.limite)||0)-used;
  const paid=invoiceIsPaid(card.id,month);
  return {invoice,used,available,paid};
}
function renderCreditCards(){
  if(!data.creditCards) data.creditCards=[];
  if(!data.creditPurchases) data.creditPurchases=[];
  if(!data.creditInvoicePayments) data.creditInvoicePayments=[];
  if(typeof purchaseInicio!=='undefined' && !purchaseInicio.value) purchaseInicio.value=selectedMonth||nowMonth();

  if(typeof purchaseCard!=='undefined'){
    purchaseCard.innerHTML=data.creditCards.length
      ? data.creditCards.map(c=>`<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('')
      : '<option value="">Cadastre um cartão primeiro</option>';
  }

  const totalInvoice=data.creditCards.reduce((a,c)=>a+cardStatus(c,selectedMonth).invoice,0);
  const totalUsed=data.creditCards.reduce((a,c)=>a+cardStatus(c,selectedMonth).used,0);
  const totalLimit=data.creditCards.reduce((a,c)=>a+(parseFloat(c.limite)||0),0);
  const totalAvailable=totalLimit-totalUsed;

  if(typeof cardInvoice!=='undefined'){
    cardInvoice.textContent=fmt(totalInvoice);
    cardUsed.textContent=fmt(totalUsed);
    cardAvailable.textContent=fmt(totalAvailable);
  }
  if(typeof quickCardInvoice!=='undefined'){
    quickCardInvoice.textContent=fmt(totalInvoice);
    quickCardUsed.textContent=fmt(totalUsed);
    quickCardAvailable.textContent=fmt(totalAvailable);
  }

  if(typeof cardList!=='undefined'){
    cardList.innerHTML=data.creditCards.map(c=>{
      const s=cardStatus(c,selectedMonth);
      const pct=c.limite?Math.min(100,Math.max(0,Math.round((s.used/c.limite)*100))):0;
      const payBtn=s.invoice>0
        ? (s.paid
          ? `<button class="ghost" onclick="undoCreditInvoice('${c.id}','${selectedMonth}')">Desmarcar pagamento</button>`
          : `<button class="ghost" onclick="payCreditInvoice('${c.id}','${selectedMonth}')">Pagar fatura</button>`)
        : '';
      return `<div class="card">
        <div class="debtTop">
          <div>
            <div class="debtName">💳 ${escapeHtml(c.nome)}</div>
            <div class="debtMeta">Vence dia ${String(c.vencimento||10).padStart(2,'0')} • fecha dia ${String(c.fechamento||1).padStart(2,'0')}</div>
            <div class="debtMeta">Fatura ${monthName(selectedMonth)}: ${fmt(s.invoice)} • limite comprometido: ${fmt(s.used)}</div>
            <span class="invoiceTag ${s.paid?'paid':'open'}">${s.paid?'✓ FATURA PAGA':'• FATURA '+(s.invoice>0?'ABERTA':'SEM LANÇAMENTOS')}</span>
          </div>
          <div class="val ${s.available<0?'red':'green'}">${fmt(s.available)}</div>
        </div>
        <div class="progressBg" style="margin-top:12px"><div class="progressFill" style="width:${pct}%;background:${pct<70?'#35f477':pct<90?'#e5c36a':'#ff5265'}"></div></div>
        <div class="cardActionRow">${payBtn}<button class="ghost danger" onclick="delCreditCard('${c.id}')">Apagar cartão</button></div>
      </div>`
    }).join('')||'<div class="empty">Nenhum cartão cadastrado ainda.</div>';
  }

  if(typeof purchaseList!=='undefined'){
    const purchases=[...(data.creditPurchases||[])].sort((a,b)=>String(b.inicio||'').localeCompare(String(a.inicio||'')));
    purchaseList.innerHTML=purchases.map(p=>{
      const card=data.creditCards.find(c=>c.id===p.cardId);
      const parcelas=Math.max(1,parseInt(p.parcelas)||1);
      const valorParcela=(parseFloat(p.valor)||0)/parcelas;
      const fim=addMonths(p.inicio,parcelas-1);
      const active=monthsBetween(p.inicio,selectedMonth)>=0 && monthsBetween(p.inicio,selectedMonth)<parcelas;
      const installment=active?monthsBetween(p.inicio,selectedMonth)+1:null;
      return `<div class="item" style="${active?'':'opacity:.65'}">
        <div class="itemLeft">
          <div class="icon">🧾</div>
          <div>
            <div class="name">${escapeHtml(p.nome)}</div>
            <div class="sub">${card?escapeHtml(card.nome):'Cartão apagado'} • ${parcelas}x de ${fmt(valorParcela)} • ${monthName(p.inicio)} até ${monthName(fim)}${active?' • parcela '+installment+'/'+parcelas:''}</div>
          </div>
        </div>
        <div>
          <div class="val ${active?'yellow':''}">${active?fmt(valorParcela):fmt(p.valor)}</div>
          <div class="smallBtns"><button class="ghost danger" onclick="delCreditPurchase('${p.id}')">X</button></div>
        </div>
      </div>`
    }).join('')||'<div class="empty">Nenhuma compra parcelada cadastrada.</div>';
  }
}


function openMovModal(){
  const m=document.getElementById('movModal');
  if(m){m.classList.add('open');setTimeout(()=>{const i=document.getElementById('movNome'); if(i)i.focus()},80)}
}
function closeMovModal(){const m=document.getElementById('movModal'); if(m)m.classList.remove('open')}

function activeSectionId(){const a=document.querySelector('.section.active');return a?a.id:'home'}
function fabOptions(){
  const id=activeSectionId();
  if(id==='home') return [{label:'Novo movimento',action:()=>openMovModal()}];
  if(id==='dividas') return [{label:'Nova dívida/conta',form:'formDebtCard'}];
  if(id==='cartao') return [{label:'Novo cartão',form:'formCardCadastro'},{label:'Nova compra',form:'formCompraCartao'}];
  if(id==='video') return [{label:'Novo job',form:'formJobCard'}];
  if(id==='desejos') return [{label:'Novo desejo/meta',form:'formWishCard'}];
  if(id==='config') return [];
  return [];
}
function updateFab(){
  const wrap=document.getElementById('fabWrap'), menu=document.getElementById('fabMenu');
  if(!wrap||!menu) return;
  const opts=fabOptions();
  wrap.style.display=opts.length?'flex':'none';
  menu.innerHTML=opts.map((o,i)=>`<button class="fabItem" onclick="fabAction(${i})">${o.label}</button>`).join('');
}
function toggleFab(){const w=document.getElementById('fabWrap'); if(w) w.classList.toggle('open')}
function closeFab(){const w=document.getElementById('fabWrap'); if(w) w.classList.remove('open')}
function fabAction(i){
  const opt=fabOptions()[i]; if(!opt) return; closeFab();
  if(opt.action){opt.action();return}
  document.querySelectorAll('.section.active .formCard').forEach(c=>{if(c.id!==opt.form)c.classList.remove('open')});
  const el=document.getElementById(opt.form);
  if(el){el.classList.add('open');setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),50)}
}
function toggleFormCard(id){
  const el=document.getElementById(id);
  if(el) el.classList.toggle('open');
}

function proportionalHeightDashboard(value,max){
  if(!max || max<=0) return 8;
  return Math.max(8, Math.round((value/max)*135));
}

function dateISOForMonthDay(month,day){
  const [y,m]=String(month).split('-').map(Number);
  const last=new Date(y,m,0).getDate();
  const d=Math.min(Math.max(1,parseInt(day)||1),last);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function prettyISO(iso){
  if(!iso) return '';
  const [y,m,d]=iso.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
}
function debtPaidInMonth(d,month){
  if(d.fixa) return (d.paidMonths||[]).includes(month);
  const idx=debtIndexForMonth(d,month);
  return idx>=0 && (d.pagos||[]).includes(idx);
}
function financeEvents(month=selectedMonth){
  const events=[];
  currentMonthDebts(month).forEach(d=>{
    events.push({
      type:'debt',icon:'▦',title:d.nome||'Conta',date:dateISOForMonthDay(month,d.dia||10),
      value:parseFloat(d.valor)||0,paid:debtPaidInMonth(d,month),
      meta:d.fixa?'Conta fixa':'Parcela'
    });
  });
  (data.creditCards||[]).forEach(c=>{
    const amount=creditMonthAmount(c.id,month);
    if(amount>0){
      events.push({
        type:'cardevt',icon:'💳',title:'Fatura '+(c.nome||'Cartão'),
        date:dateISOForMonthDay(month,c.vencimento||10),value:amount,
        paid:invoiceIsPaid(c.id,month),meta:'Cartão'
      });
    }
  });
  jobsInMonth(month).forEach(j=>{
    if(!j.dataEvento) return;
    events.push({
      type:'jobevt',icon:'🎬',title:j.cliente||'Job',date:j.dataEvento,
      value:parseFloat(j.valor)||0,paid:isJobPaid(j),meta:jobStatusLabel(j.status)
    });
  });
  return events.sort((a,b)=>String(a.date).localeCompare(String(b.date)) || a.type.localeCompare(b.type));
}
function projectionForMonth(month=selectedMonth){
  const t=totals(month);
  const openDebt=Math.max(0,currentMonthDebtTotal(month)-currentMonthDebtPaid(month));
  const openCard=(data.creditCards||[]).reduce((sum,c)=>{
    const invoice=creditMonthAmount(c.id,month);
    return sum+(invoiceIsPaid(c.id,month)?0:invoice);
  },0);
  const pendingJobs=jobsInMonth(month).filter(j=>!isJobPaid(j)).reduce((s,j)=>s+(parseFloat(j.valor)||0),0);
  const open=openDebt+openCard;
  return {now:t.saldo,openDebt,openCard,open,pendingJobs,safe:t.saldo-open,withJobs:t.saldo-open+pendingJobs};
}
function renderFinanceCalendar(){
  const cal=document.getElementById('financeCalendar');
  const list=document.getElementById('agendaList');
  if(!cal||!list) return;
  const month=selectedMonth;
  const events=financeEvents(month);
  const [y,m]=month.split('-').map(Number);
  const first=new Date(y,m-1,1);
  const days=new Date(y,m,0).getDate();
  const start=(first.getDay()+6)%7; // segunda = 0
  const heads=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
  let out=heads.map(h=>`<div class="calendarHead">${h}</div>`).join('');
  for(let i=0;i<start;i++) out+='<div class="calDay mutedDay"></div>';
  const todayISO=new Date().toISOString().slice(0,10);
  for(let day=1;day<=days;day++){
    const iso=dateISOForMonthDay(month,day);
    const dayEvents=events.filter(e=>e.date===iso);
    out+=`<div class="calDay ${iso===todayISO?'today':''}">
      <div class="calNum">${day}</div>
      <div class="calDots">${dayEvents.slice(0,5).map(e=>`<span class="calDot ${e.type}" title="${escapeHtml(e.title)}"></span>`).join('')}</div>
    </div>`;
  }
  cal.innerHTML=out;
  const futureish=events.filter(e=>!e.paid);
  list.innerHTML=(futureish.length?futureish:events).slice(0,8).map(e=>`
    <div class="agendaItem" style="${e.paid?'opacity:.55':''}">
      <div class="agendaLeft">
        <div class="agendaIcon">${e.icon}</div>
        <div class="agendaText"><b>${escapeHtml(e.title)}</b><span>${prettyISO(e.date)} • ${escapeHtml(e.meta)}${e.paid?' • concluído':''}</span></div>
      </div>
      <div class="agendaValue ${e.type==='debt'?'yellow':e.type==='cardevt'?'red':'blue'}">${fmt(e.value)}</div>
    </div>`).join('')||'<div class="empty">Nada agendado para este mês.</div>';
}
function icsEscape(v){
  return String(v||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}
function exportCalendarICS(){
  const events=financeEvents(selectedMonth).filter(e=>!e.paid || e.type==='jobevt');
  if(!events.length){alert('Não há compromissos para exportar neste mês.');return}
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SAN Finance//Alpha3//PT-BR','CALSCALE:GREGORIAN'];
  events.forEach((e,i)=>{
    const compact=e.date.replace(/-/g,'');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:'+icsEscape('san-'+selectedMonth+'-'+i+'-'+uid()));
    lines.push('DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'));
    lines.push('DTSTART;VALUE=DATE:'+compact);
    lines.push('DTEND;VALUE=DATE:'+compact);
    lines.push('SUMMARY:'+icsEscape(e.title+' • SAN Finance'));
    lines.push('DESCRIPTION:'+icsEscape(e.meta+' • '+fmt(e.value)));
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:'+icsEscape('Amanhã: '+e.title));
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='san-finance-agenda-'+selectedMonth+'.ics';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),800);
}

function render(){
  if(!data.creditCards) data.creditCards=[]; if(!data.creditPurchases) data.creditPurchases=[];
  monthLabel.textContent=monthLabelSmart(selectedMonth);
  syncMonthPicker();
  const t=totals(selectedMonth);
  const proj=projectionForMonth(selectedMonth);
  if(typeof projNow!=='undefined'){
    projNow.textContent=fmt(proj.now);
    projOpen.textContent=fmt(proj.open);
    projSafe.textContent=fmt(proj.safe);
    projWithJobs.textContent=fmt(proj.withJobs);
    projSafe.className=proj.safe>=0?'green':'red';
    projNote.textContent=`Contas abertas: ${fmt(proj.openDebt)} • faturas abertas: ${fmt(proj.openCard)} • jobs a receber: ${fmt(proj.pendingJobs)}.`;
  }

  if(typeof quickDebtMonth!=='undefined'){
    const debtMonth=currentMonthDebtTotal(selectedMonth);
    const debtPaid=currentMonthDebtPaid(selectedMonth);
    quickDebtMonth.textContent=fmt(debtMonth);
    quickDebtPaid.textContent=fmt(debtPaid);
    quickDebtOpen.textContent=fmt(Math.max(0,debtMonth-debtPaid));
  }

  saldo.textContent=fmt(t.saldo); saldo.className='bigMoney '+(t.saldo>500?'ok':t.saldo>200?'warn':'bad');
  totIn.textContent=fmt(t.entrada); totOut.textContent=fmt(t.saida); if(typeof saldoHero!=='undefined') saldoHero.textContent=fmt(t.totalDividas||0);
  const baseEntrada=Math.max(1,t.entrada||data.salario||1);
  const pct=Math.min(100,Math.round((t.saida/baseEntrada)*100));
  const sobraPct=Math.max(0,Math.round((t.saldo/baseEntrada)*100));
  pctText.textContent=pct+'%';
  progress.style.width=pct+'%'; progress.style.background=pct<60?'#00f06a':pct<85?'#f5c84b':'#ff4d5e';
  if(typeof progressFooter!=='undefined') progressFooter.textContent=pct<60?'Seu mês está saudável. Você está gastando menos do que entrou.':pct<85?'Atenção: seus gastos já consumiram boa parte das entradas.':'Cuidado: o mês está pesado. Revise gastos e parcelas.';
  if(typeof homeStatus!=='undefined') homeStatus.textContent=t.saldo>=0?`Você está positivo este mês. Sobrou ${fmt(t.saldo)} até agora (${sobraPct}% das entradas).`:`Você está negativo este mês em ${fmt(Math.abs(t.saldo))}.`;
  const dicas=['Controle não é prisão. É direção.','Seu dinheiro precisa trabalhar para sua liberdade.','Uma parcela marcada como paga é um passo a menos na dívida.','Todo freela precisa virar parte da sua organização.','Antes de comprar, pergunta: isso aproxima ou afasta da minha meta?'];
  dailyQuote.textContent=dicas[Math.floor(Math.random()*dicas.length)];
  lastList.innerHTML=movsInMonth(selectedMonth).slice(0,8).map(m=>`<div class="item">
    <div class="itemLeft">
      <div class="icon">${String(m.cat||'🎯').split(' ')[0]}</div>
      <div>
        <div class="name">${escapeHtml(m.nome||'Sem nome')}</div>
        <div class="sub">${m.date||''} ${m.time?'· '+m.time:''}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <div class="val ${m.tipo==='entrada'?'green':'red'}">${m.tipo==='entrada'?'+':'-'}${fmt(parseFloat(m.valor)||0)}</div>
      <button class="ghost danger" style="padding:7px 9px" onclick="delMov('${m.id}')">×</button>
    </div>
  </div>`).join('')||'<div class="empty">Nenhum lançamento ainda.</div>';
  const month=selectedMonth;
  const orderedDebts=[...currentMonthDebts(month), ...(data.debts||[]).filter(d=>!debtAppliesInMonth(d,month))];
  debtList.innerHTML=orderedDebts.map(d=>{
    if(d.dia===undefined) d.dia=10;
    if(d.fixa===undefined) d.fixa=false;
    const idxMes=d.fixa?-1:debtIndexForMonth(d,month);
    const isCurrent=debtAppliesInMonth(d,month);
    const paid=(d.pagos||[]).length;
    const left=d.fixa ? 0 : Math.max(0,(parseInt(d.meses)||1)-paid);
    const rest=d.fixa ? 0 : left*(parseFloat(d.valor)||0);
    const isPaidThisMonth=debtPaidInMonth(d,month);
    let dots='';
    if(d.fixa){
      const venc=prettyISO(dateISOForMonthDay(month,d.dia||10));
      dots=`<button class="dot ${isPaidThisMonth?'paid':'now'}" title="${venc}" onclick="toggleDebt('${d.id}',0)">M</button>`;
    }else{
      for(let i=0;i<d.meses;i++){
        const venc=dueDateLabel(d,i);
        dots+=`<button class="dot ${d.pagos.includes(i)?'paid':i===idxMes?'now':''}" title="${venc}" onclick="toggleDebt('${d.id}',${i})">${i+1}</button>`
      }
    }
    return `<div class="card debtCard" style="${isCurrent?'':'opacity:.55'}">
      <div class="debtTop">
        <div>
          <div class="debtName">${d.nome}</div>
          <div class="debtMeta">${isCurrent ? 'Conta deste mês • '+(isPaidThisMonth?'paga':'pendente') : 'Não cai neste mês'}</div>
          <div class="debtMeta">${d.fixa ? 'Conta fixa mensal • histórico pago em '+((d.paidMonths||[]).length)+' mês(es)' : paid+'/'+d.meses+' meses pagos • faltam '+left+' • restante total '+fmt(rest)}</div>
          <div class="debtMeta">📅 Vence todo dia ${String(d.dia||10).padStart(2,'0')} ${isCurrent && !d.fixa ? '• parcela '+(idxMes+1)+'/'+d.meses : ''}</div>
        </div>
        <div class="val ${isPaidThisMonth?'green':'yellow'}">${isCurrent?fmt(d.valor):'—'}</div>
      </div>
      <div class="progressBg" style="margin-top:12px"><div class="progressFill" style="width:${d.fixa?(isPaidThisMonth?100:0):Math.round((paid/Math.max(1,d.meses))*100)}%;background:#00f06a"></div></div>
      <div class="monthDots">${dots}</div>
      <div class="debtActions">
        <button class="ghost" ${isCurrent?'':d.fixa?'disabled style="opacity:.4"':''} onclick="toggleDebt('${d.id}',${d.fixa?0:(idxMes>=0?idxMes:(paid<d.meses?paid:d.meses-1))})">${isCurrent?(isPaidThisMonth?'Desmarcar pagamento':'Marcar pago do mês'):(d.fixa?'Ainda não iniciou':'Marcar próxima parcela')}</button>
        <button class="ghost" onclick="editDebtDay('${d.id}')">Editar vencimento</button>
        <button class="ghost danger" onclick="delDebt('${d.id}')">Apagar</button>
      </div>
    </div>`
  }).join('')||'<div class="empty">Nenhuma dívida cadastrada.</div>';
    const monthJobs=jobsInMonth(selectedMonth);
    const paidJobs=monthJobs.filter(j=>isJobPaid(j)).reduce((a,b)=>a+(parseFloat(b.valor)||0),0);
    const pendJobs=monthJobs.filter(j=>!isJobPaid(j)).reduce((a,b)=>a+(parseFloat(b.valor)||0),0);
    const jobsRevenue=paidJobs+pendJobs;
    const jobsCosts=monthJobs.reduce((sum,j)=>sum+jobCostTotal(j),0);
    const jobsProfit=jobsRevenue-jobsCosts;
  jobPaid.textContent=fmt(paidJobs); jobPend.textContent=fmt(pendJobs); jobQtd.textContent=monthJobs.length;
  if(typeof bizRevenue!=='undefined'){
    bizRevenue.textContent=fmt(jobsRevenue);
    bizReceived.textContent=fmt(paidJobs);
    bizCosts.textContent=fmt(jobsCosts);
    bizProfit.textContent=fmt(jobsProfit);
    bizProfit.className=jobsProfit>=0?'green':'red';
    const avg=monthJobs.length?jobsRevenue/monthJobs.length:0;
    bizHint.textContent=monthJobs.length?`Ticket médio: ${fmt(avg)} • margem contratada: ${jobsRevenue>0?Math.round((jobsProfit/jobsRevenue)*100):0}%.`:'Cadastre jobs e custos para acompanhar o lucro real da SAN.';
  }
  if(typeof quickJobPaid!=='undefined'){
    quickJobPaid.textContent=fmt(paidJobs);
    quickJobPend.textContent=fmt(pendJobs);
    const next=(sortJobsByEventDate(monthJobs).find(j=>!isJobPaid(j) && j.dataEvento)||null);
    quickNextJob.textContent=next ? (next.cliente.length>12?next.cliente.slice(0,12)+'…':next.cliente) : '—';
  }
  const sortedJobs=sortJobsByEventDate(monthJobs);
  jobList.innerHTML=sortedJobs.length?`<div class="jobBoard">${sortedJobs.map(j=>{
    const idx=jobIndex(j.status), st=JOB_FLOW[idx], pct=Math.round((idx/(JOB_FLOW.length-1))*100);
    const steps=JOB_FLOW.map((x,i)=>`<div class="jobStep ${i<=idx?'done':''}" title="${x.label}">${i+1}</div>`).join('');
    const costs=Array.isArray(j.costs)?j.costs:[];
    const costTotal=jobCostTotal(j);
    const profit=(parseFloat(j.valor)||0)-costTotal;
    const costHtml=costs.length?`<div class="jobCostList">${costs.map(c=>`<div class="jobCost"><span>${escapeHtml(c.nome||'Custo')}</span><span class="jobCostActions"><b>-${fmt(c.valor)}</b><button onclick="delJobCost('${j.id}','${c.id}')">×</button></span></div>`).join('')}</div>`:'';
    return `<div class="jobCard">
      <div class="jobTop">
        <div>
          <div class="jobClient">${escapeHtml(j.cliente)}</div>
          <div class="statusBadge" style="background:${st.color}22;border-color:${st.color}77;color:${st.color}">${st.label}</div>
          <div class="jobMeta">${jobEventInfo(j.dataEvento)}${j.obs?' • '+escapeHtml(j.obs):''}</div>
        </div>
        <div style="text-align:right">
          <div class="jobValue ${isJobPaid(j)?'green':'yellow'}">${fmt(j.valor)}</div>
          <div class="debtMeta">lucro ${fmt(profit)}</div>
        </div>
      </div>
      <div class="jobProgress"><div class="jobProgressFill" style="width:${pct}%;background:${st.color}"></div></div>
      <div class="jobSteps">${steps}</div>
      ${costHtml}
      <div class="jobActions">
        <select onchange="updateJob('${j.id}',this.value)">${jobStatusOptions(j.status)}</select>
        <button class="ghost" onclick="addJobCost('${j.id}')">+ Custo</button>
        <button class="ghost danger" onclick="delJob('${j.id}')">Apagar</button>
      </div>
    </div>`
  }).join('')}</div>`:'<div class="empty">Nenhum job cadastrado ainda.</div>';
  const bars=[['Entrou',t.entrada],['Saiu',t.saida],['Jobs',paidJobs+pendJobs],['Dívidas',t.totalDividas]];
  const max=Math.max(...bars.map(b=>b[1]),1);
  chart.innerHTML=bars.map(b=>`<div class="barWrap"><div class="bar" style="height:${proportionalHeightDashboard(b[1],max)}px"></div><div class="barLabel">${b[0]}</div><div class="barLabel">${fmt(b[1])}</div></div>`).join('');
  const debtRestante=(data.debts||[]).filter(d=>!d.fixa).reduce((a,d)=>a+Math.max(0,(parseInt(d.meses)||1)-(d.pagos||[]).length)*(parseFloat(d.valor)||0),0);
  const wishGuardado=data.wishes.reduce((a,w)=>a+w.guardado,0);
  const jobsTotal=paidJobs+pendJobs;
  dashSaldo.textContent=fmt(t.saldo); dashSaida.textContent=fmt(t.saida); dashDebt.textContent=fmt(debtRestante); dashWish.textContent=fmt(wishGuardado);
  const score=Math.max(0,Math.min(100,Math.round(100-(t.saida/Math.max(t.entrada,1))*100)));
  dashScore.textContent=score+'%';
  dashScoreBar.style.width=score+'%';
  const scoreColor=score>=55?'#35f477':score>=25?'#e5c36a':'#ff5265';
  dashScoreBar.style.background=scoreColor;
  scoreCircle.style.background=`conic-gradient(${scoreColor} 0deg, ${scoreColor} ${score*3.6}deg, rgba(255,255,255,.10) ${score*3.6}deg 360deg)`;
  let statusMsg=score>=55?'Seu mês está respirando. Mantém o controle.':score>=25?'Atenção: seu dinheiro está ficando apertado.':'Alerta: segura gastos novos e prioriza quitar contas.';
  let debtMsg=debtRestante>0?`Você ainda tem ${fmt(debtRestante)} em dívidas futuras.`:'Você não tem dívida futura cadastrada.';
  let jobMsg=jobsTotal>0?`Sua área videomaker tem ${fmt(jobsTotal)} em jobs cadastrados.`:'Cadastre seus jobs para enxergar sua renda de videomaker.';
  dashInsights.innerHTML=`<div class="insight"><div class="insightIcon">🎬</div><div class="insightText"><b>Status:</b> ${statusMsg}</div></div><div class="insight"><div class="insightIcon">💳</div><div class="insightText"><b>Dívidas:</b> ${debtMsg}</div></div><div class="insight"><div class="insightIcon">📱</div><div class="insightText"><b>Jobs:</b> ${jobMsg}</div></div>`;
  renderFinanceCalendar();
  renderCreditCards();
  if(typeof quickWishCount!=='undefined'){
    const totalWish=(data.wishes||[]).reduce((a,w)=>a+(parseFloat(w.valor)||0),0);
    const savedWish=(data.wishes||[]).reduce((a,w)=>a+(parseFloat(w.guardado)||0),0);
    quickWishCount.textContent=(data.wishes||[]).length;
    quickWishSaved.textContent=fmt(savedWish);
    quickWishLeft.textContent=fmt(Math.max(0,totalWish-savedWish));
  }
  wishList.innerHTML=data.wishes.map(w=>{
    const pct=Math.min(100,Math.round((w.guardado/w.valor)*100));
    return `<div class="card"><div class="wishImg">✦</div><div class="debtTop" style="margin-top:12px"><div><div class="debtName">${w.nome}</div><div class="debtMeta">${fmt(w.guardado)} de ${fmt(w.valor)} • ${pct}%</div></div></div><div class="progressBg" style="margin-top:12px"><div class="progressFill" style="width:${pct}%;background:#fff"></div></div><div class="smallBtns"><button class="ghost" onclick="addWishMoney('${w.id}')">Adicionar valor</button><button class="ghost danger" onclick="delWish('${w.id}')">Apagar</button></div></div>`
  }).join('')||'<div class="empty">Nenhum desejo cadastrado.</div>';
}
debtInicio.value=nowMonth(); toggleDebtType(); render(); updateFab();
