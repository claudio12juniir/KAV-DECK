# KAV DECK — do web ao instalável (Windows/macOS)

Arquitetura escolhida: o app desktop é um **cliente fino em Electron** — não
empacota o frontend, ele carrega a página direto do backend hospedado, por
HTTPS, igual um navegador (só que numa janela nativa, sem barra de endereço).
O próprio backend Express serve tanto a API (`/api/v1/...`) quanto o build do
frontend (`web/dist`). Nenhuma credencial de banco de dados (`.env` do
backend) entra no instalador. Isso significa que **o backend precisa estar
rodando em algum servidor acessível pela internet antes de gerar o
instalador final**.

**Por que isso importa pra manutenção:** como o instalador não carrega nada
localmente, tanto mudanças de backend quanto de frontend (telas, React) ficam
disponíveis pra todo mundo assim que você faz o deploy — ninguém precisa
desinstalar/reinstalar o app desktop. Instalador novo só é necessário se
mudar algo no próprio Electron (menu nativo, ícone, `main.js`, etc.), o que é
raro.

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
3. **Comando de build** (builda o backend e também o frontend, que agora é
   servido pelo próprio backend):
   ```
   npm install && npx prisma generate && npm --prefix web ci --include=dev && VITE_API_URL=/api/v1 npm --prefix web run build
   ```
   O `VITE_API_URL=/api/v1` (caminho relativo, não a URL completa) é
   proposital: assim o frontend funciona em qualquer domínio que o backend
   estiver hospedado, sem precisar rebuildar se o host mudar. O
   `--include=dev` é necessário porque o Render seta `NODE_ENV=production`,
   e isso faz o `npm ci` pular `devDependencies` por padrão — sem essa flag
   o Vite (que é devDependency) não é instalado e o build falha com
   `vite: not found`.
4. Comando de start: `npm start` (já existe em `package.json`).
5. Configure as variáveis de ambiente do serviço com os mesmos nomes do seu
   `.env` local: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, e as demais
   presentes em `.env.example`. **Não** defina `SUPABASE_SERVICE_ROLE_KEY` a
   menos que você tenha decidido habilitar as funções que dependem dela
   (histórico de login, reset de senha via admin — hoje retornam erro
   claro de "não configurado").
   ⚠️ Como o backend agora também builda e serve o frontend (passo 3), as
   variáveis do `web/.env.example` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) **também precisam estar nas variáveis de
   ambiente do serviço** — o Vite grava esses valores dentro do bundle no
   momento do build, não em runtime. Sem elas, o build conclui sem erro mas
   o app quebra assim que abre (`supabaseUrl is required`), com tela em
   branco. `VITE_API_URL` não entra aqui porque já é setado inline no
   comando de build (ponto 3 acima).
6. Após o deploy, anote a URL pública gerada (ex.:
   `https://kav-deck-api.up.railway.app`).
7. Teste: abra a URL num navegador — deve carregar a tela de login do KAV
   DECK (não um JSON). `curl https://SUA-URL/api/v1/me` deve responder 401
   (não 502/erro de conexão) — isso confirma que a API também subiu.

> Se o serviço já existir (ex.: `kav-deck-api` no Render, criado antes desta
> mudança), é só editar o **Build Command** nas configurações do serviço pro
> comando acima e disparar um novo deploy — não precisa recriar o serviço.

### Opção B — VPS própria (mais controle)
Suba com Docker ou PM2 rodando `npm start` atrás de um proxy HTTPS (Caddy ou
Nginx + Let's Encrypt). Não incluí Dockerfile neste repositório ainda — se
optar por essa rota, me avise que eu preparo.

⚠️ Desde o Sprint 9, o backend também serve Socket.io (motor de tempo real)
no mesmo servidor HTTP, no path `/socket.io`. Railway e Render já suportam
WebSocket sem configuração extra. Numa VPS com Nginx na frente, o bloco do
proxy precisa repassar o upgrade de conexão, senão o tempo real cai para
polling (funciona, mas fica mais lento):
```
location /socket.io/ {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

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
Gera `.dmg` e `.zip` em `electron/release/`, para Intel e Apple Silicon. Não
builda mais o frontend (ele não vai dentro do instalador) — só empacota a
casca do Electron, que carrega o frontend do backend em produção.

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
  tela de configuração de servidor, empacotamento). Carrega o frontend
  direto do backend configurado (`electron/main.js` → `getStartUrl()`), não
  empacota mais `web/dist` no instalador.
- `electron/build/icon.png` — ícone placeholder (KV). Troque por uma arte
  final quando tiver a identidade visual definitiva do cliente.
- `.github/workflows/build-desktop.yml` — build automatizado Win + macOS.
- `src/app.js` — o backend Express agora também serve `web/dist` (build do
  frontend) com fallback de rota pra SPA, além da API em `/api/v1`.
- `web/src/lib/apiClient.js` — já preparado para usar a URL configurada
  pelo app desktop em runtime, sem precisar rebuildar o instalador toda vez
  que o endereço do backend mudar. Trocar o servidor em **Servidor →
  Configurar servidor...** agora recarrega a janela inteira a partir do
  host novo (não só a chamada de API), já que a própria página vem de lá.

---

## 6. App mobile (Expo/React Native) — build via EAS

O app mobile (`mobile/`) usa **EAS Build**, o serviço de build na nuvem da
própria Expo — não precisa de Mac com Xcode nem Android Studio instalados
pra gerar os instaladores (`.ipa`/`.apk`/`.aab`). Já deixei tudo configurado
no repositório (`mobile/eas.json`, `mobile/app.json`,
`.github/workflows/build-mobile.yml`), mas **três coisas dependem de você**,
porque exigem uma conta que eu não tenho como criar:

1. **Conta na Expo** (expo.dev, gratuita pra começar) e rodar, uma vez, na
   sua máquina:
   ```
   cd mobile
   npx eas-cli login
   npx eas-cli init
   ```
   O `init` vincula o projeto à sua conta e preenche
   `expo.extra.eas.projectId` no `app.json` — sem isso nenhum build roda.

2. **Identificadores do app**: coloquei `com.kavdeck.mobile` como
   placeholder em `mobile/app.json` (`ios.bundleIdentifier` e
   `android.package`). Troque antes do primeiro envio às lojas — depois de
   publicado uma vez, esse identificador não dá pra mudar.

3. **Contas de desenvolvedor nas lojas**, só quando for publicar de
   verdade: Apple Developer Program (~US$99/ano) e Google Play Console
   (taxa única de ~US$25). Sem elas dá pra gerar builds internos
   (`eas build --profile preview`) e instalar direto no aparelho pra testar,
   só não dá pra publicar na App Store/Play Store.

Com a conta Expo criada e `eas init` rodado, builda assim:

```
cd mobile
npx eas-cli build --profile preview --platform all
```

Ou pelo GitHub Actions (aba **Actions** → **Build mobile app (EAS)** →
**Run workflow**) — nesse caso, cadastre o secret `EXPO_TOKEN` primeiro
(Settings → Secrets and variables → Actions), gerado em
expo.dev → Account settings → Access tokens.

Os perfis em `mobile/eas.json`:
- `development` — build com dev client, pra rodar com `expo start` conectado
  no seu backend local.
- `preview` — instalável internamente (link direto, sem loja), bom pra
  testar com o cliente antes de publicar.
- `production` — pronto pra enviar às lojas (`eas submit`).

⚠️ Os perfis `preview` e `production` não têm `EXPO_PUBLIC_API_URL` fixado —
usam o que estiver configurado como variável de ambiente do projeto no
painel da Expo (`eas env:create`) ou em `mobile/.env` no momento do build.
Configure isso apontando para o backend em produção (seção 1 acima) antes de
gerar um build de verdade.
