const assert=require('node:assert/strict');
const {FinanceRecovery}=require('./recovery-store.js');
const KEY='test-finance';
const empty=()=>({movs:[],debts:[],jobs:[],wishes:[]});
const original={...empty(),movs:[{id:'m1',valor:40,nome:'Cinema'}]};
const changed={...empty(),movs:[{id:'m2',valor:80,nome:'Mercado'}]};
let revisionId=0;
function memory(seed={}){
  const values=new Map(Object.entries(seed));
  return {values,fail:()=>false,getItem(key){if(this.fail('get',key))throw Error('unavailable');return values.get(key)??null;},setItem(key,value){if(this.fail('set',key))throw Error('quota');values.set(key,String(value));},removeItem(key){if(this.fail('remove',key))throw Error('quota');values.delete(key);}};
}
function store(storage){
  const normalize=value=>{
    if(!value||!['movs','debts','jobs','wishes'].every(k=>Array.isArray(value[k])))throw Error('invalid');
    if(value.movs.some(m=>!Number.isFinite(m.valor)||m.valor<0))throw Error('invalid money');
    return JSON.parse(JSON.stringify(value));
  };
  return FinanceRecovery.create({storage,key:KEY,normalize,empty,revision:()=>`revision-${++revisionId}`,now:()=>new Date('2026-10-31T12:00:00Z')});
}
function initialized(raw=original){
  const storage=memory({[KEY]:JSON.stringify(raw)}),api=store(storage);
  assert.equal(api.open().blocked,false);assert.equal(api.commit(api.state().data,{initial:true}).ok,true);
  return {storage,api};
}

let {storage,api}=initialized();
assert.equal(api.commit(changed,{label:'Movimento apagado'}).ok,true);
assert.equal(api.undoCandidate().label,'Movimento apagado');
const checkpoint=storage.getItem(KEY+'_previous');
assert.equal(api.commit(api.state().data).changed,false);assert.equal(storage.getItem(KEY+'_previous'),checkpoint);
const reopened=store(storage);reopened.open();reopened.commit(reopened.state().data,{initial:true});
assert.equal(storage.getItem(KEY+'_previous'),checkpoint);
assert.equal(reopened.undo().action,'undo');assert.deepEqual(reopened.state().data.movs,original.movs);
assert.equal(reopened.undoCandidate().mode,'redo');assert.equal(reopened.undo().action,'redo');assert.deepEqual(reopened.state().data.movs,changed.movs);
assert.equal(reopened.commit({...changed,movs:[{id:'m3',valor:20}]}).ok,true);assert.equal(reopened.undoCandidate().mode,'undo');
assert.equal(reopened.undo().ok,true);assert.deepEqual(reopened.state().data.movs,changed.movs);
console.log('PASS: one-step undo/redo, no-op saves, reopening preserves history, new changes replace redo');

for(const failingKey of [KEY+'_previous',KEY,KEY+'_beforeImport']){
  ({storage,api}=initialized());api.commit(changed);
  const before=storage.getItem(KEY),history=storage.getItem(KEY+'_previous'),state=api.state().data;
  storage.fail=(op,key)=>op==='set'&&key===failingKey;
  const result=api.commit(empty(),{protect:true});
  assert.equal(result.ok,false);assert.equal(result.reason,'storage');assert.equal(storage.getItem(KEY),before);assert.equal(storage.getItem(KEY+'_previous'),history);assert.deepEqual(result.data,state);
}
({storage,api}=initialized());api.commit(changed);
const beforeFailedWrite=storage.getItem(KEY);let historyWrites=0;
storage.fail=(op,key)=>op==='set'&&(key===KEY||(key===KEY+'_previous'&&++historyWrites>1));
assert.equal(api.commit(empty()).ok,false);assert.equal(storage.getItem(KEY),beforeFailedWrite);assert.equal(api.undoCandidate(),null);
console.log('PASS: failed checkpoint, primary and preservation writes retain data; a failed history rollback cannot expose stale undo');

({storage,api}=initialized());
const beforeInvalid=storage.getItem(KEY);
for(const invalid of [{},{...empty(),movs:[{valor:Infinity}]},{...empty(),movs:[{valor:NaN}]}]){
  assert.equal(api.commit(invalid).reason,'invalid');assert.equal(storage.getItem(KEY),beforeInvalid);
}
storage.values.set(KEY+'_previous','not-json');assert.equal(api.undoCandidate(),null);
storage.values.set(KEY+'_previous',JSON.stringify({kind:'SANFinanceRecovery',version:1,data:changed}));assert.equal(api.undoCandidate(),null);
storage=memory({[KEY]:'{broken',[KEY+'_previous']:JSON.stringify(original)});api=store(storage);
assert.equal(api.open().blocked,true);assert.equal(api.commit(empty()).reason,'blocked');assert.equal(storage.getItem(KEY),'{broken');
assert.deepEqual(api.readCopy('_previous').data,original);
assert.equal(api.commit(original,{allowBlocked:true,protect:true}).ok,true);assert.equal(storage.getItem(KEY+'_beforeImport'),'{broken');assert.deepEqual(api.state().data.movs,original.movs);
assert.equal(api.undoCandidate(),null);
console.log('PASS: invalid values rejected; corrupted primary is preserved and requires explicit recovery; invalid snapshots are unavailable');

({storage,api}=initialized());
storage.values.set(KEY+'_previous',JSON.stringify(changed));
assert.deepEqual(api.undo().data.movs,changed.movs);
const other=store(storage);other.open();
const latest=api.commit({...original,movs:[{id:'latest',valor:120}]}).data;
const concurrent=other.commit(empty());
assert.equal(concurrent.reason,'conflict');assert.deepEqual(concurrent.data,latest);assert.deepEqual(JSON.parse(storage.getItem(KEY)),latest);
assert.equal(api.commit(empty(),{protect:true}).ok,true);assert.deepEqual(JSON.parse(storage.getItem(KEY+'_beforeImport')),latest);assert.deepEqual(api.undo().data,({...latest,_sanRevision:api.state().data._sanRevision}));
console.log('PASS: legacy snapshot recovery; stale-tab changes rejected; whole-dataset replacements can be undone');

storage=memory();storage.fail=()=>true;api=store(storage);assert.equal(api.open().blocked,true);assert.equal(api.commit(empty()).ok,false);
console.log('PASS: unavailable storage never reports a successful save');
