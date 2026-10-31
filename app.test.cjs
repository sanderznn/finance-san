const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function app(raw){
 const nodes={};function node(id){return nodes[id]||(nodes[id]={id,value:'',innerHTML:'',textContent:'',className:'',style:{},options:[],files:[],attributes:{},setAttribute(k,v){this.attributes[k]=String(v)},getAttribute(k){return this.attributes[k]??null},classList:{add(){},remove(){},toggle(){}},appendChild(){},remove(){},click(){},querySelector(){return null},querySelectorAll(){return []}})}
 for(const m of html.matchAll(/\bid="([^"]+)"/g))node(m[1]);
 const storage=new Map();if(raw!==undefined)storage.set('sanFinancePro_v6_fixas',raw);
 const alerts=[],prompts=[];
 const ctx={console,Date,Math,JSON,Number,String,Array,Object,Set,Map,RegExp,Blob,URL,Promise,parseFloat,parseInt,confirm:()=>true,prompt:()=>prompts.shift()??null,alert:m=>alerts.push(m),setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},navigator:{},document:{activeElement:null,body:node('body'),createElement:()=>node('new'),getElementById:node,querySelector:s=>s==='.section.active'?node('home'):null,querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},...nodes};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/finance-core.js','utf8'),ctx);for(const s of scripts)vm.runInContext(s,ctx);return {ctx,storage,alerts,prompts,run:s=>vm.runInContext(s,ctx)};
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
