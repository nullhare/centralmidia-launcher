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
- Revisão verificada: `8663cbd492500b67edce72dbbdc110dfc51d0f3b`
- Estado atualizado em: `2026-09-19T02:51:40Z`

## Último resultado

Fallback de telemetria MCP separado materializado no launcher e publicado em 8663cbd492500b67edce72dbbdc110dfc51d0f3b. telemetry.js usa https://<codespace>-8766.app.github.dev com credentials=omit e X-Centralmidia-Telemetry-Key própria por ambiente; o PAT GitHub continua restrito à API GitHub. GitHub Pages run 35414389778 concluiu success. A validação end-to-end no navegador do usuário passou: Browser e Computer aparecem GitHub ativos, MCP 2/2 ativo e uso remoto 4%; Network não mostra mais falha de health MCP. O único 403 restante é o endpoint de billing/usage do GitHub, separado da saúde dos Codespaces/MCP e dependente da permissão Plan: read no token atual.

## Próxima ação

Nenhuma correção material pendente no launcher para MCP. Se for desejado preencher o indicador GitHub de uso mensal, substituir/configurar o fine-grained PAT usado pelo launcher com permissão de usuário Plan: read além das permissões já necessárias para Codespaces; o 403 atual do billing não afeta GitHub 2/2 nem MCP 2/2.

## Checkpoint seguro

CTML consome o endpoint separado 8766 do CTM; chave de telemetria e PAT GitHub permanecem credenciais distintas. E2E confirmado no navegador: GitHub 2/2, MCP 2/2 e uso MCP 4%. Pages publicou 8663cbd492500b67edce72dbbdc110dfc51d0f3b com success. O fetch private-first direto pela porta 3000 foi refutado por 302/401 do gateway cross-site e não deve ser reaberto sem nova evidência. O indicador GitHub uso -- corresponde a 403 do endpoint de billing por permissão insuficiente do token para Plan: read; não é falha do runtime MCP.

## Bloqueios

- Nenhum bloqueio material conhecido.

## Validações registradas

- `pass` — Launcher telemetry source and Pages deployment (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pass` — Central Midia MCP bridge dependency after rebuild (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pass` — Authenticated launcher UI end-to-end telemetry (`8663cbd492500b67edce72dbbdc110dfc51d0f3b`)
- `pass` — Private-port authentication hardening static validation (`c888947b5b8b73558d13386f60b29376e1cfac52`)
- `pass` — Private-port authentication hardening Pages deployment (`35914d8beb52720e46129e7519f848b159ae6a11`)
- `pass` — Scoped telemetry fallback Pages deployment (`8663cbd492500b67edce72dbbdc110dfc51d0f3b`)
