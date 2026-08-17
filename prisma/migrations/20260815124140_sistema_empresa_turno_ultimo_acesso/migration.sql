-- CreateEnum
CREATE TYPE "TurnoEntrega" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'SOS', 'RETIRA');

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "email_servico" TEXT,
ADD COLUMN     "logotipo_data_url" TEXT,
ADD COLUMN     "telefone" TEXT;

-- AlterTable
ALTER TABLE "pedidos_venda" ADD COLUMN     "turno" "TurnoEntrega";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ultimo_acesso_em" TIMESTAMP(3);

