# Instruções para agentes

Este projeto usa UAI Continuity 3.3.1 para continuidade operacional compartilhada.

Se a entrada do usuário contiver um comando `//...` apresentado como instrução operacional, resolva o repositório do protocolo por `STATE.json.scientia_perennis.protocol_repository` e leia o bootstrap do UAI antes de interpretar. Execute comandos inequívocos por padrão; apenas explique quando o usuário pedir explicitamente explicação ou interpretação.

Antes de trabalhar, leia `.perennis/STATE.json` como fonte operacional canônica e `.perennis/HANDOFF.md` como sua projeção humana. Se `.perennis/START_HERE.md` existir, leia-o também. Siga Descobrir → Reconstruir → Verificar → Agir → Validar → Persistir.

Antes de publicar qualquer escrita na branch canônica, use o strict writer guard do UAI Continuity adotado conforme `WRITER_GUARD.md`. Writer busy/fenced ou revisão alterada é bloqueio; não contorne com push direto.

Edite `STATE.json` como fonte operacional e regenere `HANDOFF.md` mecanicamente com o renderer do UAI Continuity; nunca mantenha duas narrativas correntes independentes.

Não crie memória de projeto independente e específica do agente. Contexto durável, evidências, decisões e handoff pertencem à `.perennis/`.

Trate sessão, modelo, máquina e conta como substituíveis. Não invente contexto ausente nem trate memória do provedor como verdade canônica.

UAI Continuity não executa manutenção intelectual ou estratégica do produto; use uma camada separada quando isso for desejado.
