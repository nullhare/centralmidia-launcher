(() => {
  'use strict';

  const OWNER = 'nullhare';
  const REPO_API = `https://api.github.com/repos/${OWNER}/centralmidia/codespaces`;
  const USER_API = 'https://api.github.com/user';
  const LEGACY_GH_KEY = 'centralmidia_codespaces_token_v1';
  const BROWSER_GH_KEY = 'centralmidia_browser_token_v2';
  const COMPUTER_GH_KEY = 'centralmidia_computer_token_v2';
  const BROWSER_DEVCONTAINER = '.devcontainer/browser-v4/devcontainer.json';
  const LEGACY_BROWSER_DEVCONTAINERS = ['.devcontainer/browser-v3/devcontainer.json','.devcontainer/browser-v2/devcontainer.json','.devcontainer/browser/devcontainer.json','.devcontainer/devcontainer.json'];
  const COMPUTER_DEVCONTAINER = '.devcontainer/computer/devcontainer.json';

  const statusEl = document.getElementById('status');
  const pcStatusEl = document.getElementById('pc-status');
  const ghConfigCard = document.getElementById('gh-config-card');
  const pcConfigCard = document.getElementById('pc-config-card');
  const tokenEl = document.getElementById('token');
  const pcTokenEl = document.getElementById('pc-token');
  const busyPaths = new Set();
  const lastSpace = new Map();
  let trailTimerBrowser = null;
  let trailTimerComputer = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const keyForPath = path => path === COMPUTER_DEVCONTAINER ? COMPUTER_GH_KEY : BROWSER_GH_KEY;
  const getTokenFor = path => localStorage.getItem(keyForPath(path)) || '';
  const uiForPath = path => path === COMPUTER_DEVCONTAINER ? {
    status: pcStatusEl, trail: document.getElementById('computer-trail'), ghSignal: document.getElementById('computer-gh-signal'), mcpSignal: document.getElementById('computer-mcp-signal'),
    open: document.getElementById('open-pc'), openLabel: document.getElementById('computer-open-label'), vs: document.getElementById('open-pc-vs'), vsLabel: document.getElementById('computer-vs-label'),
    stop: document.getElementById('stop-pc'), stopLabel: document.getElementById('computer-stop-label'), name: 'Computador', app: 'RustDesk'
  } : {
    status: statusEl, trail: document.getElementById('browser-trail'), ghSignal: document.getElementById('browser-gh-signal'), mcpSignal: document.getElementById('browser-mcp-signal'),
    open: document.getElementById('open'), openLabel: document.getElementById('browser-open-label'), vs: document.getElementById('open-browser-vs'), vsLabel: document.getElementById('browser-vs-label'),
    stop: document.getElementById('stop-browser'), stopLabel: document.getElementById('browser-stop-label'), name: 'Navegador', app: 'Chrome'
  };

  function migrateLegacyToken() {
    const legacy = localStorage.getItem(LEGACY_GH_KEY);
    if (!legacy) return;
    if (!localStorage.getItem(BROWSER_GH_KEY)) localStorage.setItem(BROWSER_GH_KEY, legacy);
    if (!localStorage.getItem(COMPUTER_GH_KEY)) localStorage.setItem(COMPUTER_GH_KEY, legacy);
    localStorage.removeItem(LEGACY_GH_KEY);
  }

  function paintStatus(el, text, type = '') {
    el.className = `status${type ? ` ${type}` : ''}`;
    el.textContent = text;
  }
  const setStatus = (text, type = '') => paintStatus(statusEl, text, type);
  const setPcStatus = (text, type = '') => paintStatus(pcStatusEl, text, type);
  const setStateForPath = (path, text, type = '') => paintStatus(uiForPath(path).status, text, type);

  function tokenUi(path) {
    return path === COMPUTER_DEVCONTAINER ? { card: pcConfigCard, input: pcTokenEl, setState: setPcStatus } : { card: ghConfigCard, input: tokenEl, setState: setStatus };
  }

  function friendlyGitHubError(status) {
    if (status === 401) return 'GitHub 401: token inválido ou expirado.';
    if (status === 403) return 'GitHub 403: o token não tem a permissão necessária.';
    if (status === 404) return 'GitHub 404: recurso não encontrado.';
    if (status === 409) return 'GitHub 409: operação temporariamente indisponível.';
    if (status === 422) return 'GitHub 422: o GitHub recusou a operação.';
    if (status >= 500) return 'O GitHub está temporariamente indisponível.';
    return `GitHub ${status}: não foi possível concluir a operação.`;
  }

  async function api(path, url, options = {}, acceptedStatuses = []) {
    const token = getTokenFor(path);
    if (!token) throw new Error('TOKEN_MISSING');
    const response = await fetch(url, {
      ...options, cache:'no-store', referrerPolicy:'no-referrer',
      headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'X-GitHub-Api-Version':'2026-03-10', ...(options.headers || {}) }
    });
    if (!response.ok && !acceptedStatuses.includes(response.status)) throw new Error(friendlyGitHubError(response.status));
    if (response.status === 204 || response.status === 304 || acceptedStatuses.includes(response.status)) return null;
    return response.json().catch(() => null);
  }

  async function listCodespaces(path) {
    const data = await api(path, REPO_API);
    const list = Array.isArray(data?.codespaces) ? data.codespaces : [];
    list.sort((a,b) => new Date(b.last_used_at || b.updated_at || 0) - new Date(a.last_used_at || a.updated_at || 0));
    return list;
  }
  const findByDevcontainer = (list, path) => list.find(space => space.devcontainer_path === path) || null;
  async function getSpace(path) { return findByDevcontainer(await listCodespaces(path), path); }

  function isStoppingState(state) { return ['ShuttingDown','Stopping'].includes(state); }
  function isStoppedState(state) { return ['Shutdown','Stopped','Created','Unavailable','Failed'].includes(state); }
  function isStartingState(state) { return ['Awaiting','Queued','Provisioning','Starting'].includes(state); }
  function spaceName(space) { return space?.display_name || space?.name || 'Codespace'; }
  function machineSummary(space) {
    const cpus = Number(space?.machine?.cpus || 0);
    const memory = Number(space?.machine?.memory_in_bytes || 0);
    const bits = [];
    if (cpus) bits.push(`${cpus} cores`);
    if (memory) bits.push(`${Math.round(memory / 1073741824)} GB`);
    if (!bits.length && space?.machine?.display_name) bits.push(space.machine.display_name);
    return bits.join(' · ');
  }

  function spaceView(space) {
    const state = space?.state || '';
    let label = state || 'DESCONHECIDO';
    let type = 'off';
    if (state === 'Available') { label = 'LIGADO'; type = 'good'; }
    else if (isStartingState(state)) { label = 'INICIANDO'; type = 'working'; }
    else if (isStoppingState(state)) { label = 'ENCERRANDO'; type = 'working'; }
    else if (isStoppedState(state)) { label = 'DESLIGADO'; type = 'off'; }
    const machine = machineSummary(space);
    return { text:`${label} · ${spaceName(space)}${machine ? ` · ${machine}` : ''}`, type, label };
  }

  function paintSignal(path, space) {
    const signal = uiForPath(path).ghSignal;
    const state = space?.state || '';
    let cls = 'unknown';
    let label = 'desconhecido';
    if (state === 'Available') { cls = 'good'; label = 'ligado'; }
    else if (isStartingState(state) || isStoppingState(state)) { cls = 'working'; label = isStoppingState(state) ? 'encerrando' : 'iniciando'; }
    else if (isStoppedState(state)) { cls = 'off'; label = 'desligado'; }
    signal.className = `signal ${cls}`;
    signal.title = `GitHub: ${label}${space ? ` — ${spaceName(space)}` : ''}`;
  }

  function paintMcpSignal(path, space, hint = '') {
    const signal = uiForPath(path).mcpSignal;
    const state = space?.state || '';
    let cls = 'unknown';
    let title = 'MCP: estado não observável pelo launcher';
    if (state === 'Available') {
      cls = 'working';
      title = hint || 'MCP: Codespace pronto; aguardando telemetria';
    } else if (isStartingState(state) || isStoppingState(state)) {
      cls = 'working';
      title = `MCP: aguardando Codespace ${isStoppingState(state) ? 'desligar' : 'iniciar'}`;
    } else if (isStoppedState(state) || !space) {
      cls = 'off';
      title = 'MCP: indisponível enquanto o Codespace estiver desligado';
    }
    signal.className = `signal ${cls}`;
    signal.title = title;
  }

  function mcpDetail(label, space) {
    const state = space?.state || '';
    if (state === 'Available') return `${label}: aguardando telemetria`;
    if (isStartingState(state)) return `${label}: aguardando Codespace iniciar`;
    if (isStoppingState(state)) return `${label}: Codespace encerrando`;
    if (isStoppedState(state) || !space) return `${label}: Codespace desligado`;
    return `${label}: estado do MCP não observável`;
  }

  function rememberSpace(path, space) {
    lastSpace.set(path, space || null);
    paintSignal(path, space);
    paintMcpSignal(path, space);
    updateDock();
  }

  function updateDock() {
    const browser = lastSpace.get(BROWSER_DEVCONTAINER) || null;
    const computer = lastSpace.get(COMPUTER_DEVCONTAINER) || null;
    const spaces = [browser, computer].filter(Boolean);
    const active = spaces.filter(space => space.state === 'Available').length;
    document.getElementById('github-active').textContent = `${active}/2 ativos`;
    document.getElementById('github-browser-detail').textContent = browser ? `Navegador: ${spaceView(browser).label.toLowerCase()}${machineSummary(browser) ? ` · ${machineSummary(browser)}` : ''}` : 'Navegador: não encontrado';
    document.getElementById('github-computer-detail').textContent = computer ? `Computador: ${spaceView(computer).label.toLowerCase()}${machineSummary(computer) ? ` · ${machineSummary(computer)}` : ''}` : 'Computador: não encontrado';
    document.getElementById('mcp-browser-detail').textContent = mcpDetail('Navegador',browser);
    document.getElementById('mcp-computer-detail').textContent = mcpDetail('Computador',computer);
  }

  function setBusy(path, busy, action = '') {
    const ui = uiForPath(path);
    if (busy) busyPaths.add(path); else busyPaths.delete(path);
    [ui.open, ui.vs, ui.stop].forEach(button => { button.disabled = busy; });
    ui.openLabel.textContent = action === 'open' ? `Abrindo ${ui.app}…` : (path === COMPUTER_DEVCONTAINER ? 'Computador' : 'Navegador');
    ui.vsLabel.textContent = action === 'vs' ? 'Abrindo VS…' : 'Abrir VS';
    ui.stopLabel.textContent = action === 'stop' ? 'Encerrando…' : 'Encerrar Codespace';
  }

  function trailTimerFor(path) { return path === COMPUTER_DEVCONTAINER ? trailTimerComputer : trailTimerBrowser; }
  function setTrailTimerFor(path, value) { if (path === COMPUTER_DEVCONTAINER) trailTimerComputer = value; else trailTimerBrowser = value; }
  function paintTrail(path, labels, activeIndex, doneThrough = -1, errorIndex = -1) {
    const el = uiForPath(path).trail;
    const oldTimer = trailTimerFor(path);
    if (oldTimer) clearTimeout(oldTimer);
    setTrailTimerFor(path, null);
    el.replaceChildren();
    labels.forEach((label, index) => {
      const step = document.createElement('span');
      step.className = 'trail-step';
      if (index <= doneThrough) step.classList.add('done');
      if (index === activeIndex) step.classList.add('active');
      if (index === errorIndex) { step.classList.remove('active','done'); step.classList.add('error'); }
      const mark = document.createElement('span');
      mark.className = 'trail-mark';
      const text = document.createElement('span');
      text.textContent = label;
      step.append(mark, text);
      el.append(step);
    });
    el.hidden = false;
  }
  function finishTrail(path, labels) {
    paintTrail(path,labels,-1,labels.length - 1);
    const timer = setTimeout(() => { uiForPath(path).trail.hidden = true; },2600);
    setTrailTimerFor(path,timer);
  }
  function failTrail(path, labels, index) { paintTrail(path,labels,-1,Math.max(-1,index - 1),index); }

  function popupMessage(tab, title, text) {
    try {
      const doc = tab.document;
      doc.title = title;
      doc.documentElement.setAttribute('lang','pt-BR');
      doc.head.replaceChildren();
      const meta = doc.createElement('meta'); meta.name = 'color-scheme'; meta.content = 'dark';
      const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('./styles.css',window.location.href).href;
      doc.head.append(meta,link);
      const card = doc.createElement('div'); card.className = 'popup-card';
      const heading = doc.createElement('h2'); heading.textContent = title;
      const paragraph = doc.createElement('p'); paragraph.textContent = text;
      card.append(heading,paragraph); doc.body.className = 'popup-body'; doc.body.replaceChildren(card);
    } catch (_) {}
  }


  async function refreshBrowserConfig() {
    if (!getTokenFor(BROWSER_DEVCONTAINER)) { if (!busyPaths.has(BROWSER_DEVCONTAINER)) setStatus('● Token do GitHub não configurado','bad'); paintSignal(BROWSER_DEVCONTAINER,null); paintMcpSignal(BROWSER_DEVCONTAINER,null); return; }
    if (!busyPaths.has(BROWSER_DEVCONTAINER)) setStatus('Verificando navegador…');
    try {
      const list = await listCodespaces(BROWSER_DEVCONTAINER);
      const browser = findByDevcontainer(list,BROWSER_DEVCONTAINER);
      const legacy = LEGACY_BROWSER_DEVCONTAINERS.map(path => findByDevcontainer(list,path)).find(Boolean);
      rememberSpace(BROWSER_DEVCONTAINER,browser);
      if (busyPaths.has(BROWSER_DEVCONTAINER)) return;
      if (browser) { const view = spaceView(browser); setStatus(view.text,view.type); }
      else if (legacy) setStatus(`● LEGADO detectado — ${spaceName(legacy)}`,'bad');
      else setStatus('NÃO CRIADO — o navegador será criado ao abrir','off');
    } catch (_) { if (!busyPaths.has(BROWSER_DEVCONTAINER)) setStatus('● Não foi possível verificar o navegador','bad'); }
  }

  async function refreshComputerConfig() {
    if (!getTokenFor(COMPUTER_DEVCONTAINER)) { if (!busyPaths.has(COMPUTER_DEVCONTAINER)) setPcStatus('● Token do GitHub não configurado','bad'); paintSignal(COMPUTER_DEVCONTAINER,null); paintMcpSignal(COMPUTER_DEVCONTAINER,null); return; }
    if (!busyPaths.has(COMPUTER_DEVCONTAINER)) setPcStatus('Verificando computador…');
    try {
      const list = await listCodespaces(COMPUTER_DEVCONTAINER);
      const pc = findByDevcontainer(list,COMPUTER_DEVCONTAINER);
      rememberSpace(COMPUTER_DEVCONTAINER,pc);
      if (busyPaths.has(COMPUTER_DEVCONTAINER)) return;
      if (pc) { const view = spaceView(pc); setPcStatus(view.text,view.type); }
      else setPcStatus('● NÃO CRIADO — falta criar o Codespace do computador','bad');
    } catch (_) { if (!busyPaths.has(COMPUTER_DEVCONTAINER)) setPcStatus('● Não foi possível verificar o computador','bad'); }
  }

  function refreshConfig() { void Promise.allSettled([refreshBrowserConfig(),refreshComputerConfig(),refreshGitHubUsage()]); }

  async function refreshGitHubUsage() {
    const token = getTokenFor(BROWSER_DEVCONTAINER) || getTokenFor(COMPUTER_DEVCONTAINER);
    const usageEl = document.getElementById('github-usage');
    const detailEl = document.getElementById('github-usage-detail');
    if (!token) { usageEl.textContent = 'uso —'; detailEl.textContent = 'Uso mensal: token não configurado'; return; }
    try {
      const userResponse = await fetch(USER_API,{ cache:'no-store', referrerPolicy:'no-referrer', headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'X-GitHub-Api-Version':'2026-03-10' } });
      if (!userResponse.ok) throw new Error('user');
      const user = await userResponse.json();
      const planName = String(user?.plan?.name || '').toLowerCase();
      const quota = planName.includes('pro') ? 180 : planName.includes('free') ? 120 : null;
      const now = new Date();
      const usageUrl = `https://api.github.com/users/${encodeURIComponent(user.login || OWNER)}/settings/billing/usage/summary?year=${now.getFullYear()}&month=${now.getMonth()+1}&product=Codespaces`;
      const response = await fetch(usageUrl,{ cache:'no-store', referrerPolicy:'no-referrer', headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'X-GitHub-Api-Version':'2026-03-10' } });
      if (response.status === 403 || response.status === 404) { usageEl.textContent = 'uso —'; detailEl.textContent = quota ? `Limite do plano: ${quota} core-h/mês · uso requer permissão Plan: read` : 'Uso mensal requer permissão Plan: read'; return; }
      if (!response.ok) throw new Error('billing');
      const data = await response.json();
      const items = Array.isArray(data?.usageItems) ? data.usageItems : [];
      const compute = items.filter(item => /codespaces/i.test(`${item.product || ''} ${item.sku || ''}`) && (/compute|core/i.test(`${item.sku || ''} ${item.unitType || ''}`)));
      let used = 0;
      let reliable = false;
      for (const item of compute) {
        const quantity = Number(item.grossQuantity ?? item.quantity ?? 0);
        const skuText = `${item.sku || ''} ${item.unitType || ''}`;
        const coreMatch = skuText.match(/(\d+)\s*core/i);
        if (coreMatch && Number.isFinite(quantity)) { used += quantity * Number(coreMatch[1]); reliable = true; }
        else if (/core.?hour/i.test(skuText) && Number.isFinite(quantity)) { used += quantity; reliable = true; }
      }
      if (quota && reliable) {
        const percent = Math.max(0,Math.round((used / quota) * 100));
        usageEl.textContent = `${percent}%`;
        detailEl.textContent = `${used.toFixed(1)} / ${quota} core-h neste mês`;
      } else {
        usageEl.textContent = 'uso —';
        detailEl.textContent = quota ? `Limite do plano: ${quota} core-h/mês · uso disponível, mas unidade não reconhecida` : 'Uso mensal disponível; limite do plano não identificado';
      }
    } catch (_) { usageEl.textContent = 'uso —'; detailEl.textContent = 'Uso mensal indisponível no momento'; }
  }

  async function waitAvailable(space,path,labels) {
    let current = space;
    let startRequested = false;
    const deadline = Date.now() + 180000;
    paintTrail(path,labels,1,0);
    while (Date.now() < deadline) {
      const state = current?.state || '';
      if (state === 'Available') { rememberSpace(path,current); paintTrail(path,labels,2,1); return current; }
      if (isStoppingState(state)) setStateForPath(path,'Aguardando o desligamento terminar…','working');
      else if (isStoppedState(state) && !startRequested) {
        setStateForPath(path,'LIGANDO · solicitação enviada ao GitHub','working');
        await api(path,current.start_url,{method:'POST'},[409]); startRequested = true;
      } else if (!isStartingState(state) && !startRequested) {
        setStateForPath(path,'LIGANDO · solicitação enviada ao GitHub','working');
        await api(path,current.start_url,{method:'POST'},[409]); startRequested = true;
      } else setStateForPath(path,`INICIANDO · ${state || 'aguardando GitHub'}`,'working');
      paintTrail(path,labels,2,0);
      await sleep(2500);
      const list = await listCodespaces(path);
      current = list.find(item => item.name === space.name) || current;
      rememberSpace(path,current);
      if (isStoppedState(current?.state) && startRequested) startRequested = false;
    }
    throw new Error('O Codespace demorou demais para iniciar.');
  }

  async function createBrowserSpace() {
    const list = await listCodespaces(BROWSER_DEVCONTAINER);
    const existing = findByDevcontainer(list,BROWSER_DEVCONTAINER);
    if (existing) return existing;
    setStateForPath(BROWSER_DEVCONTAINER,'Criando Codespace do navegador…','working');
    const created = await api(BROWSER_DEVCONTAINER,REPO_API,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ref:'main', devcontainer_path:BROWSER_DEVCONTAINER, display_name:'Navegador remoto' }) });
    if (created?.name) return created;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) { await sleep(2500); const found = await getSpace(BROWSER_DEVCONTAINER); if (found) return found; }
    throw new Error('O GitHub não concluiu a criação do Codespace Chrome.');
  }

  async function openSpace(path,title,description,targetLabel,openConfigOnMissing=false) {
    const ui = uiForPath(path);
    if (!getTokenFor(path)) { const {card,input} = tokenUi(path); card.open = true; setStateForPath(path,'● Token do GitHub não configurado','bad'); window.setTimeout(()=>input.focus(),0); return; }
    const tab = window.open('about:blank','_blank');
    if (!tab) return setStateForPath(path,'Libere pop-ups para este site.','bad');
    popupMessage(tab,title,description); try { tab.opener = null; } catch (_) {}
    const labels = ['Localizado','Ligando','GitHub pronto',`Abrindo ${targetLabel}`];
    setBusy(path,true,targetLabel === 'VS' ? 'vs' : 'open');
    paintTrail(path,labels,0,-1);
    try {
      setStateForPath(path,'Localizando Codespace…','working');
      let space = await getSpace(path);
      if (!space && path === BROWSER_DEVCONTAINER) space = await createBrowserSpace();
      if (!space) { if (openConfigOnMissing) pcConfigCard.open = true; throw new Error('Codespace do computador ainda não foi criado.'); }
      rememberSpace(path,space); paintTrail(path,labels,1,0);
      const ready = await waitAvailable(space,path,labels);
      const readyView = spaceView(ready);
      setStateForPath(path,`PRONTO · ${spaceName(ready)}${machineSummary(ready) ? ` · ${machineSummary(ready)}` : ''}`,'good');
      paintTrail(path,labels,3,2);
      await sleep(targetLabel === 'VS' ? 1200 : 7000);
      tab.location.replace(targetLabel === 'VS' ? (ready.web_url || `https://${ready.name}.github.dev/`) : `https://${ready.name}-3000.app.github.dev`);
      finishTrail(path,labels);
      setStateForPath(path,readyView.text,readyView.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível concluir a operação.';
      setStateForPath(path,`● ${message}`,'bad'); failTrail(path,labels,Math.min(3,Math.max(0,ui.trail.children.length - 1))); popupMessage(tab,'Não foi possível abrir',message);
    } finally { setBusy(path,false); refreshConfig(); }
  }


  function startAndOpen() { return openSpace(BROWSER_DEVCONTAINER,'Iniciando navegador…','Ligando o Codespace do navegador. Esta aba abrirá automaticamente.','Chrome'); }
  function openComputer() { return openSpace(COMPUTER_DEVCONTAINER,'Iniciando computador…','Ligando o Codespace do RustDesk. Esta aba abrirá automaticamente.','RustDesk',true); }
  function openBrowserVs() { return openSpace(BROWSER_DEVCONTAINER,'Iniciando VS do navegador…','Ligando o mesmo Codespace usado pelo navegador.','VS'); }
  function openComputerVs() { return openSpace(COMPUTER_DEVCONTAINER,'Iniciando VS do computador…','Ligando o mesmo Codespace usado pelo RustDesk.','VS',true); }
  function stopBrowser(openConfig=true) { return stopOne(BROWSER_DEVCONTAINER,openConfig); }
  function stopComputer(openConfig=true) { return stopOne(COMPUTER_DEVCONTAINER,openConfig); }

  async function stopEverything() {
    document.getElementById('stop-all').disabled = true;
    try { await Promise.allSettled([stopBrowser(false),stopComputer(false)]); }
    finally { document.getElementById('stop-all').disabled = false; refreshConfig(); }
  }

  async function saveToken(path,inputEl,setState) {
    const token = inputEl.value.trim(); if (!token) return setState('● Cole um token para substituir/testar o atual.','bad');
    const key = keyForPath(path); const previous = localStorage.getItem(key); localStorage.setItem(key,token); inputEl.value = ''; setState('Testando token…');
    try { await listCodespaces(path); path === COMPUTER_DEVCONTAINER ? void refreshComputerConfig() : void refreshBrowserConfig(); void refreshGitHubUsage(); }
    catch (_) { if (previous) localStorage.setItem(key,previous); else localStorage.removeItem(key); setState('● Token recusado ou sem permissão','bad'); }
  }
  function forgetToken(path) { localStorage.removeItem(keyForPath(path)); const {input} = tokenUi(path); input.value = ''; path === COMPUTER_DEVCONTAINER ? void refreshComputerConfig() : void refreshBrowserConfig(); void refreshGitHubUsage(); }

  document.getElementById('open').addEventListener('click',startAndOpen);
  document.getElementById('open-browser-vs').addEventListener('click',openBrowserVs);
  document.getElementById('open-pc').addEventListener('click',openComputer);
  document.getElementById('open-pc-vs').addEventListener('click',openComputerVs);
  document.getElementById('stop-browser').addEventListener('click',()=>stopBrowser(true));
  document.getElementById('stop-pc').addEventListener('click',()=>stopComputer(true));
  document.getElementById('stop-all').addEventListener('click',stopEverything);
  document.getElementById('save').addEventListener('click',()=>saveToken(BROWSER_DEVCONTAINER,tokenEl,setStatus));
  document.getElementById('pc-save').addEventListener('click',()=>saveToken(COMPUTER_DEVCONTAINER,pcTokenEl,setPcStatus));
  document.getElementById('forget').addEventListener('click',()=>forgetToken(BROWSER_DEVCONTAINER));
  document.getElementById('pc-forget').addEventListener('click',()=>forgetToken(COMPUTER_DEVCONTAINER));

  migrateLegacyToken();
  refreshConfig();
  window.setInterval(()=>{ if (!document.hidden) refreshConfig(); },15000);
  document.addEventListener('visibilitychange',()=>{ if (!document.hidden) refreshConfig(); });
})();
