# Mapeamento Detalhado — Módulo de Vendas do Space Soft (base para KAV DECK)

> Documento gerado por engenharia reversa (somente leitura/navegação — nenhum
> pedido, cliente ou registro foi efetivamente salvo/faturado/excluído durante a
> exploração) do módulo de Vendas do ERP Space Soft, acessado em produção por
> uma empresa cliente real (nome omitido). Aprofunda a seção 3.2 do `claude.md` principal do
> projeto, focando em UX/agilidade do lançamento de itens numa venda — pedido
> explícito do usuário: "quero a mesma agilidade de cadastro de produtos na
> venda". Nomes reais de clientes, fornecedores e CNPJs vistos durante a
> navegação foram omitidos ou genéricos ("Cliente X"), seguindo a mesma
> convenção do `claude.md`. **Atualizado numa segunda rodada** (seções 9 a
> 15) para cobrir a fundo todas as sub-abas do menu "Vendas" que a primeira
> rodada só tinha citado de passagem: Controle de Produção, Consulta de
> Itens, Listagem para Compra, Terminal de Separadores, Ocorrência,
> Itinerário (Rotas) e Terminal de Preços.

## 0. Confirmação da arquitetura dual-frontend

A exploração confirmou na prática o que o `claude.md` já registrava em prosa:
coexistem dois front-ends sob o mesmo domínio e sessão de login.

- **v1 (legado)** — hash-router em `app.spacesoft.com.br/#/vendas/...`, menu
  lateral tipo "mega-menu" (ícone de hambúrguer no topo abre um painel com
  todas as colunas de módulos de uma vez — Cadastros, Compras, Fiscal, Contas
  a Pagar/Receber, Financeiro, Vendas, Gestão de Preços, Rotas, Ferramentas
  Gerenciais). **Terminal de Vendas, Consulta de Pedidos e Devolução de
  Vendas rodam inteiramente no v1.**
- **v2 (novo)** — hash-router em `app.spacesoft.com.br/v2/#/...`, shell com
  abas horizontais no topo (Cadastros, Compras, Vendas, Financeiro, Estoque,
  Fiscal, Outros) e sub-blocos por card. **Tabela de Preços já foi migrada
  para o v2** (é nativa, não abre nova aba). Ao clicar em itens do v2 que
  ainda não foram migrados (ex.: Devolução de Vendas), o próprio v2 abre uma
  **nova aba do navegador apontando para a URL do v1** — ou seja, o v2 hoje
  funciona como um "launcher" que redireciona por igual para telas antigas e
  novas, sem esconder a transição do usuário. Isso é um dado de arquitetura
  relevante: a migração é tela-por-tela, não módulo-por-módulo.

Recomendação direta para o KAV DECK: não é preciso reproduzir esse período de
transição — construir direto uma única SPA é a vantagem competitiva óbvia
aqui.

## 1. Visão geral do módulo de Vendas

Menu "Vendas" (visto tanto no mega-menu v1 quanto nas abas v2) contém:

- **Vendas**: Controle de Produção, Consulta de Itens, Listagem para Compra,
  Terminal de Vendas, Terminal de Preços, Devolução de Vendas, Terminal de
  Separadores, Ocorrência.
- **Gestão de Preços**: Tabela de Preços.
- **Rotas**: Itinerário.

O coração do módulo — onde o vendedor passa a maior parte do tempo — é o
**Terminal de Vendas**, que funciona simultaneamente como (a) formulário de
criação/edição de um pedido específico e (b) grid de consulta/listagem de
todos os pedidos, alternando entre os dois modos via um ícone de navegação no
canto superior esquerdo (não são duas telas separadas — é a mesma URL
`#/vendas/terminal-pedidos/:id`, com `:id = 0` para o estado "em branco").

## 2. Layout do Terminal de Venda (tela de um pedido)

Estrutura espacial, de cima para baixo:

1. **Barra de topo da tela** (fora do cabeçalho global do sistema): três
   ícones à esquerda (lista / grade / lupa — alternam entre modo formulário e
   modo consulta, e abrem um painel rápido "Pesquisar por Número" com campos
   Número do pedido, Data de emissão e Número dia); título "Terminal de
   Venda"; à direita, em sequência: **Novo**, **Atualizar**, **Imprimir**
   (dropdown com 6 formatos: Padrão, Cupom, Pedido com canhoto, Recibo, Via
   Separador, Via Separador Cupom), **Download** (Padrão), **Opções**
   (dropdown: Importar pedidos, Aplicar desconto, Aplicar outras despesas,
   Integração Filial, Dividir, Logs).
2. **Cabeçalho do pedido** — uma única faixa horizontal branca dividida em 3
   blocos:
   - Esquerda: ícone de pessoa + "Cliente" (abre popover "ALTERAR CLIENTE"
     com busca de cliente, endereço de entrega e descrição livre do
     cliente); logo abaixo, um ícone de "joinha"/aprovação (provavelmente
     confirmação de crédito ou aprovação do pedido).
   - Centro: ícone + "Emissão" e "Saída / Entrega" lado a lado (datas).
   - Direita: "Vendedor/Representante" e, abaixo, "Separador" — cada um com
     seu próprio ícone de pessoa clicável para busca/troca.
   - Todos os 5 campos do cabeçalho (Cliente, Emissão, Saída/Entrega,
     Vendedor, Separador) são preenchidos como campos "vazios com ícone" até
     serem clicados — nenhum é um `<select>` tradicional; todos abrem um
     popover ou modal de busca dedicado.
3. **Grid de itens ("ITENS ()")** — faixa de botões de ação acima da grid:
   `Exibir estoque` (toggle), `+ Adicionar itens`, `Favoritos`, `Importar`,
   `Perfil do pedido`, `$ Aplicar preço` (dropdown: Cadastro / Selecionar
   Tabela), um ícone de engrenagem (dropdown: Exibir outras despesas, Exibir
   tipo) e um ícone de ordenação (Ordenar por lançamento / por produto).
   Colunas da grid, nesta ordem exata: **QTD, UND, PRODUTO, VALOR, T.
   PARCIAL, OBSERVAÇÃO DO ITEM, DESCONTO, LOTE, EMBALADO.**
4. **Rodapé fixo** — à esquerda, ícone de caminhão + Volumes / Peso líquido /
   Peso bruto, e dois toggles "Fat. auto" / "Boleto auto" (faturamento e
   emissão de boleto automáticos, desligados por padrão); à direita, a
   equação **Valor dos produtos − Desconto = Valor total**.

## 3. Fluxo de lançamento de item — passo a passo observado

Este é o núcleo da pergunta do usuário. Passos e comportamento reais:

1. Clicar em **"+ Adicionar itens"** abre uma **barra inline no rodapé da
   tela** (não um modal, não uma nova página) chamada "Adicionar Item ao
   Pedido Manualmente", com 4 campos lado a lado: **Qtd, Produto, Valor
   unitário, Observação**, mais um botão **Adicionar** e um ícone de
   engrenagem com submenu (Ocultar valor unitário, Inicia com o produto,
   Pesquisar por produto, Exibir unidade — ou seja, o comportamento de busca
   de produto é configurável por preferência do usuário/empresa).
2. O foco cai automaticamente no campo **Qtd** — o vendedor já pode digitar a
   quantidade sem clicar em nada.
3. **Achado importante**: o campo Produto **não tem autocomplete/type-ahead
   próprio**. Digitar texto livre nele (testado com "banana", "to") não abre
   nenhuma sugestão — o campo só aceita um valor já resolvido. O rótulo do
   campo é literalmente **"Produto ((Crtl + P) - Pesquisar produto)"**
   (o "Crtl" com erro de digitação é do próprio produto, não nosso) — ou
   seja, o único caminho documentado para popular esse campo é abrir um
   modal de busca dedicado, seja clicando ou via atalho de teclado
   **Ctrl+P**.
4. **Ctrl+P** abre o modal **"Selecione um Produto"**, com um único campo de
   busca e uma grid de resultados (colunas COD., UND, PRODUTO). Este modal,
   ao contrário do campo inline, **filtra em tempo real a cada tecla digitada
   — sem precisar de Enter ou botão Pesquisar**, e casa a substring em
   qualquer posição do nome do produto (não só prefixo). Clicar numa linha
   fecha o modal e preenche o campo Produto da barra inline no formato
   `"<código> <unidade> - <NOME DO PRODUTO>"`.
5. De volta à barra inline, o botão **Adicionar** só fica habilitado
   (azul) depois que Qtd e Produto estão preenchidos; **Valor unitário** fica
   em branco por padrão (não veio pré-preenchido pela tabela de preço neste
   teste) e **Observação** é livre.
6. **Achado crítico de arquitetura**: tentar clicar em "Adicionar" **sem um
   pedido/cliente já criado** (isto é, direto na tela em branco
   `terminal-pedidos/0`) devolve um **erro de backend cru exposto ao
   usuário**: `Method parameter 'vendaId': Failed to convert value of type
   'java.lang.String' to required type 'long'; For input string: "null"`.
   Duas conclusões técnicas ficam evidentes daí: (a) o backend é Java/Spring
   (erro de conversão de parâmetro típico do Spring MVC); (b) **a grid de
   itens exige um `vendaId` real — não existe "rascunho" client-side puro**;
   o pedido precisa ser persistido no servidor (via "Novo" → modal "Adicionar
   Novo Pedido de Venda" → botão "Adicionar novo pedido") antes que qualquer
   item possa ser lançado. Isso é uma dependência de rede em série logo no
   primeiro passo do fluxo mais usado do sistema — ponto de lentidão real,
   detalhado na seção 7.
7. **Seleção de cliente tem um atalho de agilidade genuíno**: tanto no modal
   de criação de pedido quanto no popover "Alterar Cliente", existe um botão
   **"Sem Cadastro" / "Venda para consumidor final (Sem cadastro)"** que
   dispensa a busca de cliente. Na prática, ele não cria uma venda "sem
   cliente" de verdade — ele associa automaticamentre um cliente genérico
   pré-cadastrado (identificado como algo como "A VISTA" na base de dados,
   convenção comum de ERPs de varejo/atacado brasileiros para venda à vista
   sem identificação do comprador). É um padrão de UX válido a copiar: manter
   um "cliente coringa" cadastrado normalmente em vez de tratar
   `clienteId = null` como caso especial em todo o resto do sistema.
8. **Atalho Ctrl+P funciona globalmente dentro da tela de item**, mas não
   identificamos outros atalhos de teclado documentados na UI (não há
   tooltips indicando F1–F12 ou Ctrl+outra tecla em nenhum outro botão da
   tela). Esc fecha popovers com segurança.

## 4. Modal "Adicionar Novo Pedido de Venda" (criação real do pedido)

Acessado pelo botão **Novo** no topo do Terminal de Venda. Layout em 4 blocos
verticais, cada um com seu próprio ícone à esquerda (mesma linguagem visual
do cabeçalho da tela de pedido):

- **CLIENTE** — Cliente (busca), Endereço de entrega (busca), Descrição do
  cliente (texto livre, **obrigatório mesmo quando um cliente já foi
  selecionado** — campo redundante que exige digitação manual extra mesmo
  depois de escolher o cliente certo; candidato natural a eliminar/auto-
  preencher no KAV DECK).
- **DADOS DO PEDIDO** — Data de Emissão (default: hoje), Natureza
  (combobox: BONIFICACAO / VENDA), Observação, tag (combobox + botão
  "+Tags" para cadastrar nova tag na hora, sem sair do modal).
- **SAÍDA / ENTREGA** — Data de Saída (default: hoje), Período da entrega
  (combobox: MANHA, TARDE, NOITE, SOS, RETIRA, HOJE).
- **FATURAMENTO E COBRANÇA** — Informações adicionais (Nota fiscal, textarea
  livre), NF - Pedido de compra B2B (referência externa).

Botão final: **Adicionar novo pedido**. Somente depois desse clique a tela
principal passa a ter um número de pedido de verdade e a grid de itens passa
a aceitar lançamentos.

Existe ainda um recurso de **bloqueio de cliente integrado ao próprio fluxo
de venda**: ao selecionar um cliente inadimplente, aparece um modal "Cliente
Bloqueado" mostrando valor vencido e valor em aberto, com botão "Solicitar
Desbloqueio" que abre um segundo modal pedindo justificativa + **usuário e
senha como assinatura digital** (reautenticação para uma ação sensível,
mesmo dentro da sessão já autenticada) — mecanismo de controle interno
bem definido, coerente com a regra de negócio já registrada no `claude.md`
principal ("cliente com bloqueio financeiro ativo não pode gerar novo
pedido de venda até liberação").

## 5. Modal "Selecione um Produto" e "Perfil do Pedido"

- **Selecione um Produto** (Ctrl+P): já descrito na seção 3. É o único ponto
  de busca de produto com filtro em tempo real de toda a tela.
- **Perfil do Pedido** (botão na barra de ações da grid): abre um modal com
  toggle "Modelo dinâmico" e sua própria mini barra "Adicionar item" (Produto
  + Observação) e botão **"Gerar Pedido"**. Aparenta ser um recurso de
  **template de pedido recorrente** (ex.: "sempre que o cliente X compra,
  sugerir esses N produtos") — vale investigar mais a fundo numa sessão
  futura se o KAV DECK for atrás de um recurso de "pedido modelo"/favoritos
  por cliente, já que também existe um botão "Favoritos" separado com sua
  própria busca de produto e "Adicionar itens" em lote.
- **Vincular Lote**: ao lidar com produto controlado por lote, existe um
  modal "Vincular lote" com duas grids lado a lado — "Entradas Vinculadas"
  (o que já foi conciliado) e "Disponível para Vincular" (lotes de entrada
  ainda livres, com colunas QTD VINC., QTD DISP., QTD, VALOR, OBS., DATA DO
  LOTE, FORNECEDOR, PEDIDO) — a UI de rastreabilidade ponta-a-ponta citada no
  `claude.md` principal (seção 2.19) realmente existe e está costurada direto
  na tela de venda, não isolada num módulo de estoque à parte.

## 6. Consulta/Listagem de Pedidos de Venda

Acessada pelo ícone de lupa/lista no topo do Terminal de Venda (mesma URL,
outro "modo" da tela). Estrutura:

**Filtros rápidos** (sempre visíveis): Data inicial, Data final, Cliente
(texto livre), Via Sep. impresso (combobox: Apenas impresso / Não impresso),
Período da entrega, botão Pesquisar, e três checkboxes de status: **Em
aberto** (ligado por padrão), **Faturado** (ligado por padrão), **Cancelado**
(desligado por padrão).

**"Mais filtros"** expande um segundo painel com: Data saída inicial/final,
Vendedor, Natureza, Fat. auto (Automático/Manual), Grupo de pedidos (É
grupo/Não é grupo), Status NF (NF gerada/não gerada), Pedido impresso
(Impresso/Não impresso), Rota/Região (tag), Grupo/Unidade, mais um segundo
grupo de checkboxes de status (Em aberto / Faturado / Cancelado, duplicado
do painel rápido).

**Grid de resultados** — cada linha tem um checkbox de seleção (permite ação
em lote); colunas: **NÚMERO, STATUS, SEP., DATA, EMPRESA, VALOR TOTAL, PED.,
ENTREGA, OBSERVAÇÃO, NATUREZA, GRUPO**. Acima da grid: contador "Pedidos (0 -
)", "Valor da seleção: R$ 0.00" (soma dinâmica dos pedidos marcados), ícones
de "exibir campo" (número do pedido / número dia) e de ordenação (por
número, por número dia, por cliente, por NF).

**Ações em lote/individuais na barra superior deste modo**: Novo, **Agrupar
NF**, **Nota fiscal**, Imprimir (com o mesmo dropdown extenso de formatos do
modo formulário, mais opções exclusivas da consulta: Analítico, Analítico
com Lote de Entrada, Analítico por Forma de Pagamento com Lote de Entrada,
Sintético, Sintético v2, Resumido, Imprimir Romaneio, versões "(Grupo)" para
pedidos agrupados, Planilha), Download (Analítico/Sintético/Sintético v2 em
XLS, Planilha Grupo), **Faturar**, **Estornar**, **Duplicar**. "Duplicar" é
um recurso de agilidade explícito para repetir um pedido anterior sem
redigitar tudo — vale muito a pena copiar essa ideia.

## 7. Terminal de Preços / Tabela de Preços

- **Tabela de Preços** (v2, `v2/#/sales/price-list`): tela simples e limpa —
  filtros Nome (texto) e Ativo (Sim/Não), botão Pesquisar; grid com colunas
  Tabela de Preços, Marcação, Ativo; botões **+Novo** e **Importar Preços**
  (import em massa via arquivo, mesmo padrão usado em "Importar Pedidos" e
  "Importar Itens do Pedido" na tela de venda — a import de planilha é um
  recurso transversal reaproveitado em vários módulos, não uma
  particularidade de um único fluxo).
- **Terminal de Preços** (item de menu separado, em Vendas): mapeado a fundo
  numa rodada seguinte — ver seção 15. Não é um cadastro de preço unitário
  como a hipótese original aqui supunha; é uma tela de auditoria de erro de
  precificação (item vendido por valor zero).

## 8. Devolução de Vendas

Tela simples e "achatada" (não usa o padrão de cabeçalho com ícones do
Terminal de Venda): filtro "Filtrar Devoluções pela Emissão do Pedido de
Venda" com Data Inicial, Data Final, toggle "Exibir Cancelados" e botão
Pesquisar; caixa destacada à direita mostrando "Valor das Devoluções" (soma
dinâmica). Grid: **#, DOC, DATA DA DEV., VALOR DA DEV., NÚMERO PED., DATA DO
PED., CLIENTE, VALOR DO PED.** Botões: +Novo, Imprimir, Imprimir (Cliente).
Não foi criada nenhuma devolução nesta sessão (ficaria sem pedido de origem
válido para referenciar sem gerar uma venda real primeiro).

## 9. Controle de Produção

URL `#/vendas/controle-producao` (nomenclatura inconsistente já notada: v1
mostra "CONTROLE DE PRODUÇÃO" no título mas o item do mega-menu v2 usa o
mesmo nome — aqui não há divergência de rótulo como em outras telas, ao
contrário do que o mapeamento anterior supunha).

Layout simples, sem master-detail: filtro único **Data Emissão** (um dia por
vez, sem intervalo — mesma limitação já registrada no mapeamento de Estoque),
botão **Pesquisar**, e um botão **Lotes** isolado no canto superior direito.
Grid: **NÚMERO PED, DATA EMISS., CLIENTE, QTD, UND, PRODUTO, OBSERVAÇÃO** —
ou seja, é uma consulta de itens de pedido de venda filtrada por data, focada
em produção/separação do que precisa ser preparado num dia específico
(provavelmente para produtos que passam por alguma transformação antes de
sair — ex. corte, embalagem — já que o nome é "Produção", não "Estoque").

**Achado de bug**: o botão **Lotes** abre uma **nova aba** apontando para
`#//produtos/lote-produto` — repare a **barra dupla** (`//`) logo após o
`#`, uma URL malformada. A aba abre e fica **completamente em branco**
(nenhum conteúdo renderiza, nem erro visível) — é um link quebrado no
próprio Space Soft, não uma questão de dado ausente. Nenhum registro
encontrado com a data testada (dia corrente); não foi possível confirmar se
o problema é só a falta de dado ou se a tela em si nunca funcionou.

## 10. Consulta de Itens (Controle de Itens de Venda)

URL `#/vendas/consulta-itens`, título da tela "Controle de Itens de Venda".
Esta é a visão "linha de item" mencionada no `claude.md` (seção 6.1, lá no
contexto de NF-e) só que aplicada a **itens de pedido de venda**, cruzando
todos os pedidos de todos os clientes num único grid plano — útil pra ver
quanto de um produto específico foi vendido, pra quem, e a que preço, sem
precisar abrir pedido por pedido.

**Layout**: painel de filtros fixo à esquerda (não é master-detail, é só
filtro + grid): Data Inicial, Data Final (aqui sim é **intervalo real**,
diferente do Controle de Produção), Cliente (texto), Natureza (combobox),
Período da entrega (combobox), Produto (texto), Tag (texto), Categoria
(combobox), Departamento (combobox), botão Pesquisar. Área principal:
cabeçalho "Itens Vendidos (X - Y)" com ícone de refresh, e no canto superior
direito da tela: **Exibir totais** (toggle), **Imprimir ▾**, **Exportar**.

**Grid (modo detalhe)**: QTD, UND, PRODUTO, VALOR, T. PARCIAL, OBS. PRODUTO,
CLIENTE, ENTREGA, **NÚMERO** (link clicável — abre o pedido de origem),
DATA EMISS., OBS. PEDIDO. Testado com um intervalo de mais de um ano e meio
nesta empresa real: **7.935 itens vendidos** no período — volume de uso
real bem alto, confirma que Vendas é o módulo mais movimentado do sistema
pra este cliente (consistente com o resto do mapeamento).

**Achado de UX — botão "Exibir totais"**: alterna o grid inteiro pra um modo
consolidado, agrupando por produto: só QTD, UND, PRODUTO, somando a
quantidade total vendida de cada item no período filtrado (ex.: "39.319 BDJ
de MILHO VERDE" num período de ano e meio). É um recurso de agilidade real —
troca instantânea entre "auditoria transação por transação" e "quanto
vendemos de cada coisa", sem precisar de uma tela de relatório separada.

**Achado de padrão de dados**: nos itens reais vistos, a coluna CLIENTE
repete um valor genérico consistente com o "cliente coringa" já documentado
na seção 3.7 deste arquivo (venda sem cadastro) — reforça que esse padrão é
usado com frequência real por esta empresa, não é só uma opção teórica do
sistema.

## 11. Listagem para Compra

URL `#/vendas/lista-compra`, título "Listagem de Itens para Compra". Mesma
base de dados de itens de venda que a Consulta de Itens (seção 10) — mesmo
efetivamente **os mesmos 7.935 itens** aparecem aqui com o mesmo período de
teste — mas com um propósito de workflow diferente: rastrear quais itens
vendidos **já foram impressos/repassados pro comprador** como lista de
reposição.

**Layout**: filtros numa única faixa horizontal (não painel lateral): Data
inicial, Data final (intervalo), combobox **Impresso / Não impresso**
(default: NÃO IMPRESSO), botão **Filtros ▾** (painel extra com chips de
"Selecionar Categorias" — TODOS/CASA/PRESTAÇÃO DE SERVIÇO/VERDURAS — e
"Selecionar Grupo" — TODOS/nome de grupo de colaboradores —, todas ativas
por padrão), botão Pesquisar. Acima do grid: "PEDIDOS (X - Y)", **Exibir
totais** (mesmo toggle de agregação por produto da seção 10), **Opções ▾**
(único item: "Formatar Qtd").

**Grid**: QTD, UND, PRODUTO, VALOR, T. PARCIAL, OBS. PRODUTO, **IMPRESSO**
(ícone de X vermelho ou check — indica se aquele item já foi marcado como
"repassado pro comprador"), CLIENTE, NÚMERO, ENTREGA, OBS. VENDA.

**Achado crítico de adoção**: com o filtro padrão "NÃO IMPRESSO" e mais de
um ano e meio de histórico, **todos os 7.935 itens aparecem como não
impressos** — ou seja, nenhum item de venda desta empresa real jamais foi
marcado como "impresso" nesta tela, em nenhum momento da história da conta.
Esse é mais um recurso de workflow que existe estruturalmente no produto mas
nunca foi adotado operacionalmente por este cliente — mesmo padrão já visto
em Rastreabilidade, Inventário Físico e Estoque de Caixas no mapeamento de
Estoque. A hipótese mais provável: o comprador desta empresa usa a "Prévia
de Estoque" (saldo projetado) ou decide reposição de cabeça/por experiência,
sem depender deste fluxo formal de "lista impressa pro comprador".

## 12. Terminal de Separadores

URL `#/vendas/order-picker` (nome de rota em inglês — mesma inconsistência
de idioma já vista no Inventário Físico do mapeamento de Estoque,
`#/inventory/physical/0`). Título "Terminal de Separadores".

**Esta é a única tela do módulo de Vendas com um paradigma visual diferente
de toda a grade densa do resto do v1: é um quadro kanban.**

**Layout**: painel esquerdo estreito "Separadores" — lista de colaboradores
cadastrados como Separador (Cadastros > Separadores), cada um como um
card clicável com ícone de pessoa; sempre existe um separador especial
**"Sem Separador"**, o balde padrão pra pedidos ainda não atribuídos a
ninguém. Painel principal, ao selecionar um separador: filtro "Selecionar
um Período" (Data Inicial/Data Final, intervalo real) + Pesquisar, contador
"Pedidos (X - Y)" no canto superior direito, botão Imprimir. Abaixo, o
quadro kanban propriamente dito: **uma coluna por dia** (rotulada
"DD/MM/AAAA - NomeDoDiaDaSemana", ex. "08/01/2025 - Wednesday" — dia da
semana em inglês, mais um sintoma de i18n incompleto), roláveis
horizontalmente; dentro de cada coluna, **um cartão por pedido pendente de
separação naquele dia**, com o nome do cliente como texto do cartão.

**Fluxo de uso**: presumivelmente drag-and-drop — arrastar um cartão de
"Sem Separador" pra um separador específico na lista da esquerda, atribuindo
aquele pedido a uma pessoa pra picking físico. Não foi possível confirmar o
drag-and-drop com segurança nesta sessão (clique simples no cartão não abriu
nenhum modal nem teve efeito visível — condizente com um elemento que só
reage a arrastar, não a clicar).

**Achado crítico de adoção**: testado com data inicial de mais de um ano
atrás, **100% dos 6.201 pedidos do período estão no balde "Sem Separador"**
— nenhum pedido desta empresa real jamais foi atribuído a um separador
nomeado nesta tela. Combinado com o achado da seção 11 (nenhum item marcado
como impresso pro comprador) e os achados equivalentes no mapeamento de
Estoque, fica claro um padrão geral: **esta empresa opera o essencial do
negócio (criar pedido → faturar) e ignora quase todas as camadas de
apoio/controle intermediário que o Space Soft oferece** (separador nomeado,
impressão de lista de compra, rastreabilidade de lote, inventário físico
formal). Vale muito considerar isso na priorização do KAV DECK: os recursos
de "camada 2" só valem o investimento de engenharia se o fluxo principal
for tão bom que sobra tempo/disciplina operacional pra usá-los — caso
contrário viram código morto, como aconteceu aqui em vários módulos do
concorrente.

## 13. Ocorrência

URL `#/vendas/ocorrencia`, título "Controle de Ocorrências". Registro de
problemas/exceções vinculados a um pedido de venda específico (ex. avaria,
divergência de entrega).

**Layout da listagem**: filtros em faixa horizontal — Data Inicial, Data
Final (intervalo), Cliente (texto), Pesquisar. Grid: **#, DATA OC., PEDIDO,
CLIENTE, TIPO, MOTIVO**. Botões no topo: Imprimir, **+ Adicionar**.

**Achado de adoção**: testado com mais de 2 anos de histórico (01/01/2024 até
hoje) — **zero ocorrências registradas** nesta empresa real. Mais um módulo
de camada 2 estruturalmente pronto e nunca usado (ver discussão na seção
12).

**Duas telas de formulário distintas encontradas** (aparentemente um bug de
navegação nesta sessão abriu as duas por acidente, o que acabou sendo útil
pra documentar ambas):

- **Modal "Adicionar Ocorrência"** (botão + Adicionar): painel esquerdo pra
  buscar o pedido de origem (Data de emissão, Cliente, Pesquisar). Painel
  direito, seção "Dados do Pedido" (Número, Data de emissão, Data de saída,
  Natureza, Cliente, Valor — presumivelmente auto-preenchidos ao selecionar
  um pedido na busca à esquerda) e seção "Dados da Ocorrência": Data da
  Ocorrência (default hoje), **Tipo** (combobox obrigatório, com botão "+"
  ao lado pra cadastrar um novo tipo na hora sem sair do modal — mesmo
  padrão "creatable combobox" já visto em Tags no modal de novo pedido de
  venda), **Motivo** (texto livre, obrigatório), e "Qual foi a Resolução?"
  com combobox **Resolução** (também com "+" pra criar nova opção na hora).
  Validação client-side visível: bordas vermelhas + mensagem "O campo Tipo é
  obrigatório." / "O campo Motivo é obrigatório." aparecem assim que o modal
  abre (antes mesmo de tentar salvar) — comportamento de validação um pouco
  agressivo/prematuro, mas pelo menos não deixa passar direto pro backend
  sem preencher (diferente do erro de data cru visto em outras telas).
- **Modal "Ocorrência"** (mais completo — visualização/edição de uma
  ocorrência já existente, ou uma segunda via de criação mais rica): repete
  "Dados do Pedido", mas adiciona uma seção **"Itens da Ocorrência"** — um
  grid próprio (QTD, UND, PRODUTO, VALOR) com botão **+ Adicionar itens** e
  um contador "Valor total" — ou seja, dá pra vincular a ocorrência a
  produtos específicos do pedido (ex. "destes 10 itens, 3 chegaram
  avariados") em vez de só descrever em texto livre. "Dados da Ocorrência"
  aparece embaixo com os mesmos 4 campos (Data da Ocorrência, Motivo, Tipo,
  Resolução). Esse nível de detalhe (ocorrência por item, não só por
  pedido inteiro) é um padrão de dado valioso pra copiar se o KAV DECK for
  atrás desse recurso — permite relatório futuro de "quais produtos mais
  geram ocorrência", não só "quais pedidos".

## 14. Itinerário (Rotas)

URL `#/rotas/itinerario2` — módulo de montagem de rota de entrega, já citado
no `claude.md` (seção 2.13/3.2) e ligado ao fluxo de venda via o campo
"Rota/Região" já visto na Consulta de Pedidos (seção 6 deste arquivo).

**Tela principal**: painel esquerdo estreito "Itinerários (0)" com filtro
**Data do itinerário** (um dia só, sem intervalo) + **Período** (mesmo enum
de 6 valores já documentado no cadastro de pedido: MANHA, TARDE, NOITE, SOS,
RETIRA, HOJE) + Pesquisar. Um botão **Menu** no canto do painel esquerdo
abre um dropdown rico com bem mais ações do que os filtros sugerem:
**Adicionar itinerário**, **Gerar automático**, **Gerar automático
(Cadastro)**, Consultar, Imprimir capa da rota (Mod. 3), Imprimir capa da
rota (Mod. 4), Imprimir Resumo, Habilitar grupos, Cadastrar rotas.

**Achado de agilidade genuíno — "Gerar automático"**: existe uma ação
dedicada pra **montar o itinerário do dia automaticamente** (presumivelmente
agrupando pedidos prontos pra entrega por rota/região cadastrada em vez de
o operador montar a sequência de paradas manualmente), com uma segunda
variante "Gerar automático (Cadastro)" — não testado a fundo pra evitar
criar um itinerário de verdade, mas a existência de duas variantes sugere
uma usa a rota já cadastrada no cliente (`Cliente.rotaEntregaId`, já
existente no schema do KAV DECK) e a outra recalcula do zero. Esse é
exatamente o tipo de atalho que vale a pena copiar: montar rota é trabalho
braçal de logística, e automatizar por região cadastrada do cliente
economiza tempo todo santo dia.

**Tela "Consultar"** (dentro do Menu) — abre uma segunda tela, "Pesquisar
Itinerários": filtro rápido por Transportadora (texto) + Pesquisar, e um
painel "Filtros" mais completo (ícone de funil) com Data inicial/final
(intervalo real aqui), Período de entrega, Rota (combobox), Transportadora,
Placa do veículo. Grid com checkbox de seleção: **DATA, PERÍODO, ROTA,
TRANSPORTADORA, PLACA, V. DO FRETE, FATURA**. Cabeçalho mostra "Valor
Selecionado: 0.00" (soma dinâmica dos itinerários marcados — mesmo padrão
de seleção em lote já visto em Consulta de Pedidos de Venda). Botões:
Imprimir ▾, **Gerar Fatura** (fatura de frete pra Transportadora, a partir
dos itinerários selecionados — conecta Itinerário com Contas a Pagar/
Fatura de Produtor de um jeito que o `claude.md` principal não detalhava).

**Achado de arquitetura (3ª reprodução do mesmo bug)**: testando a busca
com uma data inicial antiga, um erro de digitação no campo (dígito extra
inserido no meio do valor já preenchido) gerou o mesmo tipo de erro cru já
visto em Vendas (seção 3.6) e em Estoque: `Method parameter 'dataInicial':
Failed to convert value of type 'java.lang.String' to required type
'java.time.LocalDate'... for value [12024-01-02]`. Terceira confirmação
independente do mesmo padrão: **nenhum campo de data em nenhuma tela do
Space Soft valida o formato no frontend antes de mandar pro backend Java**
— não é uma falha isolada de uma tela, é a ausência sistemática de uma
camada de validação de data no cliente inteiro.

**Achado de adoção**: nenhum itinerário encontrado em nenhuma das datas
testadas (incluindo mais de 2 anos de histórico na tela de Consultar) —
mais um módulo de camada 2 (logística formal de rota) não adotado por este
cliente real, reforçando a leitura da seção 12: entrega provavelmente
acontece por combinação direta com o cliente/motorista, sem passar pelo
Itinerário formal.

## 15. Terminal de Preços (Vendas)

URL `#/vendas/terminal-precos`, título "Terminal de Preços de Venda". Item
de menu separado de "Tabela de Preços" (Gestão de Preços, já documentada na
seção 7) — e de fato é uma ferramenta bem diferente, não um cadastro de
preço unitário por produto dentro de uma tabela como a hipótese original do
mapeamento supunha.

**É uma tela de auditoria de erro de precificação**, não de cadastro. Mesma
base de dados item-a-item das seções 10/11 (Consulta de Itens / Listagem
para Compra), mas com dois toggles que mudam o propósito da tela por
completo: **"Possui tabela de preços"** (desligado por padrão) e **"Valor
igual a 0"** (**ligado por padrão**) — ou seja, ao abrir a tela, o sistema já
filtra automaticamente por "itens vendidos por R$ 0,00", o tipo de erro mais
caro de não pegar (mercadoria saiu de graça por engano). Filtros adicionais:
Data Emissão/Data Final (intervalo), Cliente, Produto, Departamento
(combobox), Período da entrega (combobox), Pesquisar. Grid: QTD, UND,
PRODUTO, VALOR, T. PARCIAL, OBS. PRODUTO, CLIENTE, NÚMERO (link), DATA
EMISS., ENTREGA, OBS. VENDA — idêntica estrutura às seções 10/11, reforçando
que é a mesma tabela de itens de venda vista por mais um ângulo de filtro.

**Achado real de valor**: diferente da maioria dos módulos de camada 2 deste
mapeamento (que apareceram genuinamente vazios nesta empresa), a busca
padrão ("Valor igual a 0", período de ano e meio) **encontrou 1 ocorrência
real**: 50 unidades de um produto vendidas por R$ 0,00 num pedido específico.
Esse é o único módulo de "auditoria/segunda camada" de todo o mapeamento de
Vendas que efetivamente pegou um problema real nesta conta de produção — vale
a pena priorizar esse tipo de verificação (item vendido a valor zero) como
alerta automático no KAV DECK (ex. destaque visual na tela de faturamento,
ou um relatório de exceção), já que é barato de implementar (é só um filtro
sobre dado que já existe) e tem retorno demonstrado na prática.

**Nota de escopo**: existe um item de menu com o mesmo nome "Terminal de
Preços" também em Compras (preço de compra por produto) — fora do escopo
desta rodada, que cobriu só o módulo de Vendas.

"Bloqueio Clientes" fica fisicamente no menu de **Contas a Receber**, não em
Vendas, mas está funcionalmente acoplado ao Terminal de Venda como descrito
na seção 4.

## 16. Inventário consolidado de ações/botões do Terminal de Venda

Para referência rápida na hora de montar o backlog de telas do KAV DECK:

| Área | Botão/Ação | Efeito observado ou inferido |
|---|---|---|
| Topo | Novo | Abre modal de criação de pedido (cliente + dados) |
| Topo | Atualizar | Recarrega o pedido/lista atual |
| Topo | Imprimir ▾ | 6 formatos de impressão (Padrão, Cupom, Canhoto, Recibo, Via Separador ×2) |
| Topo | Download ▾ | Exporta em formato "Padrão" |
| Topo | Opções ▾ | Importar pedidos, Aplicar desconto, Aplicar outras despesas, Integração Filial, Dividir, Logs |
| Cabeçalho | Cliente / Endereço / Descrição | Popover "Alterar Cliente" |
| Cabeçalho | Emissão, Saída/Entrega | Datas do pedido |
| Cabeçalho | Vendedor/Representante, Separador | Busca de colaborador vinculado |
| Itens | Exibir estoque | Mostra saldo de estoque em tempo real por item (modal "Saldo Atual em Estoque") |
| Itens | + Adicionar itens | Abre barra inline de lançamento manual |
| Itens | Favoritos | Adiciona múltiplos itens pré-marcados como favoritos de uma vez |
| Itens | Importar | Sobe planilha com itens do pedido |
| Itens | Perfil do pedido | Template/pedido dinâmico recorrente |
| Itens | Aplicar preço ▾ | Cadastro de preço avulso ou seleção de tabela de preço inteira |
| Itens | engrenagem ▾ | Exibir outras despesas / Exibir tipo |
| Itens | ordenação ▾ | Por lançamento / por produto |
| Rodapé | Fat. auto, Boleto auto | Toggles de automação de faturamento/boleto |
| Consulta | Agrupar NF | Agrupa pedidos selecionados numa única NF |
| Consulta | Nota fiscal | Emite/vincula NF ao(s) pedido(s) selecionado(s) |
| Consulta | Faturar | Converte pedido em faturado (ação financeira — irreversível, não testada) |
| Consulta | Estornar | Reverte faturamento (não testada) |
| Consulta | Duplicar | Clona um pedido existente como base de um novo |

## 17. Recomendações de agilidade para a reconstrução no KAV DECK

Indo direto ao que o usuário pediu ("a mesma agilidade de cadastro de
produtos na venda"):

1. **O maior gargalo real do Space Soft não é a busca de produto — é a
   criação do pedido em si.** É preciso um round-trip completo ao servidor
   (modal "Adicionar Novo Pedido de Venda" → "Adicionar novo pedido") antes
   de poder tocar em qualquer item. No KAV DECK, vale considerar criar o
   pedido em rascunho no mesmo instante em que o vendedor abre a tela (ou
   permitir montar a lista de itens 100% em memória no cliente, com cliente
   e demais dados anexados só no momento de salvar) — elimina uma latência
   de rede logo no primeiro clique do fluxo mais usado do sistema.
2. **Falta autocomplete no campo de texto principal de produto** — o campo
   inline da barra "Adicionar Item" não sugere nada sozinho; todo mundo é
   obrigado a usar o atalho Ctrl+P (que abre um modal à parte) ou o mouse.
   Isso quebra o fluxo "só teclado" que o usuário quer. **O modal Ctrl+P em
   si tem uma ótima busca (filtro em tempo real por substring, sem precisar
   de Enter)** — o ideal no KAV DECK é ter esse mesmo comportamento de
   filtro instantâneo só que **direto no campo inline**, sem exigir abrir
   modal nenhum: digitar já mostra um dropdown de sugestões por baixo do
   campo, Enter ou clique confirma, sem trocar de contexto visual.
3. **Copiar o padrão "cliente coringa" para venda sem cadastro** — em vez de
   tratar `cliente = null` como caso especial espalhado pelo código, manter
   um cliente genérico de verdade ("Consumidor Final"/"Venda à Vista")
   resolve o mesmo problema sem gambiarra.
4. **Copiar "Duplicar pedido"** — clonar um pedido anterior inteiro (cliente,
   condição de pagamento, itens) e só ajustar quantidades é, na prática, mais
   rápido que "cadastro ágil de produto" para clientes recorrentes que compram
   sempre a mesma cesta — provavelmente o ganho de agilidade percebido mais
   alto para esse tipo de negócio (CEASA/atacado com pedidos repetitivos).
5. **Nunca vazar erro de backend cru para o usuário** — o erro Java visto no
   passo 3.6 ("Failed to convert value of type...") é o tipo de coisa que
   deveria virar, no mínimo, "Selecione um cliente antes de adicionar itens."
   Toda validação de pré-condição de fluxo (precisa de cliente antes de
   item, precisa de item antes de faturar, etc.) deve ser feita e comunicada
   no frontend do KAV DECK antes mesmo de chamar a API.
6. **O campo "Descrição do cliente" obrigatório e duplicado** mesmo depois
   de já ter selecionado um cliente de cadastro é atrito puro — no KAV DECK,
   preencher automaticamente com a razão social do cliente selecionado
   (mantendo editável, mas não obrigando redigitação) já é uma vitória de
   agilidade simples.
7. **Grid de itens compacta e sem paginação visível** (tudo numa tabela
   rolável só) parece ser suficiente para o volume típico de um pedido —
   não há evidência de que o Space Soft precise de paginação aqui, o que
   sugere que o KAV DECK também pode manter simples (grid completa em
   memória, sem paginação) sem perda de performance percebida.
8. **Cuidado ao investir em recursos de "camada 2".** O achado mais amplo
   desta rodada, olhando as sub-abas do menu: Terminal de Separadores
   (separador nomeado), Listagem para Compra (flag de "impresso"), Ocorrência
   e Itinerário formal estão **100% vazios/não usados** nesta conta de
   produção com mais de 6 mil pedidos reais — a empresa roda o essencial
   (criar pedido → separar → faturar) e ignora quase toda a camada de
   controle intermediário oferecida. Pra priorização do KAV DECK: só vale
   construir esse tipo de tela se o fluxo principal já estiver tão redondo
   que sobra disciplina operacional pra alimentar controles extras — do
   contrário é esforço de engenharia que vira código morto, exatamente como
   aconteceu aqui.
9. **"Gerar automático" de itinerário é o tipo de atalho certo pra logística.**
   Mesmo sem uso real nesta conta, a ideia de montar a rota do dia
   automaticamente a partir da `rotaEntregaId` já cadastrada no cliente
   (em vez de montagem manual de sequência de paradas) é barata de
   implementar no KAV DECK e paga bem quando o volume de entregas crescer —
   melhor ter isso pronto desde cedo do que só quando a dor aparecer.
10. **Terminal de Preços (filtro "Valor igual a 0") foi o único módulo de
    auditoria que realmente pegou um problema real** nesta conta — encontrou
    uma venda de 50 unidades por R$ 0,00 que passaria despercebida em
    qualquer relatório normal. Diferente das outras camadas de controle
    (item 8), esse tipo de alerta de exceção (venda a valor zero) é barato,
    automático, não depende de disciplina do usuário pra funcionar, e tem
    retorno demonstrado — bom candidato a virar um aviso automático no
    momento do faturamento no KAV DECK, não uma tela separada que ninguém
    vai lembrar de abrir.
11. **Itens de ocorrência vinculados a produto, não só ao pedido inteiro** —
    o modal "Ocorrência" mais completo do Space Soft permite dizer
    exatamente quais produtos/quantidades tiveram problema, com um valor
    total calculado. Se o KAV DECK for atrás de controle de ocorrência/
    avaria, vale nascer já nesse nível de granularidade (por item, não só
    "este pedido teve um problema") — habilita relatório futuro de "quais
    produtos mais geram ocorrência".
12. **Combobox "creatable" (cadastrar opção nova sem sair do formulário)** —
    visto tanto em Tags (modal de novo pedido) quanto em Tipo/Resolução de
    Ocorrência: um botão "+" ao lado do combobox abre cadastro rápido da
    opção ali mesmo. É um padrão de agilidade barato e genérico — vale
    adotar como componente reutilizável no KAV DECK (`ComboboxCreatable` ou
    similar) em qualquer combobox de valor cadastrável (natureza, motivo,
    tipo, tag), não reimplementar caso a caso.
13. **Terceira reprodução do erro de data cru confirma que é sistêmico, não
    pontual** — visto agora em Itinerário, antes em Vendas (Terminal de
    Venda) e em Estoque (Controle de Estoque). No KAV DECK, a lição já virou
    prática (`z.coerce.date()` em todo schema de filtro por data, ver
    `src/utils/commonSchemas.js`) — mas vale manter como item de checklist
    permanente pra qualquer schema novo: nenhum campo de data deve aceitar
    string sem validar antes de chegar no Prisma/Postgres.
14. **Links quebrados por URL malformada (barra dupla) não travam a
    aplicação, só a funcionalidade** — o botão "Lotes" do Controle de
    Produção abre aba em branco silenciosamente, sem erro visível pro
    usuário. Lição pro KAV DECK: ao adicionar um link novo que abre em nova
    aba/rota, sempre testar a URL final gerada, e preferir uma mensagem de
    erro visível (\"não foi possível carregar\") a uma tela branca muda —
    mais fácil de diagnosticar em produção.

## 18. Nota sobre um artefato visual observado (não relacionado a dados)

Durante a navegação, um clique isolado causou uma alteração visual temporária
e não-persistente na tela (rótulos de coluna e botões trocados por texto sem
sentido, ex. "VALOR" virou "VALENTIA", "Atualizar" virou um caractere solto).
Um F5 completo restaurou a tela normal imediatamente e o problema não
reapareceu no resto da sessão — foi tratado como um glitch de renderização
do próprio app (provável condição de corrida no carregamento de i18n/fontes)
e não como uma mudança real de dados. Registrado aqui só por transparência;
não afeta nenhuma das conclusões acima.
