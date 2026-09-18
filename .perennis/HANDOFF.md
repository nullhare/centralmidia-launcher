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
- Tarefa ativa: `nenhuma`
- Revisão verificada: `c888947b5b8b73558d13386f60b29376e1cfac52`
- Estado atualizado em: `2026-09-18T23:38:57Z`

## Último resultado

Crivo aprovado materializado na revisão de produto c888947b5b8b73558d13386f60b29376e1cfac52 e publicado em main por 35914d8beb52720e46129e7519f848b159ae6a11. telemetry.js não encaminha mais o token local do launcher para *.app.github.dev; /health e /usage usam somente a sessão GitHub do navegador na porta privada. Falhas de autenticação/acesso entram em estado explícito e backoff exponencial por endpoint de 15s a 5min, com nova tentativa imediata ao voltar ao foco/storage. SECURITY.md foi reconciliado. node --check em telemetry.js e app.js, git diff --check e invariantes de ausência de X-Github-Token passaram. GitHub Pages run 35406445389 publicou 35914d8beb52720e46129e7519f848b159ae6a11 com conclusão success.

## Próxima ação

Validar no navegador do usuário: com Browser e Computer ativos, abrir cada porta privada pelo botão Navegador/Computador quando a UI indicar autenticação necessária, retornar ao launcher e confirmar 2/2 MCPs e /usage sem envio de PAT ao bridge. Se a chamada CORS continuar bloqueada mesmo após autenticação explícita da porta, considerar refutado o caminho private-first direto e promover somente então o plano B já crivado: endpoint separado, chave própria e escopo mínimo health/usage.

## Checkpoint seguro

CTML mantém private-first. Produto c888947b5b8b73558d13386f60b29376e1cfac52 publicado via main 35914d8beb52720e46129e7519f848b159ae6a11 e Pages run 35406445389 success: PAT/token do launcher permanece restrito à API GitHub e não é enviado a *.app.github.dev; autenticação do bridge privado usa somente a sessão do navegador; falhas entram em backoff/reconexão controlada e instrução de autenticação. O runtime MCP de /mg/ctm já estava validado. Fallback público continua apenas plano B não implementado, limitado a health/usage e sem privilégio lateral.

## Bloqueios

- A validação end-to-end da nova travessia privada depende da sessão autenticada do navegador do usuário; essa sessão/cookie/localStorage não deve ser exportada para agente, código, logs ou repositório.

## Validações registradas

- `pass` — Launcher telemetry source and Pages deployment (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pass` — Central Midia MCP bridge dependency after rebuild (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pending` — Authenticated launcher UI end-to-end telemetry (`revisão não registrada`)
- `pass` — Private-port authentication hardening static validation (`c888947b5b8b73558d13386f60b29376e1cfac52`)
- `pass` — Private-port authentication hardening Pages deployment (`35914d8beb52720e46129e7519f848b159ae6a11`)
