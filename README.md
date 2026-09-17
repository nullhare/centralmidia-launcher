# Central remota — Launcher

Launcher público mínimo para dois acessos:

- **ABRIR NAVEGADOR**: liga/desliga o GitHub Codespaces do projeto privado `nullhare/centralmidia` e abre a porta do navegador remoto.
- **ABRIR COMPUTADOR**: abre o cliente web oficial do RustDesk para acessar o computador Zorin.

Site:

`https://nullhare.github.io/centralmidia-launcher/`

## Segurança

O repositório público não contém senhas, tokens nem configurações privadas.

O token do GitHub e o ID do RustDesk ficam apenas no `localStorage` do navegador onde o launcher foi configurado. A senha permanente do RustDesk nunca deve ser colocada neste repositório nem no launcher.

## RustDesk

O botão **ABRIR COMPUTADOR** abre `https://rustdesk.com/web/` em outra aba. Quando um ID do RustDesk está configurado no launcher, ele é copiado para a área de transferência para facilitar o preenchimento do campo `Remote ID`.
