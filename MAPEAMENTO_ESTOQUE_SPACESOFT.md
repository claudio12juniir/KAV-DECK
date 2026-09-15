# Mapeamento Detalhado — Módulo de Estoque do Space Soft (base para KAV DECK)

> Documento gerado por engenharia reversa (somente leitura/navegação — nenhum
> ajuste, inventário, vínculo de lote ou exclusão foi efetivamente salvo
> durante a exploração) do módulo de Estoque do ERP Space Soft, acessado em
> produção por uma empresa cliente real (nome omitido). Aprofunda a seção 2.19/3.4 do
> `claude.md` principal do projeto, cobrindo cada submódulo listado lá:
> Controle de Estoque, Controle por Lote, Prévia do Estoque, Estoque
> Faturado, Inventário Físico, Estoque de Caixas, Terminal de Recebimento e
> Rastreabilidade. Nomes reais de produtores rurais, clientes e fornecedores
> vistos durante a navegação foram omitidos ou descritos estruturalmente,
> seguindo a mesma convenção do `claude.md` e do
> `MAPEAMENTO_VENDAS_SPACESOFT.md`.

## 0. Confirmação da árvore de menu

O mega-menu v1 (mesmo componente já documentado no mapeamento de Vendas)
lista em "Estoque": Controle de Estoque, Controle de Estoque por Lote,
Inventário Físico, Prévia do Estoque, Estoque Faturado, Estoque de Caixas,
Terminal de Recebimento, Rastreabilidade — todos os 8 itens que o `claude.md`
já citava em prosa existem de fato como telas. Todas rodam em URLs `#/estoque/...`
do v1 (hash-router), exceto duas particularidades:

- **Inventário Físico** carrega em `#/inventory/physical/0` — rota com
  segmento em inglês, mas visualmente ainda é uma tela v1 (sem o shell de
  abas do v2). Indício de que a migração v1→v2 mexe em rotas/backend antes
  de trocar o componente visual, não as duas coisas juntas.
- **"Controle de Estoque"** (label do menu) navega para a URL
  `#/estoque/previa-estoque`, enquanto **"Prévia do Estoque"** (outro item do
  menu, conceitualmente diferente) navega para `#/estoque/estoque-previsao`.
  As duas telas começam com o mesmo primeiro passo ("Selecione um
  departamento") mas divergem depois — ver seções 1 e 3. Rótulo do menu e
  slug da URL estão trocados/invertidos entre as duas, sintoma do mesmo tipo
  de inconsistência de nomenclatura já visto no mapeamento de Vendas
  (v1/v2 usando nomes diferentes pra mesma coisa).

## 1. Controle de Estoque (kardex por produto) — `#/estoque/previa-estoque`

**Passo 1 — seleção de departamento**: tela intermediária obrigatória, "Selecione
um departamento", com um card por departamento cadastrado (empresa real tinha
4: um genérico "GERAL", um "CASA" — provavelmente despesas internas/
administrativas lançadas como pseudo-produtos —, um por linha de produto
específica, e um "PRESTAÇÃO DE SERVIÇO"). Confirma a hierarquia
Departamento → Produto já citada no `claude.md` (seção 2.3).

**Passo 2 — master-detail produto**: ao entrar num departamento, layout em
duas colunas:
- **Esquerda**: lista de "produtos" do departamento, cada item mostrando
  Saldo + unidade. Nota importante: nesta empresa real, a lista mistura
  produtos de venda de verdade (hortifrúti, embalagens) com o que parecem
  ser **rubricas de custo/despesa cadastradas como produto** (ex.: nomes de
  pessoas/colaboradores usados como "produto" pra lançar diária de trabalho,
  contas de consumo como luz/internet, contabilidade) — ou seja, o cadastro
  de Produto no Space Soft é usado como catálogo genérico de "qualquer coisa
  que precise de saldo/kardex", não só mercadoria de revenda. Ponto de
  atenção pro KAV DECK: decidir explicitamente se Produto vai ser só
  mercadoria (mais limpo) ou um catálogo genérico como aqui (mais flexível,
  mas mistura contextos diferentes na mesma tela).
- **Direita**: kardex do produto selecionado — 4 caixas de resumo no topo
  (**Anterior / Entrada / Saída / Saldo**, cada uma com sua cor: neutro,
  verde, vermelho, azul) e abaixo uma grid com colunas **#, TIPO, QTD EST.,
  QTD, UND, EMPRESA, OBSERVAÇÃO, NATUREZA, PEDIDO, #** — um lançamento por
  linha (compra, venda, ajuste), filtrável por data (campo "Data do
  estoque", um dia por vez, não intervalo).

**Filtros do painel esquerdo**: "Pesquisar por empresa", "Pesquisar por
produto" (texto livre — **não tem autocomplete/sugestão em tempo real**,
diferente do padrão visto em Vendas; digitar não filtra nem mostra
dropdown, só redesenha a lista da esquerda caso o texto bata com algum item
já carregado) e toggle "Exibir itens zerados".

**Botões da barra superior** (mudam conforme um produto está selecionado ou
não):
- **Ajuste ▾** (só aparece com produto selecionado) — "Adicionar ajuste"
  (modal simples: Quantidade, Tipo [combobox com só 2 opções: ENTRADA/
  SAÍDA], Justificativa, todos obrigatórios) e "Adicionar ajuste (Múltiplo)"
  (não aberto nesta sessão, mas pelo nome deve permitir ajustar vários
  produtos de uma vez — candidato a testar em sessão futura).
- **Conversão ▾** — troca a unidade de exibição do saldo (ex.: mostrar um
  produto medido em sacas também em quilos/caixas/bandejas), usando o fator
  de conversão de unidade de medida já citado no `claude.md` (seção 2.4).
  Inclui uma opção "LIMPAR" pra voltar à unidade original.
- **Imprimir ▾**, **Download ▾** — exportação do kardex.
- **Opções ▾** — "Exibir preços" e **"Lançar Pedido de Compra"**: atalho de
  agilidade genuíno — do meio do kardex de um produto (ex.: vendo que o
  saldo está baixo), o operador pula direto pra abrir um pedido de compra
  daquele produto, sem precisar sair da tela e ir procurar o produto de novo
  no Terminal de Compras. Mesma família de ideia do "Duplicar pedido" já
  documentado em Vendas — reduzir passos pra uma ação de reposição comum.
- **Ordenar ▾** — "Ordenar por lançamento" (padrão) / "Ordenar por
  empresa".

**Achado de arquitetura (mesma classe do erro Java visto em Vendas)**: ao
tentar mudar a "Data do estoque" digitando uma data no formato
MM/DD/AAAA (comportamento nativo esperado de um `<input type="date">` em
alguns locales) em vez do DD/MM/AAAA que a tela realmente espera, o sistema
não valida no frontend — ele manda a string malformada direto pro backend e
devolve um erro de Spring/Java cru na tela: `Method parameter
'inventoryDate': Failed to convert value of type 'java.lang.String' to
required type 'java.time.LocalDate'; ... for value [52026-02-08]`. Confirma
de novo (já visto em Vendas) que o backend é Java/Spring e que **datas
inválidas não são validadas no cliente antes do envio** — qualquer variação
de locale/formato de teclado quebra a tela com um erro técnico ilegível pro
usuário final.

## 2. Controle de Estoque por Lote — `#/estoque/controle-estoque-lote`

Tela dedicada ao rastro de **entrada** por lote, separada da anterior. Dois
modos via botão no canto superior direito, **Entradas** (padrão) / **Saídas**
(na real, "Saídas" aqui é uma tela completamente diferente — ver abaixo):

**Modo Entradas**: master-detail igual à seção 1 (lista de produtos à
esquerda com saldo total), mas a grid da direita já é por lote em vez de por
movimento: colunas **SALDO** (saldo restante daquele lote específico), **QTD
ENTR.** (quantidade original recebida), **DATA ENTR.**, **FORNECEDOR**,
**NATUREZA** (ex. "COMPRA"), **OBSERVAÇÃO**, **PEDIDO** (número clicável,
que deve linkar pro Pedido de Compra de origem). Cada linha é literalmente
um lote — no produto testado (uma commodity agrícola com giro alto), a
lista tinha dezenas de lotes de fornecedores/produtores diferentes ao longo
de mais de um ano, cada um com preço de compra (campo VALOR, visível ao
abrir a tela) diferente — **o sistema não teve nenhum problema em manter
saldo residual de lotes de datas/preços bem diferentes simultaneamente em
aberto**, confirmando que o consumo de lote não é automaticamente FIFO.

**Modo Saídas — na verdade é a fila global de "vincular lote"**: ao clicar
no botão vermelho "Saídas" a tela muda de propósito por completo (não é
"saídas por lote" simétrico ao modo Entradas — é outra funcionalidade).
Vira uma lista paginada de **toda saída de mercadoria da empresa ainda sem
lote vinculado**, com filtro "Data do movimento", "Produto" e um toggle
"Apenas não vinculado" (ligado por padrão). Colunas: ícone de lápis (ação),
QTD, UND EST., PRODUTO, VALOR, OBS., CLIENTE, PEDIDO (número, clicável),
DATA EMIS., NATUREZA. Na empresa real, essa fila tinha ~200 itens de saída
pendentes de vínculo — ou seja, **a empresa opera normalmente vendendo
produto controlado por lote sem vincular o lote no ato da venda**, deixando
esse trabalho pra ser feito depois, em lote, nesta tela. Isso é uma pista de
UX importante: **vincular lote não pode ser um bloqueador do fluxo de
venda** (reforça o que já vimos no mapeamento de Vendas — "Vincular Lote"
lá dentro do pedido é opcional/posterior, não obrigatório pra fechar a
venda).

**Modal "Vincular lote"** (aberto pelo ícone de lápis de uma linha da fila
de saída): título "Vincular lote - <PRODUTO>". Duas grids empilhadas:
- **Entradas Vinculadas** — contador "Quantidade do Pedido" vs "Quantidade
  Vinculada" no topo, grid (inicialmente vazia) com QTD, DATA DO LOTE,
  FORNECEDOR, PEDIDO — lotes já conciliados pra esta saída específica.
- **Disponível para Vincular** — grid com ícone de link por linha, QTD
  VINC., QTD DISP., QTD, VALOR, OBS., DATA DO LOTE, FORNECEDOR, PEDIDO —
  todos os lotes daquele produto com saldo disponível, **listados sem
  ordenação por data/FIFO aparente** (na tela real, lotes de datas mais
  recentes apareciam antes de lotes mais antigos com saldo). O operador
  escolhe manualmente qual lote consumir clicando no ícone de link da linha
  desejada — não existe um "vincular automático pelo mais antigo".

## 3. Prévia do Estoque (saldo futuro projetado) — `#/estoque/estoque-previsao`

Mesma tela de seleção de departamento da seção 1, mas o passo 2 é
completamente diferente — não é kardex histórico, é **projeção**:

- **Filtros**: "Data do estoque" (ponto de partida do saldo atual), "Venda
  futura" (até quando projetar), toggle "Exibir itens sem movimento",
  "Produto" (busca — mesmo texto livre sem autocomplete da seção 1).
- **Grid**: UND, PRODUTO, ESTOQUE (saldo atual), COMPRA (entradas futuras já
  confirmadas em pedido, dentro da janela de datas), SAÍDA (saídas futuras
  já confirmadas em pedido — com um ícone de lupa por linha que abre um
  modal "Itens - Saída" detalhando cada pedido de venda que compõe aquele
  número: QTD EST., QTD, UND, EMPRESA, OBSERVAÇÃO, NATUREZA, EMISSÃO,
  PEDIDO), **SALDO** (projeção final = estoque + compra − saída).
- **Botão "Copiar Saldo"** (canto superior direito) — não testado a fundo,
  mas pelo nome/posição deve copiar o saldo projetado como novo saldo base,
  provavelmente usado no fechamento de um período pra "zerar a régua" antes
  de começar a projetar o próximo.

Esta é a tela que sustenta a regra "saldo futuro projetado" citada no
`claude.md` (seção 2.19) — mostra pro comprador/gestor não só o estoque
físico de hoje, mas o que vai sobrar depois de honrar tudo que já foi
vendido e comprado mas ainda não baixou fisicamente.

## 4. Estoque Faturado — `#/estoque/controle-estoque`

Apesar do nome do menu ("Estoque Faturado"), o **título da tela** renderiza
"CONTROLE DE ESTOQUE" (mesma classe de inconsistência de nomenclatura já
registrada na seção 0) — mais um sintoma de rótulos de menu e componente
carregado não estarem 1:1.

Tela de relatório/consulta, sem master-detail: filtros **Departamento**
(combobox), **Ordenação** (PRODUTO / SALDO EM ESTOQUE), **Produto** (texto),
botão **Pesquisar**, e **Gerar relatório** no canto superior direito. Grid:
**CÓDIGO, DESCRIÇÃO, SALDO, MÍNIMO, MÁXIMO, PREV. VENDA, SALDO PREV.** —
exatamente os campos de estoque mínimo/máximo do cadastro de Produto
(`claude.md` seção 2.1) comparados lado a lado com o saldo físico e o saldo
projetado (mesma lógica da seção 3, mas em formato de lista pra comparação
rápida entre produtos, pensada pra identificar rupturas).

**Achado**: com todos os 4 departamentos da empresa testados, a grid nunca
retornou nenhuma linha (Produtos (0) mesmo mudando o filtro de
Departamento). Isso é consistente com o restante da exploração: no cadastro
de Produto desta empresa, os campos Mínimo/Máximo aparentemente não estão
preenchidos pra nenhum item — a tela existe e funciona, mas na prática o
recurso de "ponto de ruptura" não está sendo usado por este cliente real.
Vale considerar pro KAV DECK: se Mínimo/Máximo não forem preenchidos no
cadastro do produto, mostrar isso de forma explícita ("nenhum produto com
limites configurados" com um link pra configurar) em vez de uma lista vazia
sem explicação, que é o que o Space Soft faz aqui.

## 5. Inventário Físico — `#/inventory/physical/0`

Tela de ajuste manual de estoque físico (contagem de inventário), URL com
segmento em inglês (ver seção 0). Layout:

- **Filtros de busca**: Data do inventário, Departamento (combobox), Produto,
  botão Pesquisar.
- **Barra de ações** (topo direito): **+ Novo**, **Finalizar** (desabilitado
  até um inventário estar carregado/selecionado), **Excluir** (desabilitado
  do mesmo jeito), **Histórico**.
- **Grid "Itens()"**: UND, PRODUTO, SALDO EST., QTD INV. (quantidade
  contada fisicamente), DIFERENÇA (calculada), AJUSTE. Acima da grid, mais 3
  botões: **Lançamentos** (editar), **Adicionar ajustes**, **Visualizar
  ajustes**.
- **Modal "Adicionar Novo Inventário"** (botão Novo): pede só **Data do
  inventário** (obrigatório) — o mínimo possível de fricção pra abrir um
  inventário novo, todo o resto (quais produtos, quantidades) presumivelmente
  vem depois, produto a produto, na grid principal.
- **Painel "Histórico de Inventários"** (botão Histórico): filtro por Data
  inicial/final + Pesquisar. Na empresa real, buscando um intervalo de mais
  de 2 anos (01/01/2024 até hoje), **o histórico voltou vazio** — ou seja,
  esta empresa nunca fez um inventário físico formal por esta tela, apesar
  de operar ativamente há tempo. Reforça o padrão já visto em Estoque
  Faturado (seção 4) e Rastreabilidade (seção 8): vários recursos de
  controle "de segunda camada" existem no produto mas não são efetivamente
  adotados no dia a dia deste cliente real — o essencial do negócio roda em
  cima de Terminal de Compras/Vendas + Controle por Lote, e os módulos de
  auditoria/conferência ficam subutilizados.

## 6. Estoque de Caixas (comodato) — `#/estoque/controle-caixas`

Tela "Controle de Estoque de Caixas" — implementa a regra de negócio já
citada no `claude.md` (seção 4: caixas/paletes pertencem à empresa mas
circulam com clientes/fornecedores, controle separado do estoque de
mercadoria). Estrutura:

- **Painel esquerdo**: "Selecionar Empresa" — na verdade um participante
  (cliente ou fornecedor) que está com caixas em posse —, campo de busca
  texto livre + Pesquisar + botão **"+ Adicionar nova empresa"** (deve
  cadastrar um novo participante como "portador de caixas" direto desta
  tela, sem sair pro cadastro de Participante).
- **Barra superior**: **+ Adicionar movimento** (desabilitado até selecionar
  um participante) e **Imprimir**; um ícone de engrenagem ao lado do título
  do painel esquerdo abre um mini-menu **Imprimir / Download** (só da lista
  de participantes, não do movimento).
- **Área direita**: presumivelmente um mini-kardex de caixas por
  participante (entrada = caixas entregues a ele, saída = caixas
  devolvidas), mas **não foi possível confirmar o layout exato** — a busca
  de participante não retornou nenhum resultado (nem em branco nem digitando
  uma letra genérica), sugerindo que **este cliente real nunca cadastrou
  nenhum participante neste módulo**, ou seja, o comodato de embalagens
  documentado em prosa no `claude.md` não está em uso operacional nesta
  empresa (faz sentido: nem todo negócio de hortifrúti trabalha com caixa
  retornável — pode ser um recurso mais comum em operações maiores/
  atacadistas com frota própria de paletes).

## 7. Terminal de Recebimento — `#/estoque/recebimento`

Tela "Terminal de Recebimentos" — implementa os campos de conferência física
citados no `claude.md` (SIF, temperatura, validade, veículo). Estrutura:

- **Filtros**: Data da compra (um dia por vez), Fornecedor, Produto,
  Departamento (combobox), Pesquisar, toggle "Apenas pendente".
- **Grid**: **PRODUTO, FORNECEDOR, QTD, UND, RECEB.** (quantidade já
  recebida/conferida), **SALDO** (pendente), **VALIDADE**, **TEMP.**
  (temperatura de recebimento — campo textual/numérico, relevante pra
  perecíveis e produtos de origem animal), **LOTE**, **SIF** (registro do
  Serviço de Inspeção Federal do fornecedor, quando aplicável — produto de
  origem animal), **ALIM.** (provavelmente indicador "é alimento" —
  relevante pra exigências sanitárias diferentes), **ENTR.** (data/hora de
  entrada do veículo?), **VEÍC.** (identificação do veículo transportador).

**Achado**: em nenhuma combinação de data testada (incluindo datas com
movimento de compra confirmado noutras telas) a grid retornou itens. Duas
hipóteses, ambas plausíveis e válidas de documentar: (a) o filtro "Data da
compra" é estrito por dia exato e eu não acertei nenhuma data com
recebimento formal registrado; (b) — mais provável dado o padrão do resto
da sessão — **esta empresa recebe majoritariamente commodities agrícolas
(sacas de grão, por exemplo) que não passam por conferência formal de
SIF/temperatura/veículo**, já que esses campos fazem mais sentido pra
carga que exige inspeção sanitária (carnes, laticínios) do que pra grão a
granel. Ou seja: o Terminal de Recebimento provavelmente é usado só por uma
fração dos fornecedores/categorias de produto desta empresa, não por todo
recebimento.

## 8. Rastreabilidade — `#/estoque/rastreabilidade`

Tela "Rastreabilidade de Produtos", 3 abas: **Entradas / Saídas / Lotes**.

- **Aba Entradas**: grid com checkbox de seleção, #, QTD EST., QTD, UND,
  PRODUTO, DATA ENTR., FORNECEDOR, N PEDIDO. Botão **"+ Gerar lotes"** no
  topo — sugere que a vinculação lote↔rastreabilidade não é automática a
  partir da entrada de compra; precisa de uma ação manual explícita
  "Gerar lotes" pra essa entrada aparecer rastreável.
- **Aba Saídas**: espelho da anterior pro lado de venda — #, QTD EST., QTD,
  UND, PRODUTO, DATA SAIDA, CLIENTE, N PEDIDO — com botão **"+ Vincular
  lotes"** equivalente.
- **Aba Lotes**: a busca central de rastreabilidade de verdade — filtros
  Data inicial/final, Produto, Id do lote, toggle "Apenas Diponíveis" (erro
  de digitação no próprio produto: falta um "s" em "Disponíveis"). Grid:
  SALDO DISPO., DATA LOTE, PRODUTO, ID LOTE.

**Achado crítico de arquitetura**: testando as 3 abas com o produto de maior
giro da empresa (dezenas de lotes de fornecedores diferentes, confirmados
ativos na seção 2), com intervalo de data de mais de 2 anos e o toggle
"Apenas Disponíveis" desligado (pra não excluir lotes já esgotados), **as 3
abas devolveram zero resultados** — tanto buscando por substring quanto pelo
nome exato do produto. Ou seja, **o módulo de Rastreabilidade parece estar
efetivamente desconectado/não alimentado pros dados reais desta empresa**,
apesar de Controle de Estoque por Lote (seção 2) mostrar histórico rico e
ativo do mesmo produto. A causa mais provável, dado o botão "+ Gerar lotes"
citado acima: rastreabilidade neste sistema não é automática a partir do
lote já registrado em Compras/Vendas — exige um passo de "geração" que este
cliente aparentemente nunca executou. Isso é uma falha de design relevante
pra evitar na reconstrução: **um recurso citado como diferencial do produto
("rastreabilidade ponta-a-ponta", `claude.md` seção 4) que depende de um
passo manual extra e opcional na prática não é usado por clientes reais** —
o valor de rastreabilidade só existe se ela for automática, derivada
diretamente do mesmo evento de lote já registrado em Compra/Venda, sem
exigir uma ação de "publicar"/"gerar" separada.

## 9. Recomendações para a reconstrução no KAV DECK

1. **Rastreabilidade tem que ser automática, não um passo extra.** O maior
   achado desta rodada: o Space Soft tem o dado (lote, fornecedor, cliente,
   datas) espalhado em Controle por Lote, mas a tela dedicada de
   "Rastreabilidade" fica vazia porque depende de "Gerar lotes"/"Vincular
   lotes" manual. No KAV DECK, a mesma tabela de movimento de lote que já
   alimenta o kardex deve alimentar rastreabilidade nativamente — sem botão
   de "gerar" separado. Isso já está alinhado com a recomendação de
   arquitetura do `claude.md` (seção 7: "modelar lote como entidade de
   primeira classe").
2. **Vincular lote não pode bloquear o fluxo de venda/faturamento.** Confirma
   achado do mapeamento de Vendas: aqui vimos a fila de ~200 saídas
   pendentes de vínculo rodando sem problema nenhum pro dia a dia — ou seja,
   o desenho correto é permitir vender/faturar sem lote definido na hora, e
   oferecer uma tela de conciliação em lote (como a "Saídas" da seção 2)
   pra fechar isso depois, sem pressa.
3. **Data como um único campo de dia, sem intervalo, é uma limitação
   irritante repetida em várias telas** (Controle de Estoque, Terminal de
   Recebimento) — o usuário não consegue ver "essa semana" de uma vez, só
   dia a dia. No KAV DECK, preferir sempre filtro de intervalo de datas
   (como a Prévia do Estoque e a aba Lotes de Rastreabilidade já fazem
   corretamente) em vez de dia único.
4. **Nunca deixar um campo de data nativo aceitar formato ambíguo sem
   validação no cliente.** Reproduzimos o mesmo tipo de erro Java cru já
   visto em Vendas (`Failed to convert value of type 'java.lang.String' to
   required type 'java.time.LocalDate'`) só digitando uma data num formato
   de locale diferente do esperado. Validar e formatar a data no frontend
   antes de qualquer chamada de API evita isso completamente.
5. **Atalho "Lançar Pedido de Compra" direto do kardex de um produto** é um
   padrão de agilidade genuíno e barato de copiar — sempre que o usuário
   está vendo o saldo baixo de um produto, oferecer um caminho de 1 clique
   pra já abrir um rascunho de pedido de compra daquele produto
   pré-preenchido, na mesma linha de raciocínio do "Duplicar pedido" já
   implementado no módulo de Vendas do KAV DECK.
6. **Não modelar Produto como catálogo genérico de qualquer rubrica de
   custo.** A mistura vista na seção 1 (produtos de venda ao lado de
   "produtos" que na verdade são diária de colaborador, conta de luz etc.)
   deixa a lista de produtos poluída e confunde o propósito do cadastro. Se
   o KAV DECK precisar de controle de custos/despesas internas por
   categoria, isso merece uma entidade própria, não reaproveitar Produto.
7. **Tornar explícito quando um recurso não está configurado, em vez de só
   devolver lista vazia.** Estoque Faturado (mínimo/máximo não preenchidos),
   Inventário Físico (nunca usado) e Estoque de Caixas (nenhum participante
   cadastrado) todos aparecem como telas genuinamente vazias no Space Soft,
   sem nenhuma orientação de "por que está vazio" ou "como habilitar isso".
   No KAV DECK, esses estados vazios devem ter uma mensagem contextual
   (ex.: "Nenhum produto tem estoque mínimo/máximo configurado — configure
   em Produtos") em vez de uma grid muda.
8. **Manter consumo de lote com escolha manual, mas com sugestão FIFO por
   padrão.** O Space Soft permite ao operador escolher qualquer lote com
   saldo disponível no "Vincular lote", sem ordenar por data. Pra hortifrúti
   perecível, isso é um risco real de perda por vencimento (fica fácil
   esquecer o lote mais velho). No KAV DECK, ordenar a lista "Disponível
   para Vincular" por data do lote (mais antigo primeiro) por padrão,
   mantendo a liberdade de escolher outro lote manualmente quando fizer
   sentido (ex. preço, giro específico).
