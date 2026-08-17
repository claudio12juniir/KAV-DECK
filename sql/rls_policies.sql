-- =========================================================================
-- RLS (Row Level Security) multi-tenant para o ERP KAV
-- Executar no SQL Editor do Supabase APÓS `prisma migrate deploy`.
-- Isola cada linha pela empresa (tenant) do usuário autenticado.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Função auxiliar: resolve a empresa (tenant) do usuário logado.
--    SECURITY DEFINER para poder ler "usuarios" mesmo com RLS ativo nela
--    (evita recursão infinita ao usá-la na policy da própria tabela).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$;

-- -------------------------------------------------------------------------
-- 2. Tabelas com coluna empresa_id direta: policy padrão de isolamento.
-- -------------------------------------------------------------------------
DO $$
DECLARE
  tabela text;
  tabelas text[] := ARRAY[
    'usuarios', 'colaboradores',
    'departamentos', 'categorias', 'unidades_medida', 'produtos',
    'regras_icms', 'regras_ipi', 'regras_pis', 'regras_cofins', 'regras_ibs', 'regras_cbs',
    'tabelas_preco', 'condicoes_pagamento',
    'participantes', 'grupos_empresas', 'transportadoras', 'rotas_entrega',
    'pedidos_compra', 'pedidos_venda',
    'lotes', 'movimentos_estoque', 'inventarios_fisicos',
    'tipos_caixa_embalagem', 'movimentos_comodato',
    'titulos_financeiros', 'movimentos_caixa', 'contas_bancarias',
    'plano_contas', 'centros_custo', 'cheques_emitidos', 'cheques_terceiros',
    'notas_fiscais', 'naturezas_operacao', 'certificados_digitais'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tabela);

    EXECUTE format(
      'CREATE POLICY tenant_select ON %I FOR SELECT USING (empresa_id = app_current_empresa_id())',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (empresa_id = app_current_empresa_id())',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY tenant_update ON %I FOR UPDATE USING (empresa_id = app_current_empresa_id()) WITH CHECK (empresa_id = app_current_empresa_id())',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY tenant_delete ON %I FOR DELETE USING (empresa_id = app_current_empresa_id())',
      tabela
    );
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- 3. Tabelas-filhas sem empresa_id próprio: isolamento via JOIN à tabela pai.
-- -------------------------------------------------------------------------

-- enderecos (via participantes)
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON enderecos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = enderecos.participante_id AND p.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = enderecos.participante_id AND p.empresa_id = app_current_empresa_id()
  ));

-- clientes (via participantes)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON clientes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = clientes.participante_id AND p.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = clientes.participante_id AND p.empresa_id = app_current_empresa_id()
  ));

-- fornecedores (via participantes)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON fornecedores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = fornecedores.participante_id AND p.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM participantes p
    WHERE p.id = fornecedores.participante_id AND p.empresa_id = app_current_empresa_id()
  ));

-- itens_tabela_preco (via tabelas_preco)
ALTER TABLE itens_tabela_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_tabela_preco FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_tabela_preco FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tabelas_preco t
    WHERE t.id = itens_tabela_preco.tabela_preco_id AND t.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM tabelas_preco t
    WHERE t.id = itens_tabela_preco.tabela_preco_id AND t.empresa_id = app_current_empresa_id()
  ));

-- itens_pedido_compra (via pedidos_compra)
ALTER TABLE itens_pedido_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_compra FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_pedido_compra FOR ALL
  USING (EXISTS (
    SELECT 1 FROM pedidos_compra pc
    WHERE pc.id = itens_pedido_compra.pedido_compra_id AND pc.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos_compra pc
    WHERE pc.id = itens_pedido_compra.pedido_compra_id AND pc.empresa_id = app_current_empresa_id()
  ));

-- itens_pedido_venda (via pedidos_venda)
ALTER TABLE itens_pedido_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_venda FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_pedido_venda FOR ALL
  USING (EXISTS (
    SELECT 1 FROM pedidos_venda pv
    WHERE pv.id = itens_pedido_venda.pedido_venda_id AND pv.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos_venda pv
    WHERE pv.id = itens_pedido_venda.pedido_venda_id AND pv.empresa_id = app_current_empresa_id()
  ));

-- devolucoes_venda (via pedidos_venda)
ALTER TABLE devolucoes_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_venda FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON devolucoes_venda FOR ALL
  USING (EXISTS (
    SELECT 1 FROM pedidos_venda pv
    WHERE pv.id = devolucoes_venda.pedido_venda_id AND pv.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos_venda pv
    WHERE pv.id = devolucoes_venda.pedido_venda_id AND pv.empresa_id = app_current_empresa_id()
  ));

-- itens_devolucao_venda (via devolucoes_venda -> pedidos_venda)
ALTER TABLE itens_devolucao_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_devolucao_venda FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_devolucao_venda FOR ALL
  USING (EXISTS (
    SELECT 1 FROM devolucoes_venda dv
    JOIN pedidos_venda pv ON pv.id = dv.pedido_venda_id
    WHERE dv.id = itens_devolucao_venda.devolucao_venda_id AND pv.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM devolucoes_venda dv
    JOIN pedidos_venda pv ON pv.id = dv.pedido_venda_id
    WHERE dv.id = itens_devolucao_venda.devolucao_venda_id AND pv.empresa_id = app_current_empresa_id()
  ));

-- itens_inventario (via inventarios_fisicos)
ALTER TABLE itens_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_inventario FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_inventario FOR ALL
  USING (EXISTS (
    SELECT 1 FROM inventarios_fisicos inv
    WHERE inv.id = itens_inventario.inventario_fisico_id AND inv.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM inventarios_fisicos inv
    WHERE inv.id = itens_inventario.inventario_fisico_id AND inv.empresa_id = app_current_empresa_id()
  ));

-- itens_nota_fiscal (via notas_fiscais)
ALTER TABLE itens_nota_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_nota_fiscal FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON itens_nota_fiscal FOR ALL
  USING (EXISTS (
    SELECT 1 FROM notas_fiscais nf
    WHERE nf.id = itens_nota_fiscal.nota_fiscal_id AND nf.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM notas_fiscais nf
    WHERE nf.id = itens_nota_fiscal.nota_fiscal_id AND nf.empresa_id = app_current_empresa_id()
  ));

-- manifestacoes_destinatario (via notas_fiscais)
ALTER TABLE manifestacoes_destinatario ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestacoes_destinatario FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON manifestacoes_destinatario FOR ALL
  USING (EXISTS (
    SELECT 1 FROM notas_fiscais nf
    WHERE nf.id = manifestacoes_destinatario.nota_fiscal_id AND nf.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM notas_fiscais nf
    WHERE nf.id = manifestacoes_destinatario.nota_fiscal_id AND nf.empresa_id = app_current_empresa_id()
  ));

-- baixas_titulo (via titulos_financeiros)
ALTER TABLE baixas_titulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE baixas_titulo FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON baixas_titulo FOR ALL
  USING (EXISTS (
    SELECT 1 FROM titulos_financeiros tf
    WHERE tf.id = baixas_titulo.titulo_financeiro_id AND tf.empresa_id = app_current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM titulos_financeiros tf
    WHERE tf.id = baixas_titulo.titulo_financeiro_id AND tf.empresa_id = app_current_empresa_id()
  ));

-- -------------------------------------------------------------------------
-- 4. Tabela global (sem tenant): cfops — valores padronizados pela SEFAZ.
--    Leitura liberada para qualquer usuário autenticado; escrita reservada
--    à service_role (que ignora RLS por padrão no Supabase).
-- -------------------------------------------------------------------------
ALTER TABLE cfops ENABLE ROW LEVEL SECURITY;
CREATE POLICY leitura_autenticados ON cfops FOR SELECT
  USING (auth.role() = 'authenticated');
