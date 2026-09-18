-- Conta bancária padrão para emissão de boletos (Financeiro > Configuração
-- no Space Soft) — referência opcional de Empresa para uma ContaBancaria já
-- cadastrada.
ALTER TABLE "empresas" ADD COLUMN "conta_bancaria_padrao_boleto_id" UUID;

CREATE INDEX "empresas_conta_bancaria_padrao_boleto_id_idx" ON "empresas"("conta_bancaria_padrao_boleto_id");

ALTER TABLE "empresas" ADD CONSTRAINT "empresas_conta_bancaria_padrao_boleto_id_fkey" FOREIGN KEY ("conta_bancaria_padrao_boleto_id") REFERENCES "contas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
