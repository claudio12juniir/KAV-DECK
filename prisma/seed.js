import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const {
    SEED_EMPRESA_CNPJ,
    SEED_EMPRESA_RAZAO_SOCIAL,
    SEED_ADMIN_SUPABASE_USER_ID,
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_NOME,
  } = process.env;

  const required = {
    SEED_EMPRESA_CNPJ,
    SEED_EMPRESA_RAZAO_SOCIAL,
    SEED_ADMIN_SUPABASE_USER_ID,
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_NOME,
  };
  for (const [key, value] of Object.entries(required)) {
    if (!value) throw new Error(`Variável de ambiente ${key} não definida.`);
  }

  const empresa = await prisma.empresa.upsert({
    where: { cnpj: SEED_EMPRESA_CNPJ },
    update: {},
    create: { cnpj: SEED_EMPRESA_CNPJ, razaoSocial: SEED_EMPRESA_RAZAO_SOCIAL },
  });

  // O id precisa ser o mesmo UUID do usuário criado no Supabase Auth,
  // para que middlewares/auth.js consiga casar o JWT com a linha em `usuarios`.
  const usuario = await prisma.usuario.upsert({
    where: { id: SEED_ADMIN_SUPABASE_USER_ID },
    update: {},
    create: {
      id: SEED_ADMIN_SUPABASE_USER_ID,
      empresaId: empresa.id,
      nome: SEED_ADMIN_NOME,
      email: SEED_ADMIN_EMAIL,
      role: "ADMIN",
    },
  });

  console.log("Seed concluído:", { empresaId: empresa.id, usuarioId: usuario.id });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
