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
- Estado atualizado em: `2026-09-19T16:54:00Z`

## Último resultado

O launcher operacional está em `https://centralmidia-launcher.vercel.app`, protegido por GitHub OAuth e validado em fluxo real autorizado. O antigo GitHub Pages foi explicitamente despublicado pelo usuário em `Settings > Pages > Unpublish site`; a URL `https://nullhare.github.io/centralmidia-launcher/` permanece apenas como 404 genérico do GitHub, sem servir o launcher. O repositório não contém workflow próprio de Pages; somente `secure-gateway-ci.yml` permanece em `.github/workflows`.

## Próxima ação

Nenhuma mudança material pendente neste owner. No mesmo `//gravar` permanece somente a validação live da telemetria no owner CTM quando os Codespaces puderem iniciar novamente; não reabrir nem refazer o gateway CTML.

## Checkpoint seguro

CTML está concluído: Vercel é o único host operacional do launcher, GitHub OAuth está ativo, assets autenticados foram validados e GitHub Pages foi despublicado. A URL `github.io` antiga pode continuar existindo como endereço do GitHub e responder 404; isso não significa que o Pages esteja publicando o aplicativo. O mesmo `//gravar` continua aberto apenas pela pendência CTM de validar a telemetria 8766 em runtime vivo quando a cota de Codespaces permitir.

## Bloqueios

- Nenhum bloqueio material neste owner.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Authenticated gateway static and mocked security flow (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Vercel production deployment (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Real GitHub OAuth allowed-account end-to-end (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Unauthenticated and logout redirect path (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — GitHub Pages unpublished (`9d47bbb5af7395ef683de5ab2e37eacb80f857d6`)
