/* One-step local recovery. Financial data remains in the existing storage key. */
(function(root){
  const clone=value=>JSON.parse(JSON.stringify(value,(key,item)=>{
    if(typeof item==='number'&&!Number.isFinite(item))throw Error('Invalid number');
    return item;
  }));
  const sameData=(a,b)=>{
    const left=clone(a),right=clone(b);
    delete left._sanRevision;delete right._sanRevision;
    return JSON.stringify(left)===JSON.stringify(right);
  };
  function create({storage,key,normalize,empty,revision,now=()=>new Date()}){
    let persisted=null,current=empty(),blocked=false;
    const state=()=>({data:clone(current),blocked});
    function open(){
      try{
        persisted=storage.getItem(key);
        current=persisted===null?normalize(empty()):normalize(JSON.parse(persisted));
        blocked=false;
      }catch(error){current=empty();blocked=true;}
      return state();
    }
    function readCopy(suffix){
      if(!['_previous','_beforeImport','_beforeV7'].includes(suffix))return null;
      try{
        const raw=storage.getItem(key+suffix);if(!raw)return null;
        const parsed=JSON.parse(raw);
        const wrapped=suffix==='_previous'&&parsed.kind==='SANFinanceRecovery'&&parsed.version===1;
        if(wrapped&&(typeof parsed.revision!=='string'||!parsed.revision))return null;
        return {
          data:normalize(wrapped?parsed.data:parsed),
          revision:wrapped?parsed.revision:null,
          at:wrapped?parsed.at:null,
          label:wrapped?String(parsed.label||'Última alteração'):'Última alteração',
          mode:wrapped&&parsed.mode==='redo'?'redo':'undo'
        };
      }catch(error){return null;}
    }
    function undoCandidate(){
      try{
        if(blocked||storage.getItem(key)!==persisted)return null;
        const copy=readCopy('_previous');
        if(!copy||(copy.revision&&copy.revision!==current._sanRevision)||sameData(copy.data,current))return null;
        return copy;
      }catch(error){return null;}
    }
    function commit(proposed,{label='Alteração salva',mode='undo',protect=false,initial=false,allowBlocked=false}={}){
      if(blocked&&!allowBlocked)return {ok:false,reason:'blocked',...state()};
      let next;
      try{next=normalize(clone(proposed));}
      catch(error){return {ok:false,reason:'invalid',...state()};}
      let oldCopy=null,copyWritten=false;
      try{
        if(storage.getItem(key)!==persisted){open();return {ok:false,reason:'conflict',...state()};}
        if(!initial&&!blocked&&persisted!==null&&sameData(next,current))return {ok:true,changed:false,...state()};
        if(!initial)next._sanRevision=revision();
        const raw=JSON.stringify(next);
        if(raw===persisted)return {ok:true,changed:false,...state()};
        oldCopy=storage.getItem(key+'_previous');
        if(protect&&persisted!==null)storage.setItem(key+'_beforeImport',persisted);
        if(!initial&&!blocked){
          const copy={kind:'SANFinanceRecovery',version:1,revision:next._sanRevision,at:now().toISOString(),label:String(label),mode:mode==='redo'?'redo':'undo',data:current};
          storage.setItem(key+'_previous',JSON.stringify(copy));copyWritten=true;
        }
        storage.setItem(key,raw);
        persisted=raw;current=next;blocked=false;
        return {ok:true,changed:true,...state()};
      }catch(error){
        // A failed primary write must not publish a recovery point for that failed action.
        if(copyWritten){try{if(oldCopy===null)storage.removeItem(key+'_previous');else storage.setItem(key+'_previous',oldCopy);}catch(restoreError){}}
        return {ok:false,reason:'storage',...state()};
      }
    }
    function undo(){
      try{if(storage.getItem(key)!==persisted){open();return {ok:false,reason:'conflict',...state()};}}
      catch(error){return {ok:false,reason:'storage',...state()};}
      const copy=undoCandidate();
      if(!copy)return {ok:false,reason:'unavailable',...state()};
      const result=commit(copy.data,{label:copy.label,mode:copy.mode==='undo'?'redo':'undo'});
      return {...result,action:copy.mode};
    }
    return {open,commit,undo,undoCandidate,readCopy,state,token:()=>persisted,sameData};
  }
  root.FinanceRecovery={create};
})(typeof module==='object'?module.exports:globalThis);
