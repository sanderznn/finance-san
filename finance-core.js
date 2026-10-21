/* Monetary calculations are integer cents; no browser dependencies. */
(function(root){
  const cents=v=>Math.round(Number(v||0)*100);
  const amount=v=>cents(v)/100;
  const ym=d=>String(d||'').slice(0,7);
  const add=(m,n)=>{const [y,k]=m.split('-').map(Number);const d=new Date(y,k-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
  const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const paid=j=>String(j.status||'').toLowerCase()==='pago';
  const movMonth=m=>m.ym||(String(m.date||'').split('/').reverse().join('-').slice(0,7));
  const jobMonth=j=>j.paidMonth||ym(j.paidAt)||ym(j.dataEvento);
  function installment(p,i){const n=Math.max(1,Number(p.parcelas)||1),total=cents(p.valor);return (Math.floor(total/n)+(i<total%n?1:0))/100;}
  function invoice(d,id,m){return (d.creditPurchases||[]).filter(p=>p.cardId===id).reduce((s,p)=>{for(let i=0;i<p.parcelas;i++)if(add(p.inicio,i)===m)return s+cents(installment(p,i));return s;},0)/100;}
  function invoicePaid(d,id,m){return (d.creditInvoicePayments||[]).filter(p=>p.cardId===id&&p.ym===m).reduce((s,p)=>s+cents(p.valor),0)/100;}
  function invoiceOpen(d,id,m){return Math.max(0,amount(invoice(d,id,m)-invoicePaid(d,id,m)));}
  function used(d,id){const months=new Set();(d.creditPurchases||[]).filter(p=>p.cardId===id).forEach(p=>{for(let i=0;i<p.parcelas;i++)months.add(add(p.inicio,i));});return [...months].reduce((s,m)=>s+cents(invoiceOpen(d,id,m)),0)/100;}
  function debtPayments(d){const out=[];for(const x of d.debts||[]){const keys=x.fixa?(x.paidMonths||[]):(x.pagos||[]).map(i=>String(i));for(const key of keys){const due=x.fixa?key:add(x.inicio,Number(key));const record=(x.paymentRecords||{})[key];out.push({month:record?ym(record.date):due,value:record?record.value:x.valor});}}return out;}
  function totals(d,m){const movs=(d.movs||[]).filter(x=>movMonth(x)===m),jobs=(d.jobs||[]).filter(j=>paid(j)&&jobMonth(j)===m),payments=debtPayments(d);const sum=(xs,fn)=>xs.reduce((s,x)=>s+cents(fn(x)),0)/100;
    const entrada=sum(movs.filter(x=>x.tipo==='entrada'),x=>x.valor)+sum(jobs,x=>x.valor),gastos=sum(movs.filter(x=>x.tipo==='gasto'),x=>x.valor),dividasPagas=sum(payments.filter(x=>x.month===m),x=>x.value);
    const saldo=sum((d.movs||[]).filter(x=>movMonth(x)<=m),x=>x.tipo==='entrada'?x.valor:-x.valor)+sum((d.jobs||[]).filter(j=>paid(j)&&jobMonth(j)<=m),x=>x.valor)-sum(payments.filter(x=>x.month<=m),x=>x.value);
    return {entrada:amount(entrada),gastos,dividasPagas,saida:amount(gastos+dividasPagas),saldo:amount(saldo),resultado:amount(entrada-gastos-dividasPagas),jobsPagos:sum(jobs,x=>x.valor)};
  }
  function obligations(d,month){const rows=[];for(const x of d.debts||[]){if(x.fixa){if(month>=x.inicio)rows.push({kind:'debt',id:x.id,index:0,month,day:x.dia,name:x.nome,value:x.valor,paid:(x.paidMonths||[]).includes(month)});}else for(let i=0;i<x.meses;i++){const m=add(x.inicio,i);if(m<=month&&(!(x.pagos||[]).includes(i)||m===month))rows.push({kind:'debt',id:x.id,index:i,month:m,day:x.dia,name:x.nome,value:x.valor,paid:(x.pagos||[]).includes(i)});}}
    // Unpaid recurring bills stay visible after the month changes.
    for(const x of (d.debts||[]).filter(x=>x.fixa)){let m=x.inicio;for(let i=0;m<month&&i<1200;i++,m=add(m,1))if(!(x.paidMonths||[]).includes(m))rows.push({kind:'debt',id:x.id,index:0,month:m,day:x.dia,name:x.nome,value:x.valor,paid:false});}
    for(const c of d.creditCards||[]){const months=new Set([month]);for(const p of (d.creditPurchases||[]).filter(p=>p.cardId===c.id))for(let i=0;i<p.parcelas;i++){const m=add(p.inicio,i);if(m<=month)months.add(m);}for(const m of months){const total=invoice(d,c.id,m),open=invoiceOpen(d,c.id,m);if(total&&(m===month||open>0))rows.push({kind:'card',id:c.id,month:m,day:c.vencimento,name:'Fatura '+c.nome,value:open||total,paid:open===0});}}
    return rows.sort((a,b)=>(a.month+String(a.day).padStart(2,'0')).localeCompare(b.month+String(b.day).padStart(2,'0')));
  }
  root.Finance={cents,amount,add,localDate,installment,invoice,invoicePaid,invoiceOpen,used,totals,obligations,jobMonth};
})(typeof module==='object'?module.exports:globalThis);
