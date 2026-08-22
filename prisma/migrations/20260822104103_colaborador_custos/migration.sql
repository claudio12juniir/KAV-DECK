-- AlterTable
ALTER TABLE "colaboradores" ADD COLUMN     "valor_inss" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valor_outros_encargos" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valor_salario" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valor_vale_alimentacao" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valor_vale_transporte" DECIMAL(14,2) NOT NULL DEFAULT 0;
