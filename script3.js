let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  deferredInstallPrompt=e;
  const btn=document.getElementById('installAppBtn');
  if(btn) btn.style.display='block';
});
async function installApp(){
  const btn=document.getElementById('installAppBtn');
  if(!deferredInstallPrompt){
    alert('No iPhone, use Compartilhar → Adicionar à Tela de Início. No Android, abra pelo Chrome e tente novamente.');
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(()=>{});
  deferredInstallPrompt=null;
  if(btn) btn.style.display='none';
}
window.addEventListener('appinstalled',function(){
  const btn=document.getElementById('installAppBtn');
  if(btn) btn.style.display='none';
});
