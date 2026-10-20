// 홈 화면 설치 안내 (지원 브라우저에서만 표시)
const box = document.getElementById('install');
let deferred;
addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferred = event;
  box.hidden = false;
});
box?.querySelector('[data-install]').addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  box.hidden = true;
});
