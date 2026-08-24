-- CreateTable
CREATE TABLE "tributacoes_produto_cfop" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "cfop_id" UUID NOT NULL,
    "icms_id" UUID,
    "ipi_id" UUID,
    "pis_id" UUID,
    "cofins_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tributacoes_produto_cfop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tributacoes_produto_cfop_empresa_id_idx" ON "tributacoes_produto_cfop"("empresa_id");

-- CreateIndex
CREATE INDEX "tributacoes_produto_cfop_cfop_id_idx" ON "tributacoes_produto_cfop"("cfop_id");

-- CreateIndex
CREATE UNIQUE INDEX "tributacoes_produto_cfop_produto_id_cfop_id_key" ON "tributacoes_produto_cfop"("produto_id", "cfop_id");

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_cfop_id_fkey" FOREIGN KEY ("cfop_id") REFERENCES "cfops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_icms_id_fkey" FOREIGN KEY ("icms_id") REFERENCES "regras_icms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_ipi_id_fkey" FOREIGN KEY ("ipi_id") REFERENCES "regras_ipi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_pis_id_fkey" FOREIGN KEY ("pis_id") REFERENCES "regras_pis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributacoes_produto_cfop" ADD CONSTRAINT "tributacoes_produto_cfop_cofins_id_fkey" FOREIGN KEY ("cofins_id") REFERENCES "regras_cofins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
