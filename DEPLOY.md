# KAV DECK — do web ao instalável (Windows/macOS)

Arquitetura escolhida: o app desktop é um **cliente fino em Electron** — ele
empacota só o frontend (`web/dist`) e se conecta pela internet a um backend
hospedado à parte. Nenhuma credencial de banco de dados (`.env` do backend)
entra no instalador. Isso significa que **o backend precisa estar rodando em
algum servidor acessível pela internet antes de gerar o instalador final**.

Eu não consigo criar contas em serviços de hospedagem por você (Railway,
Render, uma VPS, etc.) — essa parte é sua. Abaixo está o passo a passo
completo do que fazer, e o que eu já deixei pronto no repositório.

---

## 1. Hospedar o backend (Express + Prisma)

Qualquer host que rode Node.js 20 serve. Duas opções simples, sem servidor
para administrar:

### Opção A — Railway ou Render (mais simples)
1. Crie uma conta em railway.app ou render.com.
2. Novo serviço → "Deploy from GitHub" → aponte para este repositório
   (`claudio12juniir/KAV-DECK`).
3. Comando de start: `npm start` (já existe em `package.json`).
4. Configure as variáveis de ambiente do serviço com os mesmos nomes do seu
   `.env` local: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, e as demais
   presentes em `.env.example`. **Não** defina `SUPABASE_SERVICE_ROLE_KEY` a
   menos que você tenha decidido habilitar as funções que dependem dela
   (histórico de login, reset de senha via admin — hoje retornam erro
   claro de "não configurado").
5. Após o deploy, anote a URL pública gerada (ex.:
   `https://kav-deck-api.up.railway.app`).
6. Teste: `curl https://SUA-URL/api/v1/me` deve responder 401 (não 502/erro
   de conexão) — isso confirma que o servidor subiu.

### Opção B — VPS própria (mais controle)
Suba com Docker ou PM2 rodando `npm start` atrás de um proxy HTTPS (Caddy ou
Nginx + Let's Encrypt). Não incluí Dockerfile neste repositório ainda — se
optar por essa rota, me avise que eu preparo.

⚠️ O backend **precisa estar em HTTPS** em produção (não HTTP puro), porque
o app desktop empacotado carrega o frontend via `file://`, e navegadores/
Electron bloqueiam requisições de origem `file://` para `http://` externo
em vários cenários de segurança. Railway/Render já entregam HTTPS de graça.

---

## 2. Apontar o app desktop para o backend em produção

O endereço do backend usado pelo app desktop **não** é fixado em tempo de
build do jeito tradicional — ele é lido de um arquivo de configuração local
que pode ser trocado pelo usuário a qualquer momento (menu **Servidor →
Configurar servidor...** dentro do app), sem precisar reinstalar nada.

O valor inicial (o que já vem configurado na primeira abertura, antes de
qualquer troca manual) está em:

```
electron/default-config.json
```

Antes de gerar o instalador que vai para o cliente, edite esse arquivo:

```json
{
  "apiUrl": "https://SUA-URL-DE-PRODUCAO/api/v1"
}
```

(troque pela URL real do passo 1, mantendo o sufixo `/api/v1`).

---

## 3. Gerar os instaladores

### macOS (rodando neste próprio Mac)
```bash
cd electron
npm install          # primeira vez apenas
npm run dist:mac
```
Gera `.dmg` e `.zip` em `electron/release/`, para Intel e Apple Silicon.

### Windows
Este Mac não tem o Wine instalado, que o `electron-builder` exige para
montar o instalador `.exe` do Windows a partir de macOS. Duas saídas:

1. **GitHub Actions (recomendado, já configurado)** — o workflow
   `.github/workflows/build-desktop.yml` builda o `.dmg`/`.zip` (macOS) e o
   `.exe` (Windows) cada um na sua própria máquina nativa (runner da
   Microsoft para o Windows, runner da Apple para o Mac), sem Wine. Basta
   dar push no repositório e, na aba **Actions** do GitHub, rodar o
   workflow "Build desktop installers" manualmente (botão "Run workflow").
   Os instaladores ficam disponíveis como artefatos para download ao final
   da execução.
2. **Rodar `npm run dist:win` em uma máquina Windows real** (ou VM), com
   Node 20 instalado.

---

## 4. Assinatura de código (Gatekeeper/SmartScreen)

Os instaladores gerados hoje **não são assinados digitalmente** (não temos
certificado Apple Developer nem certificado de assinatura Windows
configurados). Na prática isso significa:

- **macOS**: ao abrir o `.dmg`/app pela primeira vez, o Gatekeeper vai
  avisar que o app "não pôde ser verificado" ou está "danificado". O
  usuário precisa clicar com o botão direito no app → **Abrir** (em vez de
  duplo-clique) na primeira vez, para confirmar a exceção.
- **Windows**: o SmartScreen vai mostrar um aviso "Windows protegeu o seu
  PC". O usuário clica em **Mais informações → Executar assim mesmo**.

Isso é normal para apps não assinados e não impede o uso, mas passa uma
impressão pouco profissional para o cliente final. Se quiser eliminar esses
avisos, os próximos passos seriam: um certificado Apple Developer ID (~US$99
por ano, permite notarização) e um certificado de assinatura de código
Windows (custo variável por certificadora). Posso configurar a assinatura no
`electron-builder` assim que você tiver esses certificados — não é algo que
eu consiga adquirir por você.

---

## 5. Resumo do que já está pronto no repositório

- `electron/` — app Electron completo (janela principal, menu nativo,
  tela de configuração de servidor, empacotamento).
- `electron/build/icon.png` — ícone placeholder (KV). Troque por uma arte
  final quando tiver a identidade visual definitiva do cliente.
- `.github/workflows/build-desktop.yml` — build automatizado Win + macOS.
- `web/src/lib/apiClient.js` — já preparado para usar a URL configurada
  pelo app desktop em runtime, sem precisar rebuildar o instalador toda vez
  que o endereço do backend mudar.
