-- Session revocation and existing access flag
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "can_access_gestao_solar" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Complete the migration history for legacy fleet/tutorial tables that were
-- previously created manually in Supabase.
CREATE TABLE IF NOT EXISTS "unidades_clientes" (
  "id" SERIAL NOT NULL,
  "nome_unidade" VARCHAR(200) NOT NULL,
  "cod_cliente" INTEGER,
  "razao_social" VARCHAR(300),
  "uf" CHAR(2),
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "unidades_clientes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "modelos_rastreadores" (
  "id" SERIAL NOT NULL,
  "nome_modelo" VARCHAR(200) NOT NULL,
  "tipo_veiculo" VARCHAR(100) NOT NULL,
  "valor_instalacao" DECIMAL(10,2) DEFAULT 0,
  "valor_mensalidade" DECIMAL(10,2) DEFAULT 0,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "modelos_rastreadores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "instalacoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "descricao_veiculo" VARCHAR(255),
  "modulo" VARCHAR(100),
  "operacao" VARCHAR(100),
  "placa" VARCHAR(30) NOT NULL,
  "data_instalacao" DATE,
  "unidade_id" INTEGER,
  "modelo_id" INTEGER,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "instalacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "retiradas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "placa" VARCHAR(30) NOT NULL,
  "status" VARCHAR(100) DEFAULT 'Retirado',
  "data_retirada" DATE,
  "unidade_id" INTEGER,
  "modelo_id" INTEGER,
  "motivo" TEXT,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "retiradas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "log_movimentacoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "placa" VARCHAR(30) NOT NULL,
  "tipo" VARCHAR(50) NOT NULL DEFAULT 'TRANSFERENCIA',
  "unidade_origem_id" INTEGER,
  "unidade_destino_id" INTEGER,
  "usuario_id" TEXT,
  "data_movimentacao" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "log_movimentacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bibliotecas_can" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "arquivo_nome" TEXT,
  "arquivo_url" TEXT,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "bibliotecas_can_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "equipamentos_padrao" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Ativo',
  "finalidade" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "equipamentos_padrao_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "perfis_motos" (
  "nome" TEXT NOT NULL,
  "arquivo_nome" TEXT,
  "arquivo_url" TEXT,
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "perfis_motos_pkey" PRIMARY KEY ("nome")
);
CREATE TABLE IF NOT EXISTS "scripts_unidades" (
  "unidade" TEXT NOT NULL,
  "arquivo_nome" TEXT,
  "arquivo_url" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "scripts_unidades_pkey" PRIMARY KEY ("unidade")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instalacoes_unidade_id_fkey') THEN
    ALTER TABLE "instalacoes" ADD CONSTRAINT "instalacoes_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades_clientes"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instalacoes_modelo_id_fkey') THEN
    ALTER TABLE "instalacoes" ADD CONSTRAINT "instalacoes_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos_rastreadores"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retiradas_unidade_id_fkey') THEN
    ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades_clientes"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retiradas_modelo_id_fkey') THEN
    ALTER TABLE "retiradas" ADD CONSTRAINT "retiradas_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos_rastreadores"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'log_movimentacoes_unidade_origem_id_fkey') THEN
    ALTER TABLE "log_movimentacoes" ADD CONSTRAINT "log_movimentacoes_unidade_origem_id_fkey" FOREIGN KEY ("unidade_origem_id") REFERENCES "unidades_clientes"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'log_movimentacoes_unidade_destino_id_fkey') THEN
    ALTER TABLE "log_movimentacoes" ADD CONSTRAINT "log_movimentacoes_unidade_destino_id_fkey" FOREIGN KEY ("unidade_destino_id") REFERENCES "unidades_clientes"("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_instalacoes_modelo_id" ON "instalacoes"("modelo_id");
CREATE INDEX IF NOT EXISTS "idx_instalacoes_unidade_id" ON "instalacoes"("unidade_id");
CREATE INDEX IF NOT EXISTS "idx_retiradas_data" ON "retiradas"("data_retirada");
CREATE INDEX IF NOT EXISTS "idx_retiradas_placa" ON "retiradas"("placa");
CREATE INDEX IF NOT EXISTS "idx_log_mov_data" ON "log_movimentacoes"("data_movimentacao");
CREATE INDEX IF NOT EXISTS "idx_log_mov_placa" ON "log_movimentacoes"("placa");

-- Normalize active fleet plates before enforcing the business rule: one active
-- installation per plate. The migration intentionally aborts if dirty duplicates
-- exist so that no production record is discarded automatically.
UPDATE "instalacoes"
SET "placa" = upper(regexp_replace("placa", '[^a-zA-Z0-9]', '', 'g'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "instalacoes" GROUP BY "placa" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem placas duplicadas em instalacoes. Corrija-as antes de executar esta migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_instalacoes_placa" ON "instalacoes"("placa");

CREATE TABLE IF NOT EXISTS "tecnicos_terceirizados" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "telefone" VARCHAR(30),
  "regiao" VARCHAR(150) NOT NULL,
  "homologado" BOOLEAN NOT NULL DEFAULT false,
  "cnh_url" TEXT,
  "cnh_nome" TEXT,
  "comprovante_residencia_url" TEXT,
  "comprovante_residencia_nome" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "tecnicos_terceirizados_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tecnico_servicos_precos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tecnico_id" UUID NOT NULL,
  "nome_servico" VARCHAR(200) NOT NULL,
  "valor" DECIMAL(10,2) NOT NULL,
  "gera_devolucao" BOOLEAN NOT NULL DEFAULT false,
  "is_km" BOOLEAN NOT NULL DEFAULT false,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "tecnico_servicos_precos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tecnico_equipamentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tecnico_id" UUID NOT NULL,
  "modelo_equipamento" VARCHAR(150) NOT NULL,
  "quantidade" INTEGER NOT NULL DEFAULT 0,
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "tecnico_equipamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tecnico_movimentacoes_equipamentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tecnico_id" UUID NOT NULL,
  "modelo_equipamento" VARCHAR(150) NOT NULL,
  "tipo" VARCHAR(50) NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "motivo_ou_os" VARCHAR(255),
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "tecnico_movimentacoes_equipamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ordens_servicos_terceirizados" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "numero_os" VARCHAR(100) NOT NULL,
  "tecnico_id" UUID NOT NULL,
  "servico_id" UUID,
  "placa" VARCHAR(30) NOT NULL,
  "uf" CHAR(2),
  "unidade" VARCHAR(200),
  "tipo_veiculo" VARCHAR(100),
  "nome_servico" VARCHAR(200) NOT NULL,
  "valor_servico" DECIMAL(10,2) NOT NULL,
  "teve_km_rodado" BOOLEAN NOT NULL DEFAULT false,
  "km_quantidade" DECIMAL(10,2) DEFAULT 0,
  "valor_km_unitario" DECIMAL(10,2) DEFAULT 0,
  "valor_km_total" DECIMAL(10,2) DEFAULT 0,
  "valor_total_cobrado" DECIMAL(10,2) NOT NULL,
  "numero_nf" VARCHAR(100),
  "status" VARCHAR(50) NOT NULL DEFAULT 'Agendado',
  "equipamentos_utilizados" JSONB,
  "exige_devolucao" BOOLEAN NOT NULL DEFAULT false,
  "equipamento_devolvido" BOOLEAN NOT NULL DEFAULT false,
  "data_devolucao" TIMESTAMPTZ,
  "usuario_devolucao" VARCHAR(200),
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "ordens_servicos_terceirizados_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ordens_servicos_terceirizados" ADD COLUMN IF NOT EXISTS "servico_id" UUID;
UPDATE "ordens_servicos_terceirizados"
SET "placa" = upper(regexp_replace("placa", '[^a-zA-Z0-9]', '', 'g'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tecnico_servicos_precos_tecnico_id_fkey') THEN
    ALTER TABLE "tecnico_servicos_precos" ADD CONSTRAINT "tecnico_servicos_precos_tecnico_id_fkey"
      FOREIGN KEY ("tecnico_id") REFERENCES "tecnicos_terceirizados"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tecnico_equipamentos_tecnico_id_fkey') THEN
    ALTER TABLE "tecnico_equipamentos" ADD CONSTRAINT "tecnico_equipamentos_tecnico_id_fkey"
      FOREIGN KEY ("tecnico_id") REFERENCES "tecnicos_terceirizados"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tecnico_movimentacoes_equipamentos_tecnico_id_fkey') THEN
    ALTER TABLE "tecnico_movimentacoes_equipamentos" ADD CONSTRAINT "tecnico_movimentacoes_equipamentos_tecnico_id_fkey"
      FOREIGN KEY ("tecnico_id") REFERENCES "tecnicos_terceirizados"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servicos_terceirizados_tecnico_id_fkey') THEN
    ALTER TABLE "ordens_servicos_terceirizados" ADD CONSTRAINT "ordens_servicos_terceirizados_tecnico_id_fkey"
      FOREIGN KEY ("tecnico_id") REFERENCES "tecnicos_terceirizados"("id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordens_servicos_terceirizados_servico_id_fkey') THEN
    ALTER TABLE "ordens_servicos_terceirizados" ADD CONSTRAINT "ordens_servicos_terceirizados_servico_id_fkey"
      FOREIGN KEY ("servico_id") REFERENCES "tecnico_servicos_precos"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "tecnico_servicos_precos"
    GROUP BY "tecnico_id", lower(btrim("nome_servico")) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem serviços duplicados por técnico. Corrija-os antes desta migration.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "ordens_servicos_terceirizados"
    GROUP BY "tecnico_id", "numero_os" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem números de O.S. duplicados para o mesmo técnico.';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_tecnicos_nome" ON "tecnicos_terceirizados"("nome");
CREATE INDEX IF NOT EXISTS "idx_tecnicos_regiao" ON "tecnicos_terceirizados"("regiao");
CREATE INDEX IF NOT EXISTS "idx_tecnico_servicos_tecnico_id" ON "tecnico_servicos_precos"("tecnico_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tecnico_servico_nome" ON "tecnico_servicos_precos"("tecnico_id", "nome_servico");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tecnico_servico_nome_ci" ON "tecnico_servicos_precos"("tecnico_id", lower(btrim("nome_servico")));
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tecnico_modelo_unique" ON "tecnico_equipamentos"("tecnico_id", "modelo_equipamento");
CREATE INDEX IF NOT EXISTS "idx_mov_equip_tecnico_data" ON "tecnico_movimentacoes_equipamentos"("tecnico_id", "criado_em");
CREATE INDEX IF NOT EXISTS "idx_os_tecnico_id" ON "ordens_servicos_terceirizados"("tecnico_id");
CREATE INDEX IF NOT EXISTS "idx_os_servico_id" ON "ordens_servicos_terceirizados"("servico_id");
CREATE INDEX IF NOT EXISTS "idx_os_placa" ON "ordens_servicos_terceirizados"("placa");
CREATE INDEX IF NOT EXISTS "idx_os_status" ON "ordens_servicos_terceirizados"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_os_tecnico_numero" ON "ordens_servicos_terceirizados"("tecnico_id", "numero_os");

ALTER TABLE "tecnico_servicos_precos" DROP CONSTRAINT IF EXISTS "ck_tecnico_servico_valor_nonnegative";
ALTER TABLE "tecnico_servicos_precos" ADD CONSTRAINT "ck_tecnico_servico_valor_nonnegative" CHECK ("valor" >= 0);
ALTER TABLE "tecnico_equipamentos" DROP CONSTRAINT IF EXISTS "ck_tecnico_equipamento_quantidade_nonnegative";
ALTER TABLE "tecnico_equipamentos" ADD CONSTRAINT "ck_tecnico_equipamento_quantidade_nonnegative" CHECK ("quantidade" >= 0);
ALTER TABLE "ordens_servicos_terceirizados" DROP CONSTRAINT IF EXISTS "ck_os_status";
ALTER TABLE "ordens_servicos_terceirizados" ADD CONSTRAINT "ck_os_status" CHECK ("status" IN ('Agendado', 'Aguardando data', 'Realizado'));

ALTER TABLE "tecnicos_terceirizados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tecnico_servicos_precos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tecnico_equipamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tecnico_movimentacoes_equipamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ordens_servicos_terceirizados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "unidades_clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modelos_rastreadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instalacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retiradas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "log_movimentacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bibliotecas_can" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipamentos_padrao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "perfis_motos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scripts_unidades" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Supabase Storage: both buckets must remain private. Downloads are exposed only
-- through short-lived signed URLs generated by the authenticated API.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    EXECUTE $sql$
      INSERT INTO storage.buckets (id, name, public)
      VALUES
        ('documentos_terceirizados', 'documentos_terceirizados', false),
        ('arquivos_tutoriais', 'arquivos_tutoriais', false)
      ON CONFLICT (id) DO UPDATE SET public = false
    $sql$;
  END IF;
END $$;
