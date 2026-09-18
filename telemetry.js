(() => {
  'use strict';

  const OWNER = 'nullhare';
  const REPO_API = `https://api.github.com/repos/${OWNER}/centralmidia/codespaces`;
  const USER_API = 'https://api.github.com/user';
  const API_VERSION = '2026-03-10';
  const BROWSER_PATH = '.devcontainer/browser-v4/devcontainer.json';
  const COMPUTER_PATH = '.devcontainer/computer/devcontainer.json';
  const TOKEN_KEYS = {
    [BROWSER_PATH]: 'centralmidia_browser_token_v2',
    [COMPUTER_PATH]: 'centralmidia_computer_token_v2'
  };
  const TARGETS = [
    { path: BROWSER_PATH, label: 'Navegador', signal: 'browser-mcp-signal', detail: 'mcp-browser-detail' },
    { path: COMPUTER_PATH, label: 'Computador', signal: 'computer-mcp-signal', detail: 'mcp-computer-detail' }
  ];
  const desired = new Map();
  const codespaceCache = new Map();
  let mcpBusy = false;
  let githubBusy = false;

  const tokenFor = path => localStorage.getItem(TOKEN_KEYS[path]) || '';
  const isStopped = state => ['Shutdown','Stopped','Created','Unavailable','Failed'].includes(state || '');
  const isTransitional = state => ['Awaiting','Queued','Provisioning','Starting','ShuttingDown','Stopping'].includes(state || '');

  async function fetchTimeout(url, options = {}, timeout = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try { return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' }); }
    finally { clearTimeout(timer); }
  }

  function storeText(id, text) {
    const current = desired.get(id) || {};
    desired.set(id, { ...current, text: String(text) });
    applyOne(id);
  }

  function storeSignal(id, cls, title) {
    const current = desired.get(id) || {};
    desired.set(id, { ...current, className: `signal ${cls}`, title });
    applyOne(id);
  }

  function applyOne(id) {
    const el = document.getElementById(id);
    const state = desired.get(id);
    if (!el || !state) return;
    if (state.text !== undefined && el.textContent !== state.text) el.textContent = state.text;
    if (state.className !== undefined && el.className !== state.className) el.className = state.className;
    if (state.title !== undefined && el.title !== state.title) el.title = state.title;
  }

  function applyAll() { for (const id of desired.keys()) applyOne(id); }

  async function githubJson(token, url) {
    const response = await fetchTimeout(url, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': API_VERSION }
    }, 8000);
    return { response, data: response.ok ? await response.json().catch(() => null) : null };
  }

  async function spacesForToken(token) {
    const now = Date.now();
    const cached = codespaceCache.get(token);
    if (cached && now - cached.at < 10000) return cached.value;
    const { response, data } = await githubJson(token, REPO_API);
    if (!response.ok) throw new Error(`github-${response.status}`);
    const value = Array.isArray(data?.codespaces) ? data.codespaces : [];
    codespaceCache.set(token, { at: now, value });
    return value;
  }

  async function spaceFor(target) {
    const token = tokenFor(target.path);
    if (!token) return { token: '', space: null };
    const spaces = await spacesForToken(token);
    return { token, space: spaces.find(item => item.devcontainer_path === target.path) || null };
  }

  async function bridgeJson(space, token, endpoint) {
    const url = `https://${space.name}-3000.app.github.dev/__centralmidia/mcp/${endpoint}`;
    const base = { credentials: 'include', mode: 'cors', redirect: 'error', headers: { Accept: 'application/json' } };
    try {
      const response = await fetchTimeout(url, base, 5500);
      if (response.ok) return await response.json();
      if (response.status !== 401 && response.status !== 403) throw new Error(`bridge-${response.status}`);
    } catch (_) {}
    if (!token) throw new Error('bridge-auth');
    const response = await fetchTimeout(url, {
      ...base,
      headers: { ...base.headers, 'X-Github-Token': token }
    }, 5500);
    if (!response.ok) throw new Error(`bridge-${response.status}`);
    return response.json();
  }

  function paintMcpTarget(target, space, health) {
    if (!space || isStopped(space.state)) {
      storeSignal(target.signal, 'off', 'MCP: Codespace desligado');
      storeText(target.detail, `${target.label}: Codespace desligado`);
      return false;
    }
    if (isTransitional(space.state)) {
      storeSignal(target.signal, 'working', `MCP: aguardando Codespace (${space.state})`);
      storeText(target.detail, `${target.label}: aguardando Codespace`);
      return false;
    }
    if (space.state !== 'Available') {
      storeSignal(target.signal, 'unknown', 'MCP: estado do Codespace desconhecido');
      storeText(target.detail, `${target.label}: estado não confirmado`);
      return false;
    }
    if (!health) {
      storeSignal(target.signal, 'working', 'MCP: bridge ainda não respondeu');
      storeText(target.detail, `${target.label}: estado MCP não confirmado`);
      return false;
    }
    if (health.online === true) {
      const version = health.appVersion ? ` · v${health.appVersion}` : '';
      storeSignal(target.signal, 'good', `MCP: ativo${version}`);
      storeText(target.detail, `${target.label}: ativo${version}`);
      return true;
    }
    const reason = health.reason || 'offline';
    const labels = {
      'process-offline': 'MCP não iniciado',
      'remote-offline': 'backend offline',
      'heartbeat-stale': 'heartbeat atrasado',
      'transport-unavailable': 'transporte indisponível',
      'device-session-missing': 'sessão MCP ausente',
      'remote-unreachable': 'backend não alcançável'
    };
    const text = labels[reason] || 'MCP inativo';
    storeSignal(target.signal, 'working', `MCP: ${text}`);
    storeText(target.detail, `${target.label}: ${text}`);
    return false;
  }

  async function refreshMcp() {
    if (mcpBusy) return;
    mcpBusy = true;
    try {
      let online = 0;
      const usable = [];
      for (const target of TARGETS) {
        try {
          const { token, space } = await spaceFor(target);
          let health = null;
          if (space?.state === 'Available') {
            try { health = await bridgeJson(space, token, 'health'); } catch (_) {}
            usable.push({ target, token, space });
          }
          if (paintMcpTarget(target, space, health)) online++;
        } catch (_) {
          storeSignal(target.signal, 'unknown', 'MCP: não foi possível consultar o Codespace');
          storeText(target.detail, `${target.label}: consulta indisponível`);
        }
      }
      storeText('mcp-active', `${online}/2 ativos`);

      let usage = null;
      for (const item of usable) {
        try {
          const value = await bridgeJson(item.space, item.token, 'usage');
          if (value?.available === true) { usage = value; break; }
        } catch (_) {}
      }
      if (usage) {
        const used = Number(usage.usedPct);
        const left = Number(usage.leftPct);
        storeText('mcp-usage', `${Math.round(used)}% usado`);
        storeText('mcp-usage-detail', `Uso remoto: ${used.toFixed(0)}% usado · ${left.toFixed(0)}% restante · referência Free: 10.000 chamadas/mês`);
      } else {
        storeText('mcp-usage', 'uso indisponível');
        storeText('mcp-usage-detail', 'Uso remoto: aguardando bridge MCP ativo no Codespace');
      }
    } finally { mcpBusy = false; }
  }

  function quotaForPlan(plan) {
    const value = String(plan || '').toLowerCase();
    if (value.includes('pro')) return 180;
    if (value.includes('free')) return 120;
    return null;
  }

  function codespacesCoreHours(items) {
    let used = 0;
    let matched = false;
    for (const item of Array.isArray(items) ? items : []) {
      const sku = String(item?.sku || '').toLowerCase();
      const product = String(item?.product || '').toLowerCase();
      if (product !== 'codespaces' && !sku.startsWith('codespaces_')) continue;
      const match = sku.match(/^codespaces_compute_d(2|4|8|16|32)$/i);
      let cores = match ? Number(match[1]) : null;
      if (!cores) {
        const textMatch = `${item?.sku || ''} ${item?.unitType || ''}`.match(/(2|4|8|16|32)[ -]?core/i);
        cores = textMatch ? Number(textMatch[1]) : null;
      }
      if (!cores) continue;
      const quantity = Number(item?.grossQuantity ?? item?.quantity ?? 0);
      if (!Number.isFinite(quantity)) continue;
      const unit = String(item?.unitType || '').toLowerCase();
      let hours = quantity;
      if (unit.includes('minute')) hours /= 60;
      else if (unit.includes('second')) hours /= 3600;
      used += hours * cores;
      matched = true;
    }
    return { used, matched };
  }

  async function refreshGitHubUsage() {
    if (githubBusy) return;
    githubBusy = true;
    try {
      const tokens = [...new Set(TARGETS.map(target => tokenFor(target.path)).filter(Boolean))];
      if (!tokens.length) {
        storeText('github-usage', 'uso —');
        storeText('github-usage-detail', 'Uso mensal: token GitHub não configurado');
        return;
      }
      let fallbackQuota = null;
      let sawPlan = false;
      for (const token of tokens) {
        try {
          const userResult = await githubJson(token, USER_API);
          if (!userResult.response.ok || !userResult.data) continue;
          const user = userResult.data;
          const quota = quotaForPlan(user?.plan?.name);
          if (quota) { fallbackQuota = quota; sawPlan = true; }
          const now = new Date();
          const url = `https://api.github.com/users/${encodeURIComponent(user.login || OWNER)}/settings/billing/usage/summary?year=${now.getFullYear()}&month=${now.getMonth()+1}&product=Codespaces`;
          const billing = await githubJson(token, url);
          if (!billing.response.ok) continue;
          const result = codespacesCoreHours(billing.data?.usageItems);
          const used = result.used;
          if (quota) {
            const pct = Math.max(0, Math.round((used / quota) * 100));
            const remaining = Math.max(0, 100 - pct);
            storeText('github-usage', `${pct}% usado`);
            storeText('github-usage-detail', `Compute: ${used.toFixed(1)} / ${quota} core-h neste mês · ${remaining}% restante`);
          } else {
            storeText('github-usage', `${used.toFixed(1)} core-h`);
            storeText('github-usage-detail', `Compute Codespaces: ${used.toFixed(1)} core-h neste mês`);
          }
          return;
        } catch (_) {}
      }
      if (fallbackQuota) {
        storeText('github-usage', `${fallbackQuota} core-h limite`);
        storeText('github-usage-detail', `Limite incluído: ${fallbackQuota} core-h/mês · uso detalhado requer token com Plan: read`);
      } else {
        storeText('github-usage', 'uso —');
        storeText('github-usage-detail', sawPlan ? 'Uso mensal indisponível' : 'Plano/uso mensal não disponível com o token atual');
      }
    } finally { githubBusy = false; }
  }

  function refreshAll() {
    void refreshMcp();
    void refreshGitHubUsage();
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      let el = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
      while (el && !desired.has(el.id)) el = el.parentElement;
      if (el?.id) applyOne(el.id);
    }
  });

  function start() {
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class','title'] });
    refreshAll();
    setInterval(() => void refreshMcp(), 6000);
    setInterval(() => void refreshGitHubUsage(), 300000);
    window.addEventListener('focus', refreshAll);
    window.addEventListener('storage', () => { codespaceCache.clear(); refreshAll(); });
    setInterval(applyAll, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
