# Crivo T — CTML

## Estado registrado

- MCP/Desktop Commander: ativo nos dois ambientes.
- Computador remoto: funcional, porém com indícios de estado antigo (xterm/resíduos e ausência do fluxo esperado de navegador).
- Navegador remoto: falha de inicialização com loop de WebSocket/reconexão.

## Decisão

Não tratar autenticação como primeiro problema.

Prioridade:
1. Corrigir runtime de inicialização do navegador remoto.
2. Limpar estado antigo do ambiente do computador remoto.
3. Revalidar browser remoto e MCP.
4. Só solicitar autenticação manual se persistirem 401/302 após o runtime estabilizar.

## Regra

Credenciais GitHub/PAT não devem ser exportadas nem inseridas no launcher. A autenticação deve ocorrer no próprio ambiente remoto quando solicitada.
