-- AlterTable
ALTER TABLE "pedidos_compra" ADD COLUMN     "frete_faturado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportadora_id" UUID,
ADD COLUMN     "valor_frete" DECIMAL(14,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transportadoras" ADD COLUMN     "participante_id" UUID;

-- CreateTable
CREATE TABLE "precos_compra" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "fornecedor_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "preco" DECIMAL(14,4) NOT NULL,
    "vigencia_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "precos_compra_empresa_id_idx" ON "precos_compra"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "precos_compra_fornecedor_id_produto_id_key" ON "precos_compra"("fornecedor_id", "produto_id");

-- CreateIndex
CREATE INDEX "pedidos_compra_transportadora_id_frete_faturado_idx" ON "pedidos_compra"("transportadora_id", "frete_faturado");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_participante_id_key" ON "transportadoras"("participante_id");

-- AddForeignKey
ALTER TABLE "transportadoras" ADD CONSTRAINT "transportadoras_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_compra" ADD CONSTRAINT "precos_compra_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_compra" ADD CONSTRAINT "precos_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("participante_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_compra" ADD CONSTRAINT "precos_compra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

