-- CreateTable
CREATE TABLE "sessoes_ativas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "sessao_id" TEXT NOT NULL,
    "dispositivo" TEXT,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acesso_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_ativas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_ativas_usuario_id_key" ON "sessoes_ativas"("usuario_id");

-- AddForeignKey
ALTER TABLE "sessoes_ativas" ADD CONSTRAINT "sessoes_ativas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
