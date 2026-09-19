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
- Revisão verificada: `a1ec2ea51c931bda3b133affa65f2e18a6f4b103`
- Estado atualizado em: `2026-09-19T19:16:00Z`

## Último resultado

CTML foi fechado materialmente no host autenticado da Vercel. O launcher operacional está em https://centralmidia-launcher.vercel.app com GitHub OAuth/2FA; o GitHub Pages foi despublicado e depois desligado como source, a URL antiga foi confirmada no navegador com o 404 nativo do GitHub, o shell 404 customizado foi removido, o fallback de abertura deixou de abortar quando window.open() não entrega handle, o CI foi alinhado ao Pages aposentado e as branches temporárias acidentais tmp-ignore e noop2 foram removidas.

## Próxima ação

Nenhuma tarefa ativa; aguardar nova instrução explícita.

## Checkpoint seguro

CTML está ocioso e organizado. A superfície operacional é somente https://centralmidia-launcher.vercel.app; o repositório nullhare/centralmidia-launcher permanece como fonte canônica e origem de deploy da Vercel; GitHub Pages não é mais superfície operacional. Não há tarefa material pendente neste owner. A pendência de telemetria live pertence exclusivamente ao CTM e deve ser retomada no mesmo //gravar quando os Codespaces voltarem.

## Bloqueios

- Nenhum.

## Validações registradas

- `pass` — Codespace shutdown controls and progress trail (`0679384c88d2d005d03e491856029d0faf9a67f3`)
- `pass` — Authenticated gateway static and mocked security flow (`9b139110f25db74e57db15e6c6a6098f45575674`)
- `pass` — Vercel production and real GitHub OAuth path (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — Unauthenticated and logout redirect path (`3105511ca6db6751ca1330f668c059ca45a7ca42`)
- `pass` — GitHub Pages retirement (`ebe7ee1030dbc5b650e7169b0a4f0bd0aef896f5`)
- `pass` — Popup fallback deployment (`0685bd2a670932d705dfb77d53c6c2683ee7e408`)
- `pass` — Gateway CI aligned with retired Pages shell (`a1ec2ea51c931bda3b133affa65f2e18a6f4b103`)
- `pass` — Temporary branch cleanup (`a1ec2ea51c931bda3b133affa65f2e18a6f4b103`)
