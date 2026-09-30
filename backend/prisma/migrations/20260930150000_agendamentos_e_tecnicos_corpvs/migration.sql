-- CreateTable
CREATE TABLE IF NOT EXISTS "tecnicos_corpvs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(200) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "tecnicos_corpvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "agendamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data_agendamento" DATE,
    "placa" VARCHAR(30) NOT NULL,
    "unidade" VARCHAR(200),
    "uf" CHAR(2),
    "tipo_veiculo" VARCHAR(100),
    "nome_responsavel" VARCHAR(200) NOT NULL,
    "contato_responsavel" VARCHAR(30) NOT NULL,
    "numero_os" VARCHAR(100),
    "servico" VARCHAR(100) NOT NULL,
    "tipo_tecnico" VARCHAR(30) NOT NULL,
    "tecnico_corpvs_id" UUID,
    "tecnico_terceirizado_id" UUID,
    "nome_tecnico" VARCHAR(200) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Agendado',
    "motivo_frustrado" TEXT,
    "observacoes" TEXT,
    "dados_realizado" JSONB,
    "ordem_servico_terceirizado_id" UUID,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tecnicos_corpvs_nome_key" ON "tecnicos_corpvs"("nome");
CREATE INDEX IF NOT EXISTS "idx_tecnicos_corpvs_nome" ON "tecnicos_corpvs"("nome");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_agendamentos_placa" ON "agendamentos"("placa");
CREATE INDEX IF NOT EXISTS "idx_agendamentos_status" ON "agendamentos"("status");
CREATE INDEX IF NOT EXISTS "idx_agendamentos_data" ON "agendamentos"("data_agendamento");
CREATE INDEX IF NOT EXISTS "idx_agendamentos_tipo_tec" ON "agendamentos"("tipo_tecnico");
CREATE INDEX IF NOT EXISTS "idx_agendamentos_unidade" ON "agendamentos"("unidade");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_tecnico_corpvs_id_fkey') THEN
        ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_tecnico_corpvs_id_fkey" FOREIGN KEY ("tecnico_corpvs_id") REFERENCES "tecnicos_corpvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_tecnico_terceirizado_id_fkey') THEN
        ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_tecnico_terceirizado_id_fkey" FOREIGN KEY ("tecnico_terceirizado_id") REFERENCES "tecnicos_terceirizados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_ordem_servico_terceirizado_id_fkey') THEN
        ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_ordem_servico_terceirizado_id_fkey" FOREIGN KEY ("ordem_servico_terceirizado_id") REFERENCES "ordens_servicos_terceirizados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
