/* Prioridade 1: troca menu pequeno por bottom sheet premium */
function fabOptionDetails(opt){
  const label=(opt && opt.label) || 'Novo cadastro';
  if(label.toLowerCase().includes('movimento')) return {icon:'💰',title:'Movimento',desc:'Registrar entrada ou gasto'};
  if(label.toLowerCase().includes('dívida') || label.toLowerCase().includes('conta')) return {icon:'📋',title:'Dívida/conta',desc:'Cadastrar conta fixa ou parcelada'};
  if(label.toLowerCase().includes('compra')) return {icon:'🧾',title:'Compra no cartão',desc:'Lançar compra parcelada'};
  if(label.toLowerCase().includes('cartão')) return {icon:'💳',title:'Cartão',desc:'Adicionar limite e vencimento'};
  if(label.toLowerCase().includes('job')) return {icon:'🎬',title:'Job',desc:'Cadastrar cliente e recebimento'};
  if(label.toLowerCase().includes('desejo') || label.toLowerCase().includes('meta')) return {icon:'✨',title:'Desejo/meta',desc:'Criar objetivo financeiro'};
  return {icon:'＋',title:label,desc:'Criar novo item'};
}
function updateFab(){
  const wrap=document.getElementById('fabWrap');
  const sheetMenu=document.getElementById('fabSheetMenu');
  if(!wrap) return;
  const opts=fabOptions();
  wrap.style.display=opts.length?'flex':'none';
  if(sheetMenu){
    sheetMenu.innerHTML=opts.map((o,i)=>{
      const d=fabOptionDetails(o);
      return `<button class="fabSheetItem" onclick="fabAction(${i})">
        <span class="fabSheetItemLeft">
          <span class="fabSheetIcon">${d.icon}</span>
          <span class="fabSheetText"><b>${d.title}</b><span>${d.desc}</span></span>
        </span>
        <span class="fabSheetArrow">›</span>
      </button>`;
    }).join('');
  }
}
function toggleFab(){
  const overlay=document.getElementById('fabSheetOverlay');
  const wrap=document.getElementById('fabWrap');
  const opts=fabOptions();
  if(!opts.length) return;
  updateFab();
  if(overlay) overlay.classList.add('open');
  if(wrap) wrap.classList.add('open');
}
function closeFab(){closeFabSheet()}
function closeFabSheet(){
  const overlay=document.getElementById('fabSheetOverlay');
  const wrap=document.getElementById('fabWrap');
  if(overlay) overlay.classList.remove('open');
  if(wrap) wrap.classList.remove('open');
}
document.addEventListener('keydown',function(e){if(e.key==='Escape') closeFabSheet()});
updateFab();
