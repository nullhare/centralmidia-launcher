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
- Tarefa ativa: `ctml-pages-unpublish-finalize-20260919`
- Revisão verificada: `ebe7ee1030dbc5b650e7169b0a4f0bd0aef896f5`
- Estado atualizado em: `2026-09-19T16:58:00Z`

## Último resultado

O launcher operacional permanece em `https://centralmidia-launcher.vercel.app`, protegido por GitHub OAuth e validado em fluxo real autorizado. O usuário acionou `Settings > Pages > Unpublish site`. A tela 404 observada logo depois não era o 404 genérico do GitHub: era o `404.html` customizado ainda presente no repositório, fato confirmado pela leitura direta do arquivo. Esse shell obsoleto foi removido de `main` em `ebe7ee1030dbc5b650e7169b0a4f0bd0aef896f5`, e a pós-condição no repositório foi comprovada por fetch de `404.html` retornando `Not Found`.

## Próxima ação

Confirmar no navegador, após a propagação da despublicação, que `https://nullhare.github.io/centralmidia-launcher/` não serve mais o 404 customizado. Depois disso, nenhuma mudança material permanece em CTML. No mesmo `//gravar` continuará somente a validação live da telemetria no owner CTM quando os Codespaces puderem iniciar novamente.

## Checkpoint seguro

CTML está operacionalmente migrado para Vercel e o launcher autenticado está validado. O GitHub Pages foi despublicado pelo usuário, mas a verificação visual imediatamente posterior ainda mostrou o antigo `404.html` customizado; esse arquivo foi então removido do repositório em `ebe7ee1030dbc5b650e7169b0a4f0bd0aef896f5` e já não existe em `main`. Falta somente a confirmação live de que a URL `github.io` deixou de servir esse shell após a propagação. O mesmo `//gravar` continua aberto também pela pendência CTM de validar a telemetria 8766 em runtime vivo quando a cota de Codespaces permitir.

## Bloqueios

- Nenhum bloqueio material neste owner.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Authenticated gateway static and mocked security flow (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Vercel production deployment (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Real GitHub OAuth allowed-account end-to-end (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Unauthenticated and logout redirect path (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pending` — GitHub Pages unpublish propagation (`ebe7ee1030dbc5b650e7169b0a4f0bd0aef896f5`)
