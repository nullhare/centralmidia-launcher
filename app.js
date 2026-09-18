(() => {
  'use strict';

  const REPO_API = 'https://api.github.com/repos/nullhare/centralmidia/codespaces';
  const LEGACY_GH_KEY = 'centralmidia_codespaces_token_v1';
  const BROWSER_GH_KEY = 'centralmidia_browser_token_v2';
  const COMPUTER_GH_KEY = 'centralmidia_computer_token_v2';
  const BROWSER_DEVCONTAINER = '.devcontainer/browser-v4/devcontainer.json';
  const LEGACY_BROWSER_DEVCONTAINERS = [
    '.devcontainer/browser-v3/devcontainer.json',
    '.devcontainer/browser-v2/devcontainer.json',
    '.devcontainer/browser/devcontainer.json',
    '.devcontainer/devcontainer.json'
  ];
  const COMPUTER_DEVCONTAINER = '.devcontainer/computer/devcontainer.json';

  const statusEl = document.getElementById('status');
  const pcStatusEl = document.getElementById('pc-status');
  const ghConfigCard = document.getElementById('gh-config-card');
  const pcConfigCard = document.getElementById('pc-config-card');
  const tokenEl = document.getElementById('token');
  const pcTokenEl = document.getElementById('pc-token');

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const keyForPath = path => path === COMPUTER_DEVCONTAINER ? COMPUTER_GH_KEY : BROWSER_GH_KEY;
  const getTokenFor = path => localStorage.getItem(keyForPath(path)) || '';

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

  function tokenUi(path) {
    return path === COMPUTER_DEVCONTAINER
      ? { card: pcConfigCard, input: pcTokenEl, setState: setPcStatus }
      : { card: ghConfigCard, input: tokenEl, setState: setStatus };
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
      ...options,
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2026-03-10',
        ...(options.headers || {})
      }
    });

    if (!response.ok && !acceptedStatuses.includes(response.status)) {
      throw new Error(friendlyGitHubError(response.status));
    }

    if (response.status === 204 || response.status === 304 || acceptedStatuses.includes(response.status)) {
      return null;
    }
    return response.json().catch(() => null);
  }

  async function listCodespaces(path) {
    const data = await api(path, REPO_API);
    const list = Array.isArray(data?.codespaces) ? data.codespaces : [];
    list.sort((a, b) => new Date(b.last_used_at || b.updated_at || 0) - new Date(a.last_used_at || a.updated_at || 0));
    return list;
  }

  function findByDevcontainer(list, path) {
    return list.find(space => space.devcontainer_path === path) || null;
  }

  async function getSpace(path) {
    const list = await listCodespaces(path);
    return findByDevcontainer(list, path);
  }

  async function refreshBrowserConfig() {
    if (!getTokenFor(BROWSER_DEVCONTAINER)) {
      setStatus('● Token do GitHub não configurado', 'bad');
      return;
    }
    setStatus('Verificando navegador…');
    try {
      const list = await listCodespaces(BROWSER_DEVCONTAINER);
      const browser = findByDevcontainer(list, BROWSER_DEVCONTAINER);
      const legacyBrowser = LEGACY_BROWSER_DEVCONTAINERS.map(path => findByDevcontainer(list, path)).find(Boolean);
      if (browser) {
        const view = spaceStatus(browser, 'Navegador');
        setStatus(view.text, view.type);
      } else if (legacyBrowser) {
        setStatus(`● LEGADO detectado — ${spaceName(legacyBrowser)}`, 'bad');
      } else {
        setStatus('NÃO CRIADO — o navegador será criado ao abrir', 'off');
      }
    } catch (_) {
      setStatus('● Não foi possível verificar o navegador', 'bad');
    }
  }

  async function refreshComputerConfig() {
    if (!getTokenFor(COMPUTER_DEVCONTAINER)) {
      setPcStatus('● Token do GitHub não configurado', 'bad');
      return;
    }
    setPcStatus('Verificando Codespace do computador…');
    try {
      const list = await listCodespaces(COMPUTER_DEVCONTAINER);
      const pc = findByDevcontainer(list, COMPUTER_DEVCONTAINER);
      if (pc) {
        const view = spaceStatus(pc, 'Computador');
        setPcStatus(view.text, view.type);
      } else {
        setPcStatus('● NÃO CRIADO — falta criar o Codespace do computador', 'bad');
      }
    } catch (_) {
      setPcStatus('● Não foi possível verificar o computador', 'bad');
    }
  }

  function refreshConfig() {
    void Promise.allSettled([refreshBrowserConfig(), refreshComputerConfig()]);
  }

  function restoreConfigStatus(delay = 1800) {
    window.setTimeout(refreshConfig, delay);
  }

  function popupMessage(tab, title, text) {
    try {
      const doc = tab.document;
      doc.title = title;
      doc.documentElement.setAttribute('lang', 'pt-BR');
      doc.head.replaceChildren();
      const meta = doc.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = 'dark';
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('./styles.css', window.location.href).href;
      doc.head.append(meta, link);

      const card = doc.createElement('div');
      card.className = 'popup-card';
      const heading = doc.createElement('h2');
      heading.textContent = title;
      const paragraph = doc.createElement('p');
      paragraph.textContent = text;
      card.append(heading, paragraph);
      doc.body.className = 'popup-body';
      doc.body.replaceChildren(card);
    } catch (_) {}
  }

  function isStoppingState(state) {
    return ['ShuttingDown', 'Stopping'].includes(state);
  }

  function isStoppedState(state) {
    return ['Shutdown', 'Stopped', 'Created', 'Unavailable', 'Failed'].includes(state);
  }

  function isStartingState(state) {
    return ['Awaiting', 'Queued', 'Provisioning', 'Starting'].includes(state);
  }

  function spaceName(space) {
    return space?.display_name || space?.name || 'Codespace';
  }

  function machineName(space) {
    const machine = space?.machine?.display_name || space?.machine?.name || '';
    return machine ? ` · ${machine}` : '';
  }

  function spaceStatus(space, fallbackName) {
    const state = space?.state || '';
    let label = state || 'DESCONHECIDO';
    let type = 'off';
    if (state === 'Available') {
      label = 'LIGADO';
      type = 'good';
    } else if (isStartingState(state)) {
      label = 'INICIANDO';
      type = 'working';
    } else if (isStoppingState(state)) {
      label = 'ENCERRANDO';
      type = 'working';
    } else if (isStoppedState(state)) {
      label = 'DESLIGADO';
      type = 'off';
    }
    return {
      text: `${label} — ${spaceName(space) || fallbackName}${machineName(space)}`,
      type
    };
  }

  async function waitAvailable(space, path, setState) {
    let current = space;
    let startRequested = false;
    const deadline = Date.now() + 180000;

    while (Date.now() < deadline) {
      const state = current?.state || '';
      if (state === 'Available') return current;

      if (isStoppingState(state)) {
        setState('Aguardando o desligamento terminar…');
        startRequested = false;
      } else if (isStoppedState(state) && !startRequested) {
        setState('Ligando Codespace…');
        await api(path, current.start_url, { method: 'POST' }, [409]);
        startRequested = true;
      } else if (!isStartingState(state) && !startRequested) {
        setState('Ligando Codespace…');
        await api(path, current.start_url, { method: 'POST' }, [409]);
        startRequested = true;
      } else {
        setState(`Iniciando… ${state}`.trim());
      }

      await sleep(2500);
      const list = await listCodespaces(path);
      current = list.find(item => item.name === space.name) || current;

      if (isStoppedState(current?.state) && startRequested) {
        startRequested = false;
      }
    }

    throw new Error('O Codespace demorou demais para iniciar.');
  }

  async function createBrowserSpace(setState) {
    const list = await listCodespaces(BROWSER_DEVCONTAINER);
    const existing = findByDevcontainer(list, BROWSER_DEVCONTAINER);
    if (existing) return existing;

    const legacySpaces = LEGACY_BROWSER_DEVCONTAINERS
      .map(path => findByDevcontainer(list, path))
      .filter(Boolean);
    const runningLegacy = legacySpaces.filter(space => space.state === 'Available');
    if (runningLegacy.length) {
      setState('Desligando navegador antigo…');
      await Promise.all(runningLegacy.map(space => api(BROWSER_DEVCONTAINER, space.stop_url, { method: 'POST' }, [409])));
    }

    setState('Criando Chrome…');
    let created;
    try {
      created = await api(BROWSER_DEVCONTAINER, REPO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref: 'main',
          devcontainer_path: BROWSER_DEVCONTAINER,
          display_name: 'Navegador Google Chrome'
        })
      });
    } catch (err) {
      if (/GitHub 403/.test(err.message)) {
        throw new Error('O token do navegador não tem permissão para criar o Codespace Chrome.');
      }
      throw err;
    }

    if (created?.name) return created;

    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      await sleep(2500);
      const found = await getSpace(BROWSER_DEVCONTAINER);
      if (found) return found;
    }
    throw new Error('O GitHub não concluiu a criação do Codespace Chrome.');
  }

  async function openSpace(path, title, description, setState, openConfigOnMissing = false) {
    if (!getTokenFor(path)) {
      const { card, input } = tokenUi(path);
      card.open = true;
      setState('● Token do GitHub não configurado', 'bad');
      window.setTimeout(() => input.focus(), 0);
      return;
    }

    const tab = window.open('about:blank', '_blank');
    if (!tab) return setState('Libere pop-ups para este site.', 'bad');
    popupMessage(tab, title, description);
    try { tab.opener = null; } catch (_) {}

    try {
      setState('Localizando Codespace…');
      let space = await getSpace(path);
      if (!space && path === BROWSER_DEVCONTAINER) {
        space = await createBrowserSpace(setState);
      }
      if (!space) {
        if (openConfigOnMissing) pcConfigCard.open = true;
        throw new Error('Codespace do computador ainda não foi criado.');
      }
      const ready = await waitAvailable(space, path, setState);
      setState('Abrindo…');
      await sleep(7000);
      tab.location.replace(`https://${ready.name}-3000.app.github.dev`);
      refreshConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível concluir a operação.';
      setState(`● ${message}`, 'bad');
      popupMessage(tab, 'Não foi possível abrir', message);
    }
  }

  function startAndOpen() {
    return openSpace(
      BROWSER_DEVCONTAINER,
      'Iniciando navegador…',
      'Ligando o Codespace do navegador. Esta aba abrirá automaticamente.',
      setStatus
    );
  }

  function openComputer() {
    return openSpace(
      COMPUTER_DEVCONTAINER,
      'Iniciando computador…',
      'Ligando o Codespace do RustDesk. O controle do Zorin abrirá por dentro do Codespace.',
      setPcStatus,
      true
    );
  }

  async function openVsSpace(path, label, setState, openConfigOnMissing = false) {
    if (!getTokenFor(path)) {
      const { card, input } = tokenUi(path);
      card.open = true;
      setState('● Token do GitHub não configurado', 'bad');
      window.setTimeout(() => input.focus(), 0);
      return;
    }

    const tab = window.open('about:blank', '_blank');
    if (!tab) return setState('Libere pop-ups para este site.', 'bad');
    popupMessage(tab, `Iniciando VS do ${label}…`, 'Ligando o mesmo Codespace usado pelo ambiente remoto.');
    try { tab.opener = null; } catch (_) {}

    try {
      setState(`Localizando Codespace do ${label}…`);
      let space = await getSpace(path);
      if (!space && path === BROWSER_DEVCONTAINER) {
        space = await createBrowserSpace(setState);
      }
      if (!space) {
        if (openConfigOnMissing) pcConfigCard.open = true;
        throw new Error(`Codespace do ${label} ainda não foi criado.`);
      }
      const ready = await waitAvailable(space, path, setState);
      setState(`Abrindo VS — ${spaceName(ready)}`);
      await sleep(1200);
      tab.location.replace(ready.web_url || `https://${ready.name}.github.dev/`);
      refreshConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível abrir o VS.';
      setState(`● ${message}`, 'bad');
      popupMessage(tab, 'Não foi possível abrir o VS', message);
    }
  }

  function openBrowserVs() {
    return openVsSpace(BROWSER_DEVCONTAINER, 'navegador', setStatus);
  }

  function openComputerVs() {
    return openVsSpace(COMPUTER_DEVCONTAINER, 'computador', setPcStatus, true);
  }

  async function stopSpace(path, setState, openConfigOnMissing = false) {
    if (!getTokenFor(path)) {
      const { card } = tokenUi(path);
      card.open = true;
      setState('● Token do GitHub não configurado', 'bad');
      return false;
    }

    try {
      setState('Localizando Codespace…');
      const space = await getSpace(path);
      if (!space) {
        if (openConfigOnMissing) pcConfigCard.open = true;
        setState('● Codespace ainda não foi criado', 'bad');
        return false;
      }
      if (space.state !== 'Available') {
        const view = spaceStatus(space, 'Codespace');
        setState(view.text, view.type);
        restoreConfigStatus();
        return true;
      }
      setState(`ENCERRANDO — ${spaceName(space)}`, 'working');
      await api(path, space.stop_url, { method: 'POST' }, [409]);
      restoreConfigStatus();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível desligar.';
      setState(`● ${message}`, 'bad');
      return false;
    }
  }

  async function stopBrowser(openConfig = true) {
    if (!getTokenFor(BROWSER_DEVCONTAINER)) {
      if (openConfig) ghConfigCard.open = true;
      setStatus('● Token do GitHub não configurado', 'bad');
      return false;
    }

    try {
      setStatus('Localizando Codespace do navegador…');
      const list = await listCodespaces(BROWSER_DEVCONTAINER);
      const space = findByDevcontainer(list, BROWSER_DEVCONTAINER);
      if (!space) {
        const legacy = LEGACY_BROWSER_DEVCONTAINERS.map(path => findByDevcontainer(list, path)).find(Boolean);
        setStatus(legacy ? `● O navegador atual não existe; legado encontrado: ${spaceName(legacy)}` : 'Navegador atual ainda não foi criado.', legacy ? 'bad' : 'off');
        restoreConfigStatus();
        return false;
      }

      if (space.state !== 'Available') {
        const view = spaceStatus(space, 'Navegador');
        setStatus(view.text, view.type);
        restoreConfigStatus();
        return true;
      }

      setStatus(`ENCERRANDO — ${spaceName(space)}`, 'working');
      await api(BROWSER_DEVCONTAINER, space.stop_url, { method: 'POST' }, [409]);
      restoreConfigStatus(2500);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível desligar.';
      setStatus(`● ${message}`, 'bad');
      return false;
    }
  }

  function stopComputer(openConfig = true) {
    return stopSpace(COMPUTER_DEVCONTAINER, setPcStatus, openConfig);
  }

  async function stopEverything() {
    setStatus('ENCERRAR TUDO — navegador…', 'working');
    setPcStatus('ENCERRAR TUDO — computador…', 'working');
    await Promise.allSettled([
      stopBrowser(false),
      stopComputer(false)
    ]);
    restoreConfigStatus(3000);
  }

  async function saveToken(path, inputEl, setState) {
    const token = inputEl.value.trim();
    if (!token) return setState('● Cole um token para substituir/testar o atual.', 'bad');

    const key = keyForPath(path);
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, token);
    inputEl.value = '';
    setState('Testando token…');

    try {
      await listCodespaces(path);
      path === COMPUTER_DEVCONTAINER ? void refreshComputerConfig() : void refreshBrowserConfig();
    } catch (_) {
      if (previous) localStorage.setItem(key, previous);
      else localStorage.removeItem(key);
      setState('● Token recusado ou sem permissão', 'bad');
    }
  }

  function forgetToken(path) {
    localStorage.removeItem(keyForPath(path));
    const { input } = tokenUi(path);
    input.value = '';
    path === COMPUTER_DEVCONTAINER ? void refreshComputerConfig() : void refreshBrowserConfig();
  }

  document.getElementById('open').addEventListener('click', startAndOpen);
  document.getElementById('open-browser-vs').addEventListener('click', openBrowserVs);
  document.getElementById('open-pc').addEventListener('click', openComputer);
  document.getElementById('open-pc-vs').addEventListener('click', openComputerVs);
  document.getElementById('stop-browser').addEventListener('click', () => stopBrowser(true));
  document.getElementById('stop-pc').addEventListener('click', () => stopComputer(true));
  document.getElementById('stop-all').addEventListener('click', stopEverything);
  document.getElementById('save').addEventListener('click', () => saveToken(BROWSER_DEVCONTAINER, tokenEl, setStatus));
  document.getElementById('pc-save').addEventListener('click', () => saveToken(COMPUTER_DEVCONTAINER, pcTokenEl, setPcStatus));
  document.getElementById('forget').addEventListener('click', () => forgetToken(BROWSER_DEVCONTAINER));
  document.getElementById('pc-forget').addEventListener('click', () => forgetToken(COMPUTER_DEVCONTAINER));

  migrateLegacyToken();
  refreshConfig();
  window.setInterval(() => {
    if (!document.hidden) refreshConfig();
  }, 15000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshConfig();
  });
})();
