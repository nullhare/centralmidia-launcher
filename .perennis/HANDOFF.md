# Handoff — Central Mídia Launcher

## Identidade

- Projeto: Central Mídia Launcher
- Alias canônico: `ctml`
- Repositório: `nullhare/centralmidia-launcher`
- Branch canônica: `main`
- UAI Continuity: `3.3.0` (`tag:v3.3.0`)
- Perfil: `lean`
- Produto independente: sim; não é capability interna do `nullhare/uai`

## Situação corrente

Este repositório é a superfície pública de abertura da Central Mídia. A árvore atual é uma aplicação estática composta por `index.html`, `app.js`, `styles.css` e `.nojekyll`, com `SECURITY.md` documentando o modelo de segurança e risco residual de token.

Não há tarefa SP ativa. A migração adiciona somente continuidade operacional e routing; não altera a página pública nem sua relação funcional com `nullhare/centralmidia`.

## Fontes de verdade

- `index.html` — estrutura da página pública;
- `app.js` — comportamento da interface/ações do launcher;
- `styles.css` — apresentação;
- `.nojekyll` — publicação estática sem processamento Jekyll;
- `SECURITY.md` — modelo de segurança e risco residual.

## Reconstrução

Uma sessão nova deve tratar o repositório como superfície estática e começar por `SECURITY.md` antes de alterar fluxos que envolvam tokens ou abertura de recursos. A relação com `nullhare/centralmidia` é funcional, mas este projeto mantém continuidade e alias próprios conforme decisão humana.

## Continuidade

- Última fonte inspecionada antes da adoção: `6f6d7eb9be5a8c7a225f6478760988fec457539f`.
- Alias global: `/mg/ctml`.
- Nenhum blocker SP conhecido.
- Recovery fresh-context permanece `pending` até execução genuína.

## Próxima ação segura

Manter a superfície pública sem inferir roadmap adicional. Trabalho novo deve ser registrado em `STATE.json`/`HANDOFF.md` somente quando houver um ponto operacional real.
