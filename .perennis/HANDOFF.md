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
- Revisão verificada: `fcb5cb50974ff903091086ccb0352f6a6ad6c42d`
- Estado atualizado em: `2026-09-18T22:10:00Z`

## Último resultado

Telemetria real de MCP/Codespaces publicada no launcher em fcb5cb50974ff903091086ccb0352f6a6ad6c42d. telemetry.js descobre os Codespaces pelos devcontainer_path, consulta o bridge privado /__centralmidia/mcp/health e /usage, pinta estado MCP real por Browser/Computer e apresenta consumo do Desktop Commander e de Codespaces sem inventar disponibilidade. O Pages foi validado contra o artefato publicado e a dependência /mg/ctm foi validada live após rebuild. No checkpoint de recuperação, a UI do usuário mostrou os dois Codespaces GitHub ligados, porém MCP ainda indisponível/0 de 2 na apresentação enquanto os dois Desktop Commander remote estavam online nos terminais. O DevTools indicou que chamadas health/usage entram em repetição e são interceptadas pela autenticação GitHub da porta privada, com 302 para login e/ou 401 no preflight, antes de alcançar o bridge.

## Próxima ação

Fechar o consumo autenticado privado CTM -> CTML sem reabrir a arquitetura: manter private-first via Codespaces, corrigir a travessia autenticada da UI até os endpoints já existentes, remover polling infinito em erro, aplicar backoff/reconexão controlada e mostrar estado de reconexão/degradação. Quando GitHub Usage não tiver permissão suficiente, degradar de forma clara sem mascarar o estado MCP. Não usar PAT GitHub como chave de telemetria e não copiar sessão/localStorage para agente ou repositório.

## Checkpoint seguro

CTML permanece owner exclusivo da UI, lifecycle dos Codespaces, apresentação e telemetria. A decisão arquitetural está fechada: primeira linha é o caminho privado do Codespaces; não abrir superfície pública agora; PAT GitHub não é chave de telemetria; nunca expor terminal, arquivos, RustDesk, Chrome ou execução remota. Fallback público é somente plano B: endpoint separado, chave própria, escopo mínimo health/usage e nenhum privilégio lateral. O runtime MCP do CTM está comprovadamente ativo; o trabalho restante é fazer a UI refletir isso com autenticação privada correta, backoff/reconexão e degradação honesta de permissões.

## Bloqueios

- A autenticação da porta privada do Codespaces intercepta as chamadas do launcher antes do bridge; foram observados 302 para login GitHub e/ou 401 no preflight.
- A sessão/PAT/localStorage necessária para a prova end-to-end pertence ao navegador do usuário e não deve ser exportada para agente, código, logs ou repositório.

## Validações registradas

- `pass` — Launcher telemetry source and Pages deployment (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pass` — Central Midia MCP bridge dependency after rebuild (`fcb5cb50974ff903091086ccb0352f6a6ad6c42d`)
- `pending` — Authenticated launcher UI end-to-end telemetry (`revisão não registrada`)
