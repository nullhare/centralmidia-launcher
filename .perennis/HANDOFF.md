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
- Revisão verificada: `9b139110f25db74e57db15e6c6a6098f45575674`
- Estado atualizado em: `2026-09-19T14:49:49Z`

## Último resultado

Fluxo de encerramento do launcher permanece restaurado em 0679384c88d2d005d03e491856029d0faf9a67f3. A origem GitHub Pages permanece reduzida a 404 genérico sem pistas do produto. O gateway autenticado já tinha GitHub OAuth + PKCE S256, autorização pelo GitHub user ID estável 318746268, sessão HMAC em cookie Secure/HttpOnly/SameSite=Lax e assets operacionais fixados na revisão 0679384c88d2d005d03e491856029d0faf9a67f3. Nesta continuação do mesmo //gravar foi adicionada a entrada de runtime para Vercel em middleware.js, delegando todas as requisições ao worker autenticado, mais secure-gateway/vercel.test.mjs e gates de CI para impedir reintrodução de index.html público ou pistas no 404. Produto atual 9b139110f25db74e57db15e6c6a6098f45575674; Secure Gateway CI 35449874425 success; Pages 35449873657 success. O acesso final, quando publicado, será pela URL de produção do host Vercel na raiz /, que redireciona sem sessão para /login, autentica no GitHub e retorna por /oauth/callback.

## Próxima ação

Retomar este mesmo //gravar sem nova aprovação assim que a integração Vercel estiver conectada a uma conta/time: criar/publicar o projeto a partir da raiz do repositório, obter a URL de produção, registrar um GitHub OAuth App com callback https://<host>/oauth/callback, configurar GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET, APP_ORIGIN, ALLOWED_GITHUB_USER_ID e ASSET_REVISION no host, e então validar E2E conta autorizada, conta não autorizada (403), logout e entrega autenticada do launcher. O endereço de uso será a raiz da URL de produção Vercel; o github.io deve continuar apenas como 404 genérico.

## Checkpoint seguro

O //gravar de autenticação continua aberto e autorizado. main contém 9b139110f25db74e57db15e6c6a6098f45575674. GitHub Pages continua sem index.html e serve somente 404 genérico. middleware.js já torna a raiz de um futuro deployment Vercel o ponto de entrada autenticado e secure-gateway/vercel.test.mjs prova raiz sem sessão -> /login e redirect OAuth com callback configurado. secure-gateway/src/worker.js continua implementando OAuth GitHub com PKCE, allowlist pelo ID 318746268 e sessão HttpOnly; secure-gateway/test.mjs cobre callback autorizado, asset autenticado e 403 para ID divergente. GITHUB_CLIENT_SECRET e SESSION_SECRET permanecem fora do repositório. Não refazer esta implementação nem pedir nova aprovação: quando Vercel for conectado, executar somente deploy/configuração externa, criar/configurar OAuth App, validar E2E real e fechar continuidade.

## Bloqueios

- A integração Vercel está disponível no diretório, porém não está conectada a uma conta/time nesta sessão: list_teams retornou zero times e a ação de deploy não está disponível enquanto a conexão não for concluída pelo usuário.
- A criação/configuração do GitHub OAuth App é uma ação de conta que o conector GitHub atual não expõe. Depois de existir a URL de produção, o OAuth App precisa ser registrado com callback https://<host>/oauth/callback e seu client secret fornecido ao host como secret, nunca commitado.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Public Pages operational launcher withdrawal (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
- `pass` — Authenticated gateway static and mocked OAuth flow (`bd447279c9456240f7062ba089fc5c98f3ffef61`)
- `pass` — Authentication secrets boundary (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Public Pages generic 404 minimization (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Vercel authenticated gateway entrypoint (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `blocked` — Real authenticated host end-to-end (`9b139110f25db74e57db15e6c6a6098f45575674`)
