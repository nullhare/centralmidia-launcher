# Handoff

<!-- Gerado mecanicamente de .perennis/STATE.json; não edite separadamente. -->

## Estado operacional

- Projeto: Central Mídia Launcher
- Alias: `ctml`
- Repositório: `nullhare/centralmidia-launcher`
- Branch canônica: `main`
- Status: `active`
- SP adotado: `3.3.1` (`656db308e7ad1ccad15637bcf857cc28d6facb49`)
- Versão do projeto: `não declarada`
- Tarefa ativa: `ctml-authenticated-launcher-gateway-20260919`
- Revisão verificada: `bd447279c9456240f7062ba089fc5c98f3ffef61`
- Estado atualizado em: `2026-09-19T05:48:37Z`

## Último resultado

Fluxo de encerramento do launcher restaurado em 0679384c88d2d005d03e491856029d0faf9a67f3 (Pages 35423705022 success). Em seguida, o resultado aprovado pelo //crivoT foi materializado até o limite executável: o GitHub Pages público deixou de entregar a UI operacional e agora mostra somente uma tela inócua de acesso privado; foi criado secure-gateway/ com GitHub OAuth + PKCE S256, autorização pelo GitHub user ID estável 318746268, sessão HMAC em cookie Secure/HttpOnly/SameSite=Lax, token OAuth usado somente server-side para /user e descartado, assets operacionais fixados na revisão 0679384c88d2d005d03e491856029d0faf9a67f3, mantendo PATs de Codespaces e chaves de telemetria separados no navegador. Produto atual bd447279c9456240f7062ba089fc5c98f3ffef61; Secure Gateway CI 35424893846 success; Pages 35424892998 success; artefato Pages confirmado sem referências operacionais no index.html.

## Próxima ação

Retomar o mesmo //gravar sem nova aprovação quando houver acesso a um host serverless/HTTPS e à configuração de um GitHub OAuth App: registrar callback https://<host>/oauth/callback, configurar GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET, APP_ORIGIN e ALLOWED_GITHUB_USER_ID, publicar secure-gateway/, validar conta autorizada, conta não autorizada (403), logout e entrega autenticada do launcher. Manter GitHub Pages público não operacional; não substituir os PATs/chaves de telemetria por OAuth nesta parcela.

## Checkpoint seguro

O //gravar de autenticação continua aberto e autorizado, porém estacionado em checkpoint seguro. main contém bd447279c9456240f7062ba089fc5c98f3ffef61. O endereço github.io não entrega mais o painel operacional. secure-gateway/src/worker.js implementa OAuth GitHub com PKCE, allowlist pelo ID 318746268 e sessão HttpOnly; secure-gateway/test.mjs prova redirect sem sessão, callback autorizado, asset autenticado e 403 para ID divergente. secure-gateway/wrangler.jsonc contém somente placeholders/vars não secretas; GITHUB_CLIENT_SECRET e SESSION_SECRET nunca foram commitidos. Os assets operacionais estão pinados em 0679384c88d2d005d03e491856029d0faf9a67f3. Ao retomar, não refazer esta implementação nem pedir nova aprovação: executar somente setup/deploy externo, E2E real, atualizar ASSET_REVISION se houver novo produto aprovado e fechar continuidade.

## Bloqueios

- Fechamento live do gateway depende de recursos externos não disponíveis ao executor atual: criação/configuração de GitHub OAuth App e um host serverless/HTTPS (por exemplo Cloudflare Workers) com armazenamento de secrets. Nenhum conector de implantação desse provedor está disponível nesta sessão e nenhuma credencial/host foi fornecido.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Public Pages operational launcher withdrawal (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
- `pass` — Authenticated gateway static and mocked OAuth flow (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
- `pass` — Authentication secrets boundary (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
- `blocked` — Real authenticated host end-to-end (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
