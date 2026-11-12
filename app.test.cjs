const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function app(raw,{savedStorage}={}){
 const nodes={};function node(id){
  if(nodes[id])return nodes[id];
  const n={id,value:'',innerHTML:'',textContent:'',className:'',style:{},options:[],files:[],attributes:{},setAttribute(k,v){this.attributes[k]=String(v)},getAttribute(k){return this.attributes[k]??null},appendChild(){},remove(){},click(){},focus(){},querySelector(){return null},querySelectorAll(){return []}};
  n.classList={add(token){n.className=[...new Set([...n.className.split(' ').filter(Boolean),token])].join(' ')},remove(token){n.className=n.className.split(' ').filter(x=>x!==token).join(' ')},contains(token){return n.className.split(' ').includes(token)},toggle(token){this.contains(token)?this.remove(token):this.add(token)}};
  return nodes[id]=n;
 }
 for(const m of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const n=node(m[1]);n.hidden=/\bhidden(?:[\s=>]|$)/.test(m[0]);n.className=m[0].match(/\bclass="([^"]*)"/)?.[1]||'';}
 const storage=new Map(savedStorage||[]);if(raw!==undefined)storage.set('sanFinancePro_v6_fixas',raw);
 const alerts=[],prompts=[],confirmations=[],downloads=[],readers=[],blobs=new Map();let serial=0;
 class Reader{readAsText(file){this.file=file;readers.push(this);if(!file.defer)this.finish()}finish(){if(this.file.error)this.onerror();else{this.result=this.file.content;this.onload()}}}
 const ctx={console,Date,Math,JSON,Number,String,Array,Object,Set,Map,RegExp,Blob,URL:{createObjectURL(blob){const url='blob:test-'+(++serial);blobs.set(url,blob);return url},revokeObjectURL(url){blobs.delete(url)}},FileReader:Reader,Promise,parseFloat,parseInt,confirm:()=>confirmations.length?confirmations.shift():true,prompt:()=>prompts.shift()??null,alert:m=>alerts.push(m),setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},navigator:{},document:{activeElement:null,body:node('body'),createElement:tag=>{const n=node('new-'+(++serial));n.click=()=>{if(tag==='a')downloads.push({name:n.download,blob:blobs.get(n.href)})};return n},getElementById:node,querySelector:s=>s==='.section.active'?node('home'):null,querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},...nodes};ctx.window=ctx;vm.createContext(ctx);for(const name of ['finance-core.js','recovery-store.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+name,'utf8'),ctx);for(const s of scripts)vm.runInContext(s,ctx);return {ctx,storage,alerts,prompts,confirmations,downloads,readers,run:s=>vm.runInContext(s,ctx)};
}
let a=app();assert.equal(a.run('totals().saldo'),0);assert.match(a.ctx.salaryReceipts.innerHTML,/dia 5/);
a.run("salary5.value='1000';salary20.value='800';savePaySettings()");a.prompts.push('1000','2026-10-05');a.run("selectedMonth='2026-10';receiveSalary(5)");assert.equal(a.run("totals('2026-10').saldo"),1000);a.run('receiveSalary(5)');assert.equal(a.run('data.movs.length'),1);
a.run("data.wishes=[{id:'w',nome:'Meta',valor:300,guardado:200}];render()");assert.equal(a.run("projectionForMonth('2026-10').safe"),800);
a.run("movNome.value='Teste';movValor.value='-10';addMov()");assert.equal(a.run('data.movs.length'),1);
a.run("data.debts=[{id:'d',nome:'Conta',valor:100,inicio:'2026-10',meses:1,fixa:false,pagos:[],dia:10}]");a.prompts.push('2026-11-02');a.run("toggleDebt('d',0)");assert.equal(a.run("totals('2026-10').saida"),0);assert.equal(a.run("totals('2026-11').saida"),100);
const saved=a.storage.get('sanFinancePro_v6_fixas');let b=app(saved);assert.equal(b.run('data.movs.length'),1);assert.equal(b.storage.get('sanFinancePro_v6_fixas_beforeV7'),saved);
a=app('{broken');assert.equal(a.storage.get('sanFinancePro_v6_fixas'),'{broken');assert.equal(a.run('storageBlocked'),true);
a=app();assert.throws(()=>a.run('validateBackup({})'));assert.throws(()=>a.run("validateBackup({movs:[{tipo:'gasto',valor:'bad',ym:'2026-10'}],debts:[],jobs:[],wishes:[]})"));
a.run("data.creditCards=[{id:'c',nome:'Cartão',limite:1000,vencimento:6}];data.creditPurchases=[{id:'p',cardId:'c',nome:'Compra',valor:100,parcelas:1,inicio:'2026-10'}];selectedMonth='2026-10'");a.prompts.push('2026-11-01');a.run("payCreditInvoice('c','2026-10')");assert.equal(a.run("creditOutstanding('c')"),0);assert.equal(a.run("totals('2026-11').saida"),100);a.run("undoCreditInvoice('c','2026-10')");assert.equal(a.run("creditOutstanding('c')"),100);
a.run("data.jobs=[{id:'j',cliente:'Cliente',status:'Entregue',valor:500,dataEvento:'2026-10-01',costs:[]}]");a.prompts.push('2026-11-01');a.run("updateJob('j','Pago')");assert.equal(a.run("totals('2026-10').jobsPagos"),0);assert.equal(a.run("totals('2026-11').jobsPagos"),500);
console.log('PASS: app initialization and rendering with DOM stubs; salary idempotency; reserve deduction; negative input; debt dates; reload preservation; corrupt storage protection; backup validation; card pay/undo; job receipt');
// Editing a legacy paid bill must preserve previous cash and paid totals.
a=app();a.run("data.debts=[{id:'d',nome:'Internet',valor:70,dia:20,fixa:true,meses:1,inicio:'2026-09',pagos:[],paidMonths:['2026-09']}];editDebt('d');editDebtName.value='Internet nova';editDebtAmount.value='90';editDebtDue.value='5';saveDebtEdit()");
assert.equal(a.run('data.debts[0].valor'),90);assert.equal(a.run('data.debts[0].dia'),5);assert.equal(a.run("currentMonthDebtTotal('2026-09')"),70);assert.equal(a.run("currentMonthDebtPaid('2026-09')"),70);assert.equal(a.run("totals('2026-09').saida"),70);assert.equal(a.run("currentMonthDebtTotal('2026-10')"),90);
a.run("editDebt('d');editDebtAmount.value='-1';saveDebtEdit()");assert.equal(a.run('data.debts[0].valor'),90);
a.run("editDebtAmount.value='100';closeEditDebt()");assert.equal(a.run('data.debts[0].valor'),90);
a.run("data.debts=[{id:'paid',nome:'Paga',valor:10,dia:1,fixa:true,inicio:'2026-10',paidMonths:['2026-10']},{id:'pending20',nome:'Pendente',valor:10,dia:20,fixa:true,inicio:'2026-10'},{id:'pending5',nome:'Pendente',valor:10,dia:5,fixa:true,inicio:'2026-10'},{id:'future',nome:'Futura',valor:10,dia:5,meses:2,inicio:'2026-11',pagos:[]},{id:'settled',nome:'Quitada',valor:10,dia:1,meses:1,inicio:'2026-09',pagos:[0]}]");
assert.equal(a.run("orderedDebtList('2026-10').map(d=>d.id).join(',')"),'pending5,pending20,paid,future,settled');
console.log('PASS: editing preserves legacy payments; invalid input and cancellation; pending-first due-date ordering');
a=app();a.run("selectedMonth='2026-10';data.movs=[{id:'old',tipo:'entrada',valor:1000,ym:'2026-09'},{id:'in',tipo:'entrada',valor:500,ym:'2026-10'},{id:'out',tipo:'gasto',valor:50,ym:'2026-10',cat:'Alimentação'}];data.debts=[{id:'d',nome:'Conta',fixa:true,valor:70,inicio:'2026-10',paidMonths:['2026-10'],pagos:[],dia:20}];render()");
assert.equal(a.ctx.dashResult.textContent,'R$ 380,00');assert.equal(a.ctx.dashIncome.textContent,'R$ 500,00');assert.equal(a.ctx.dashExpense.textContent,'R$ 120,00');assert.equal(a.run("dashboardCategories(selectedMonth).reduce((s,x)=>s+x[1],0)"),12000);assert.equal(a.run("totals(selectedMonth).saldo"),1380);
console.log('PASS: dashboard monthly result excludes carryover; category totals match paid outflows');

// Filtering by due day must only change the debt view, including its summary.
a=app();a.run(`selectedMonth='2026-10';data.debts=[
 {id:'five',nome:'Parcela cinco',valor:67.8,dia:'05',fixa:false,meses:3,inicio:'2026-10',pagos:[]},
 {id:'fivePaid',nome:'Paga cinco',valor:60,dia:5,fixa:true,meses:1,inicio:'2026-10',pagos:[],paidMonths:['2026-10'],paymentRecords:{'2026-10':{date:'2026-11-01',value:40}}},
 {id:'twenty',nome:'Academia vinte',valor:79.9,dia:'20',fixa:true,meses:1,inicio:'2026-10',pagos:[],paidMonths:[]},
 {id:'twentyPaid',nome:'Paga vinte',valor:100,dia:20,fixa:false,meses:1,inicio:'2026-10',pagos:[0],paymentRecords:{'0':{date:'2026-10-20',value:87}}},
 {id:'other',nome:'Outro vencimento',valor:12.3,dia:10,fixa:true,meses:1,inicio:'2026-10',pagos:[],paidMonths:[]},
 {id:'future',nome:'Futura cinco',valor:20,dia:5,fixa:false,meses:1,inicio:'2026-11',pagos:[]},
 {id:'settled',nome:'Quitada cinco',valor:25,dia:5,fixa:false,meses:1,inicio:'2026-09',pagos:[0]}
];render()`);
const unfilteredData=a.run('JSON.stringify(data)'),unfilteredTotals=a.run('JSON.stringify(totals())'),unfilteredProjection=a.run('JSON.stringify(projectionForMonth())');
assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 287,00');
assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 127,00');
assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 160,00');
a.run('setDebtDayFilter(5)');
assert.match(a.ctx.debtList.innerHTML,/Parcela cinco/);assert.match(a.ctx.debtList.innerHTML,/Paga cinco/);
assert.doesNotMatch(a.ctx.debtList.innerHTML,/Academia vinte|Paga vinte|Outro vencimento/);
assert.ok(a.ctx.debtList.innerHTML.indexOf('Parcela cinco')<a.ctx.debtList.innerHTML.indexOf('Paga cinco'));
assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 107,80');assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 40,00');assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 67,80');
assert.equal(a.ctx.debtTotalLabel.textContent,'TOTAL DO DIA 5');assert.equal(a.ctx.debtFilter5.getAttribute('aria-pressed'),'true');assert.match(a.ctx.debtFilter5.className,/active/);
assert.equal(a.ctx.debtFilterAll.getAttribute('aria-pressed'),'false');assert.equal(a.ctx.debtFilter20.getAttribute('aria-pressed'),'false');
a.run("setDebtDayFilter('20')");
assert.match(a.ctx.debtList.innerHTML,/Academia vinte/);assert.match(a.ctx.debtList.innerHTML,/Paga vinte/);assert.doesNotMatch(a.ctx.debtList.innerHTML,/Parcela cinco|Paga cinco|Outro vencimento/);
assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 166,90');assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 87,00');assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 79,90');
assert.equal(a.ctx.debtFilter5.getAttribute('aria-pressed'),'false');assert.equal(a.ctx.debtFilter20.getAttribute('aria-pressed'),'true');
a.run("setDebtDayFilter('all')");assert.match(a.ctx.debtList.innerHTML,/Outro vencimento/);assert.equal(a.ctx.debtTotalLabel.textContent,'TOTAL DO MÊS');assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 287,00');
a.run("setDebtDayFilter('10')");assert.equal(a.run('debtDayFilter'),'all');
assert.equal(a.run('JSON.stringify(data)'),unfilteredData);assert.equal(a.run('JSON.stringify(totals())'),unfilteredTotals);assert.equal(a.run('JSON.stringify(projectionForMonth())'),unfilteredProjection);
a.run("setDebtDayFilter('5')");a.prompts.push('2026-10-05');a.run("toggleDebt('five',0)");
assert.equal(a.run('debtDayFilter'),'5');assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 107,80');assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 0,00');assert.equal(a.run('totals().saida'),154.8);
a.run("toggleDebt('five',0)");assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 67,80');
a.run("editDebt('twenty');editDebtDue.value='5';saveDebtEdit()");assert.match(a.ctx.debtList.innerHTML,/Academia vinte/);
a.run("setDebtDayFilter('20')");assert.doesNotMatch(a.ctx.debtList.innerHTML,/Academia vinte/);assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 0,00');
a.run("setSelectedMonth('2026-11');setDebtDayFilter('5')");assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 227,70');assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 0,00');
a=app();a.run("selectedMonth='2026-10';data.debts=[{id:'only5',nome:'Conta cinco',valor:10,dia:5,fixa:true,meses:1,inicio:'2026-10',pagos:[],paidMonths:[]}];setDebtDayFilter('20')");
assert.match(a.ctx.debtList.innerHTML,/Nenhuma conta com vencimento no dia 20/);assert.equal(a.ctx.quickDebtMonth.textContent,'R$ 0,00');assert.equal(a.ctx.quickDebtPaid.textContent,'R$ 0,00');assert.equal(a.ctx.quickDebtOpen.textContent,'R$ 0,00');
a.run("setDebtDayFilter('all')");assert.match(a.ctx.debtList.innerHTML,/Conta cinco/);
console.log('PASS: due-day filters and accessible button state; matching summaries; all accounts restored; financial data and global projections preserved; payments, edits, month changes and empty filter');

// A carried-over statement is replaced in one save, while settled statements stay in history.
const statementFixture={
 movs:[],debts:[],jobs:[],wishes:[],
 creditCards:[{id:'card',nome:'Cartão teste',limite:420,vencimento:8,fechamento:23}],
 creditPurchases:[{id:'statement',cardId:'card',nome:'Fatura',valor:239.51,parcelas:1,inicio:'2026-09',pagas:[]}]
};
const invoiceStorageKey='sanFinancePro_v6_fixas';
const invoiceInputs="editInvoiceAmount.value='420';editInvoiceClosingDay.value='25';editInvoiceDueDay.value='4'";
a=app(JSON.stringify(statementFixture));
a.run("selectedMonth='2026-10';render();openCreditInvoiceEdit('card','statement')");
assert.match(a.ctx.purchaseList.innerHTML,/Corrigir fatura/);
assert.equal(a.ctx.editInvoiceMonth.value,'2026-10');
assert.match(a.ctx.editInvoiceHint.textContent,/239,51/);
const initialStatement=a.storage.get(invoiceStorageKey);
a.run(invoiceInputs+";editInvoiceDueDay.value='0';saveCreditInvoiceEdit()");
assert.equal(a.storage.get(invoiceStorageKey),initialStatement);
a.run(invoiceInputs+';saveCreditInvoiceEdit()');
assert.equal(a.run('data.creditPurchases.length'),1);
assert.equal(a.run("creditMonthAmount('card','2026-09')"),0);
assert.equal(a.ctx.quickCardInvoice.textContent,'R$ 420,00');
assert.equal(a.ctx.quickCardUsed.textContent,'R$ 420,00');
assert.equal(a.ctx.quickCardAvailable.textContent,'R$ 0,00');
assert.equal(a.run('projectionForMonth().openCard'),420);
assert.equal(a.run('totals().saida'),0);
assert.match(a.ctx.cardList.innerHTML,/25\/09[\s\S]*Vence em 04\/10/);
assert.equal(a.run("financeEvents().find(e=>e.type==='cardevt').date"),'2026-10-04');
a.run('undoLastChange()');
assert.equal(a.run("creditMonthAmount('card','2026-09')"),239.51);
assert.equal(a.run('data.creditCards[0].vencimento'),8);
assert.equal(a.run('data.creditCards[0].fechamento'),23);

const settledStatement={...statementFixture,
 movs:[{id:'paid',tipo:'gasto',nome:'Pagamento',valor:239.51,ym:'2026-09'}],
 creditInvoicePayments:[{id:'payment',cardId:'card',ym:'2026-09',valor:239.51,movId:'paid',paidAt:'2026-09-08'}]
};
a=app(JSON.stringify(settledStatement));
a.run("selectedMonth='2026-10';render();openCreditInvoiceEdit('card','statement')");
assert.match(a.ctx.purchaseList.innerHTML,/Faturas pagas de outros meses/);
assert.equal(a.ctx.editInvoiceModal.classList.contains('open'),false);
a.run("openCreditInvoiceEdit('card');"+invoiceInputs+';saveCreditInvoiceEdit()');
assert.equal(a.ctx.quickCardUsed.textContent,'R$ 420,00');
assert.equal(a.run("totals('2026-09').saida"),239.51);
assert.equal(a.run('data.creditInvoicePayments[0].movId'),'paid');
const registeredStatement=a.storage.get(invoiceStorageKey);
a.run("openCreditInvoiceEdit('card');"+invoiceInputs+';saveCreditInvoiceEdit()');
assert.equal(a.storage.get(invoiceStorageKey),registeredStatement);
assert.match(a.alerts.at(-1),/já tem outros lançamentos/);
console.log('PASS: correcting a statement updates its month and card dates together; paid history and duplicate protection');

const billingFixture={
 debts:[],jobs:[],wishes:[],
 movs:[
   {id:'income',tipo:'entrada',valor:500,ym:'2026-11'},
   {id:'nov-payment',tipo:'gasto',valor:180,ym:'2026-11',cardId:'card',invoiceMonth:'2026-11'}
 ],
 creditCards:[{id:'card',nome:'Cartão teste',limite:500,vencimento:3,fechamento:26}],
 creditPurchases:[
   {id:'nov',cardId:'card',nome:'Fatura',valor:180,parcelas:1,inicio:'2026-11'},
   {id:'dec',cardId:'card',nome:'Compra',valor:75,parcelas:1,inicio:'2026-12'}
 ],
 creditInvoicePayments:[{id:'paid-nov',cardId:'card',ym:'2026-11',valor:180,movId:'nov-payment',paidAt:'2026-11-03'}]
};
a=app(JSON.stringify(billingFixture));
a.run("Finance.localDate=()=> '2026-11-12';setSelectedMonth('2026-11')");
assert.match(a.ctx.cardList.innerHTML,/creditStatus paid">● PAGA/);
assert.match(a.ctx.nextCardInvoices.innerHTML,/setSelectedMonth\('2026-12'\)[\s\S]*Vence em 03\/12[\s\S]*R\$ 75,00/);
assert.equal(a.run('projectionForMonth().openCard'),0);
a.run("setSelectedMonth('2026-12')");
assert.match(a.ctx.cardList.innerHTML,/Fecha em 26\/11[\s\S]*Vence em 03\/12[\s\S]*creditStatus open">● ABERTA/);
assert.equal(a.run("cardStatus(data.creditCards[0],selectedMonth,'2026-11-25').status"),'open');
a.run("Finance.localDate=()=> '2026-11-26';render()");
assert.match(a.ctx.cardList.innerHTML,/Fechou em 26\/11[\s\S]*creditStatus closed">● FECHADA/);
assert.equal(a.run("cardStatus(data.creditCards[0],selectedMonth,'2026-12-03').status"),'closed');
assert.equal(a.run("cardStatus(data.creditCards[0],selectedMonth,'2026-12-04').status"),'overdue');
assert.equal(a.run('totals().saldo'),320);
a.run("Finance.localDate=()=> '2026-11-12';setSelectedMonth('2026-11');purchaseCard.value='card';toggleFormCard('formCompraCartao')");
assert.equal(a.ctx.purchaseInicio.value,'2026-12');
assert.match(a.ctx.purchaseInvoiceHint.textContent,/26\/11[\s\S]*03\/12/);
const beforeWrongMonth=a.storage.get(invoiceStorageKey);
a.run("purchaseNome.value='Compra de teste';purchaseValor.value='20';purchaseInicio.value='2026-11';addCreditPurchase()");
assert.equal(a.storage.get(invoiceStorageKey),beforeWrongMonth);
assert.match(a.alerts.at(-1),/ajuste o mês da primeira fatura/);
a.run("purchaseInicio.value='2026-12';addCreditPurchase()");
assert.equal(a.run("Finance.invoiceOpen(data,'card','2026-12')"),95);
assert.equal(a.run("data.creditInvoicePayments[0].movId"),'nov-payment');
assert.equal(a.run('totals().saldo'),320);
console.log('PASS: invoice labels follow closing and due dates; next invoice is separate; new purchases preserve payment history');

async function checkRecoveryFlows(){
 const key='sanFinancePro_v6_fixas';
 const fixture={salario:0,movs:[
   {id:'income',tipo:'entrada',nome:'Salário',valor:1000,cat:'💰',ym:'2026-10'},
   {id:'expense',tipo:'gasto',nome:'Cinema',valor:40,cat:'🎉 Lazer',ym:'2026-10'},
   {id:'costMov',tipo:'gasto',nome:'Uber do job',valor:20,cat:'🎬 SAN / Job',ym:'2026-10',jobId:'job1',jobCostId:'cost1'},
   {id:'invoiceMov',tipo:'gasto',nome:'Fatura',valor:100,cat:'💳 Cartão',ym:'2026-10',cardId:'card1',invoiceMonth:'2026-10'}
 ],debts:[{id:'fixed',nome:'Internet',valor:80,dia:20,fixa:true,meses:1,inicio:'2026-10',pagos:[],paidMonths:['2026-10'],paymentRecords:{'2026-10':{date:'2026-10-20',value:80}}}],
 jobs:[{id:'job1',cliente:'Cliente',valor:500,status:'Entregue',dataEvento:'2026-10-21',costs:[{id:'cost1',nome:'Uber',valor:20,movId:'costMov'}]}],wishes:[{id:'goal',nome:'Reserva',valor:200,guardado:50}],
 creditCards:[{id:'card1',nome:'Cartão',limite:1000,vencimento:20,fechamento:1}],creditPurchases:[{id:'purchase',cardId:'card1',nome:'Compra',valor:100,parcelas:1,inicio:'2026-10'}],creditInvoicePayments:[{id:'invoice',cardId:'card1',ym:'2026-10',valor:100,movId:'invoiceMov',paidAt:'2026-10-20'}],paySettings:{day5:1000,day20:800}};
 const raw=JSON.stringify(fixture),fresh=()=>{const instance=app(raw);instance.run("selectedMonth='2026-10';render()");return instance};
 let c=fresh();const baseline=c.run('JSON.stringify(data)');
 assert.equal(c.run('totals().saldo'),760);assert.equal(c.ctx.undoNotice.hidden,true);assert.equal(c.ctx.undoLastChangeBtn.disabled,true);
 c.run("delMov('expense')");assert.equal(c.run('totals().saldo'),800);assert.equal(c.ctx.undoNotice.hidden,false);assert.equal(c.ctx.undoNoticeText.textContent,'Movimento apagado');
 c.run('dismissUndoNotice()');assert.equal(c.ctx.undoNotice.hidden,true);assert.equal(c.ctx.undoLastChangeBtn.disabled,false);
 const history=c.storage.get(key+'_previous');
 c=app(undefined,{savedStorage:c.storage});c.run("selectedMonth='2026-10'");assert.equal(c.storage.get(key+'_previous'),history);
 c.run('undoLastChange()');assert.equal(c.run(`dataStore.sameData(data,${baseline})`),true);assert.equal(c.run('totals().saldo'),760);assert.equal(c.ctx.undoNoticeAction.textContent,'Refazer');
 c.run('undoLastChange()');assert.equal(c.run('totals().saldo'),800);c.run('undoLastChange()');
 const priorHistory=c.storage.get(key+'_previous');c.confirmations.push(false);c.run("delMov('expense')");assert.equal(c.storage.get(key+'_previous'),priorHistory);
 c.run("save('Nada mudou')");assert.equal(c.storage.get(key+'_previous'),priorHistory);
 c.run("delMov('invoiceMov')");assert.equal(c.run('data.creditInvoicePayments.length'),0);assert.equal(c.run("creditOutstanding('card1')"),100);c.run('undoLastChange()');assert.equal(c.run('data.creditInvoicePayments[0].movId'),'invoiceMov');assert.equal(c.run("creditOutstanding('card1')"),0);
 c.run("delJobCost('job1','cost1')");assert.equal(c.run('data.jobs[0].costs.length'),0);assert.equal(c.run("data.movs.some(m=>m.id==='costMov')"),false);c.run('undoLastChange()');assert.equal(c.run('data.jobs[0].costs[0].movId'),'costMov');assert.equal(c.run("data.movs.some(m=>m.id==='costMov')"),true);
 c.run("setDebtDayFilter('20');toggleDebt('fixed',0)");assert.equal(c.ctx.quickDebtPaid.textContent,'R$ 0,00');c.run('undoLastChange()');assert.equal(c.ctx.quickDebtPaid.textContent,'R$ 80,00');assert.equal(c.run('debtDayFilter'),'20');
 c.prompts.push('2026-11-03');c.run("updateJob('job1','Pago')");assert.equal(c.run("totals('2026-11').jobsPagos"),500);c.run('undoLastChange()');assert.equal(c.run("totals('2026-11').jobsPagos"),0);assert.equal(c.run('data.jobs[0].status'),'Entregue');
 c.prompts.push('15');c.run("withdrawWish('goal')");assert.equal(c.run('data.wishes[0].guardado'),35);c.run('undoLastChange()');assert.equal(c.run('data.wishes[0].guardado'),50);
 const beforeReset=c.run('JSON.stringify(data)');c.run('resetAll()');assert.equal(c.run('data.movs.length+data.debts.length+data.jobs.length+data.wishes.length'),0);c.run('undoLastChange()');assert.equal(c.run(`dataStore.sameData(data,${beforeReset})`),true);
 console.log('PASS: app undo/redo survives reload; cancellation and no-op preserve history; card/job links, receipt dates, reserves and full reset recover together');

 const replacement={movs:[{id:'replacement',nome:'Entrada da cópia',tipo:'entrada',valor:25,ym:'2026-10'}],debts:[],jobs:[],wishes:[]};
 const selectFile=(instance,content,extra={})=>{
   instance.ctx.backupFile.value='selected';instance.ctx.backupFile.files=[{name:'copia.json',content,...extra}];instance.run('importBackup({target:backupFile})');
 };
 c=fresh();let before=c.storage.get(key);selectFile(c,JSON.stringify({app:'SAN Finance',exportedAt:'2026-10-01T12:00:00Z',data:replacement}));
 assert.equal(c.storage.get(key),before);assert.equal(c.ctx.restoreBackupModal.classList.contains('open'),true);assert.match(c.ctx.restoreBackupCounts.innerHTML,/<td>4<\/td><td>1<\/td>/);assert.equal(c.ctx.backupFile.value,'');
 c.run('closeBackupRestore()');assert.equal(c.storage.get(key),before);assert.equal(c.ctx.restoreBackupModal.classList.contains('open'),false);
 for(const invalid of ['{broken','null','{}',JSON.stringify({...replacement,movs:[{id:'bad',tipo:'gasto',valor:null,ym:'2026-10'}]}),JSON.stringify({...replacement,paySettings:{day5:-1}})]){
   selectFile(c,invalid);assert.equal(c.storage.get(key),before);assert.equal(c.run('pendingBackupRestore'),null);assert.match(c.alerts.at(-1),/Backup inválido/);
 }
 selectFile(c,JSON.stringify(replacement));c.run('confirmBackupRestore()');assert.equal(c.run('data.movs[0].id'),'replacement');assert.equal(c.storage.get(key+'_beforeImport'),before);assert.equal(c.ctx.restoreBackupModal.classList.contains('open'),false);c.run('undoLastChange()');assert.equal(c.run('data.movs.length'),4);
 selectFile(c,JSON.stringify(replacement));c.run("movNome.value='Novo';movValor.value='5';movCat.value='👤 Gastos pessoais';setTipo('gasto');addMov();confirmBackupRestore()");assert.equal(c.run("data.movs.some(m=>m.nome==='Novo')"),true);assert.match(c.alerts.at(-1),/Seus dados mudaram/);
 c=fresh();before=c.storage.get(key);selectFile(c,JSON.stringify(replacement),{defer:true});const oldReader=c.readers.at(-1);selectFile(c,'{broken');oldReader.finish();assert.equal(c.run('pendingBackupRestore'),null);assert.equal(c.storage.get(key),before);
 selectFile(c,'',{error:true});assert.match(c.alerts.at(-1),/Não foi possível ler/);assert.equal(c.storage.get(key),before);
 c=fresh();selectFile(c,JSON.stringify(replacement));const otherTab=JSON.stringify({...fixture,movs:[...fixture.movs,{id:'otherTab',nome:'Outra aba',tipo:'entrada',valor:10,ym:'2026-10'}]});c.storage.set(key,otherTab);c.run('confirmBackupRestore()');assert.equal(c.storage.get(key),otherTab);assert.equal(c.run("data.movs.some(m=>m.id==='otherTab')"),true);assert.equal(c.ctx.restoreBackupModal.classList.contains('open'),false);
 console.log('PASS: backup preview is read-only until confirmation; cancellation, invalid files, stale previews, out-of-order file reads and read failures preserve data');

 c=app('{broken',{savedStorage:new Map([[key+'_previous',raw]])});assert.equal(c.run('storageBlocked'),true);assert.equal(c.storage.get(key),'{broken');assert.equal(c.ctx.backupExportBtn.textContent,'BAIXAR DADOS PRESERVADOS');
 c.run('exportBackup()');assert.equal(await c.downloads.at(-1).blob.text(),'{broken');assert.equal(c.storage.has(key+'_backupExport'),false);
 c.run("previewLocalBackup('_previous');confirmBackupRestore()");assert.equal(c.run('storageBlocked'),false);assert.equal(c.run('data.movs.length'),4);assert.equal(c.storage.get(key+'_beforeImport'),'{broken');assert.match(c.ctx.backupLocalCopies.innerHTML,/Baixar dados preservados/);
 console.log('PASS: unreadable primary is never exported as an empty backup; explicit local recovery preserves the original damaged bytes');

 c=fresh();before=c.storage.get(key);c.ctx.localStorage.setItem=(k,v)=>{if(k===key)throw Error('quota');c.storage.set(k,String(v))};
 c.run("movNome.value='Não salvo';movValor.value='15';movCat.value='🎉 Lazer';setTipo('gasto')");assert.equal(c.run('addMov()'),false);assert.equal(c.storage.get(key),before);assert.equal(c.run('data.movs.length'),4);assert.equal(c.ctx.movNome.value,'Não salvo');assert.equal(c.ctx.undoNotice.hidden,true);
 c.run('exportBackup()');let exported=JSON.parse(await c.downloads.at(-1).blob.text());assert.equal(exported.data.movs.length,4);assert.equal(exported.app,'SAN Finance');assert.match(c.downloads.at(-1).name,/^san-finance-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
 c=fresh();c.run('exportBackup()');exported=JSON.parse(await c.downloads.at(-1).blob.text());assert.equal(exported.data.movs.length,4);assert.match(c.ctx.backupStatus.textContent,/Backup gerado em/);
 const roundTrip=app();selectFile(roundTrip,JSON.stringify(exported));roundTrip.run("confirmBackupRestore();selectedMonth='2026-10'");assert.equal(roundTrip.run(`dataStore.sameData(data,${JSON.stringify(exported.data)})`),true);assert.equal(roundTrip.run('totals().saldo'),760);assert.equal(roundTrip.run('data.jobs[0].costs[0].movId'),'costMov');assert.equal(roundTrip.run('data.creditInvoicePayments[0].movId'),'invoiceMov');
 c.run("movNome.value='Mais um';movValor.value='5';movCat.value='🎉 Lazer';setTipo('gasto');addMov()");assert.match(c.ctx.backupStatus.textContent,/Há alterações depois dele/);
 c=fresh();c.ctx.localStorage.setItem=(k,v)=>{if(k===key+'_backupExport')throw Error('quota');c.storage.set(k,String(v))};assert.equal(c.run('exportBackup()'),true);assert.match(c.ctx.backupStatus.textContent,/Backup gerado em/);
 assert.equal(c.run('backupDate(null)'),'');
 console.log('PASS: failed saves roll back data and keep form inputs; exported JSON matches committed data; generated-backup status tracks subsequent changes');
}
checkRecoveryFlows().catch(error=>{console.error(error);process.exitCode=1});
