ALTER TYPE "RoleUsuario" ADD VALUE IF NOT EXISTS 'FUNCIONARIO';

ALTER TABLE "pontos_acesso" ADD COLUMN "usuario_id" UUID;

-- Vincula o acesso principal ao primeiro administrador das empresas já existentes.
UPDATE "pontos_acesso" AS p
SET "usuario_id" = (
  SELECT u."id"
  FROM "usuarios" AS u
  WHERE u."empresa_id" = p."empresa_id" AND u."role" = 'ADMIN'
  ORDER BY u."criado_em" ASC
  LIMIT 1
)
WHERE p."tipo" = 'PRINCIPAL' AND p."usuario_id" IS NULL;

-- Distribui licenças extras antigas entre os demais usuários da mesma empresa.
WITH acessos AS (
  SELECT p."id", p."empresa_id",
         ROW_NUMBER() OVER (PARTITION BY p."empresa_id" ORDER BY p."criado_em", p."id") AS ordem
  FROM "pontos_acesso" p
  WHERE p."tipo" = 'EXTRA' AND p."usuario_id" IS NULL AND p."status" <> 'ENCERRADO'
), usuarios_sem_acesso AS (
  SELECT u."id", u."empresa_id",
         ROW_NUMBER() OVER (PARTITION BY u."empresa_id" ORDER BY u."criado_em", u."id") AS ordem
  FROM "usuarios" u
  WHERE NOT EXISTS (SELECT 1 FROM "pontos_acesso" p WHERE p."usuario_id" = u."id")
)
UPDATE "pontos_acesso" p
SET "usuario_id" = u."id"
FROM acessos a
JOIN usuarios_sem_acesso u ON u."empresa_id" = a."empresa_id" AND u."ordem" = a."ordem"
WHERE p."id" = a."id";

CREATE UNIQUE INDEX "pontos_acesso_usuario_id_key" ON "pontos_acesso"("usuario_id");
ALTER TABLE "pontos_acesso"
  ADD CONSTRAINT "pontos_acesso_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
