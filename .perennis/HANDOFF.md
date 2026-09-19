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
- Revisão verificada: `3105511ca6db6751ca1330f668c059ca45a7ca42`
- Estado atualizado em: `2026-09-19T16:29:00Z`

## Último resultado

O launcher operacional foi retirado do GitHub Pages público, que permanece em 404 genérico, e passou a ser entregue pelo host autenticado `https://centralmidia-launcher.vercel.app`. O deployment de produção Vercel está READY sobre a revisão `3105511ca6db6751ca1330f668c059ca45a7ca42`. O GitHub OAuth App foi configurado com callback `https://centralmidia-launcher.vercel.app/oauth/callback`; as variáveis runtime foram aplicadas em Production. O fluxo real autorizado foi concluído com sucesso: logs Vercel registraram `/oauth/callback` 302 seguido de `/` 200 e `app.js`, `telemetry.js` e `styles.css` 200, e o usuário confirmou visualmente o launcher aberto após autorizar no GitHub. O Client ID incorreto por transcrição foi corrigido antes desta validação final.

## Próxima ação

Nenhuma mudança material pendente neste owner. O endereço operacional é `https://centralmidia-launcher.vercel.app`. No mesmo `//gravar` ainda permanece apenas a validação live da telemetria no owner CTM quando os Codespaces puderem iniciar novamente; não reabrir nem refazer o gateway CTML.

## Checkpoint seguro

Gateway CTML concluído e vivo em produção. GitHub Pages continua inexpressivo; Vercel exige GitHub OAuth, autoriza pelo user ID estável `318746268` e entrega os assets pinados da revisão `0679384c88d2d005d03e491856029d0faf9a67f3` após sessão válida. Secrets permanecem somente no ambiente Vercel. O mesmo `//gravar` não está fechado globalmente porque CTM ainda aguarda validação de telemetria nos Codespaces indisponíveis por cota mensal.

## Bloqueios

- Nenhum bloqueio material neste owner.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Public Pages generic 404 minimization (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Authenticated gateway static and mocked security flow (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Vercel production deployment (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Real GitHub OAuth allowed-account end-to-end (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Unauthenticated and logout redirect path (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
