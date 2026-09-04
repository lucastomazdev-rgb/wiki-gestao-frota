import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Iniciando semeação do banco de dados (Seeding)...');

  // Usuários nunca são criados por seed. O primeiro administrador deve usar
  // o fluxo protegido por INITIAL_SETUP_TOKEN; os demais são criados no painel.

  // 1. Criar ou Atualizar Categorias
  const catInstalacao = await prisma.category.upsert({
    where: { slug: 'instalacao-fisica' },
    update: {},
    create: {
      name: 'Instalação Física de Dispositivos',
      slug: 'instalacao-fisica',
      description: 'Guias com esquemas de fiação elétrica e locais físicos de instalação nos veículos.',
      iconName: 'Wrench'
    }
  });

  const catSistemas = await prisma.category.upsert({
    where: { slug: 'plataformas-sistemas' },
    update: {},
    create: {
      name: 'Plataformas e Sistemas',
      slug: 'plataformas-sistemas',
      description: 'Treinamento de softwares operacionais, autenticação e uso do Scuti.',
      iconName: 'Cpu'
    }
  });

  const catCadastro = await prisma.category.upsert({
    where: { slug: 'procedimentos-cadastro' },
    update: {},
    create: {
      name: 'Procedimentos de Cadastro',
      slug: 'procedimentos-cadastro',
      description: 'Procedimentos de cadastro correto no Vanguarda',
      iconName: 'BookOpen'
    }
  });

  console.log('✓ Categorias criadas/garantidas.');

  // 3. Criar Artigos de Exemplo (se não existirem)
  const existingArticleCount = await prisma.article.count();
  if (existingArticleCount === 0) {
    await prisma.article.create({
      data: {
        title: 'Cadastro de Pessoas',
        slug: 'cadastro-de-pessoas',
        categoryId: catCadastro.id,
      contentMarkdown: `# Cadastro de Pessoas no Vanguarda

Guia passo a passo para o cadastro, atualização e gestão de usuários (Condutores e Supervisores) na plataforma Vanguarda da operação Solar Coca-Cola, garantindo elegibilidade ao Ranking de Motoristas e acesso ao aplicativo mobile.

---

## 📌 1. Regras e Canais de Solicitação

> 🛑 **REGRA CRÍTICA DE SEGURANÇA E PROCESSOS:**  
> * **Abertura de Chamado (SD):** Todo cadastro, atualização ou inativação de usuário (condutor ou supervisor) DEVE ser solicitado obrigatoriamente via abertura de chamado **SD**.  
> * **Exceção por E-mail:** Em casos muito específicos, a solicitação pode ser aceita via e-mail corporativo oficial.  
> * 🚫 **PROIBIDO VIA SMARTZAP:** Nunca cadastrar, atualizar ou inativar cadastros mediante solicitações feitas via SmartZap. Orientar educadamente o solicitante a abrir um chamado SD.

---

## 📋 2. Pré-requisitos para Cadastro de Condutores

Antes de iniciar o cadastro de um condutor no Vanguarda, certifique-se de que os seguintes itens foram configurados no sistema:

1. 👤 **Cadastro prévio do Supervisor:** O supervisor responsável pela equipe deve estar cadastrado previamente.
2. 👥 **Criação da Equipe:** Realizada em \`Cadastro > Equipes\` (no Vanguarda), atribuindo o supervisor cadastrado.
3. 🧮 **Fórmula de Avaliação:** Cadastrada em \`Cadastro > Ranking de Motoristas > Fórmulas de Avaliação\` (Fórmulas para Pesados e Motos).
4. 💳 **Cartão RFID:** Cadastrado em \`Cadastro > Cartão\` com a unidade, categoria de motorista e numeração decimal (conforme regras do tópico de cartões RFID).

---

## 💻 3. Passo a Passo do Cadastro no Modal Vanguarda

O cadastro é realizado por abas dentro do modal de criação de usuário.

### 3.1. 👤 Aba 1: "Pessoa"

| Campo | Condutor (Motorista) | Supervisor / Outros |
| :--- | :--- | :--- |
| **Nome** | Inserir o nome completo em **MAIÚSCULO** | Inserir o nome completo em **MAIÚSCULO** |
| **Unidade** | Selecionar a unidade em que o colaborador é contratado | Selecionar a unidade em que o colaborador é contratado |
| **Grupo** | Deixar em **BRANCO** | Marcar o Grupo de Veículos da unidade (permite a visualização dos veículos do grupo no app). |
| **CPF** | **OBRIGATÓRIO:** Preencher o CPF com os 11 dígitos (incluindo zero inicial, se houver). O CPF será o **login** de acesso. | Preencher o CPF correto do colaborador |

---

### 3.2. 🔑 Aba 2: "Acesso"

| Campo | Condutor (Motorista) | Supervisor / Outros |
| :--- | :--- | :--- |
| **Apelido** | Repetir exatamente o mesmo nome cadastrado na aba "Pessoa" | Repetir exatamente o mesmo nome cadastrado na aba "Pessoa" |
| **E-mail** | Seguir o padrão obrigatório: \`CPF@app.com.br\` (ex: \`01234567890@app.com.br\`) | Informar o e-mail corporativo da SolarBR |
| **Senha** | O próprio número do CPF (11 dígitos) | Senha padrão: \`solar2026\` |
| **Perfil** | \`Motoristas Pesados ou Motos SolarBR.\` | \`Supervisão SolarBR\` |

> 💡 **Detalhamento dos Perfis:**  
> * **\`Motoristas Pesados ou Motos SolarBR.\`:** Concede direito de acesso **exclusivamente ao aplicativo mobile** (o condutor não consegue acessar a interface Web).  
> * **\`Supervisão SolarBR\`:** Utilizado por supervisores para gestão e acompanhamento no sistema Web e App.  
> * **\`Monitoramento SolarBR\`:** Perfil mais utilizado por aprendizes, assistentes administrativos, etc.

---

### 3.3. 🪪 Aba 3: "Dados do Colaborador" (Elegibilidade e Ranking)

> ⚡ **PONTO MAIS CRÍTICO DO CADASTRO:**  
> Esta aba contém os campos vitais que tornam o condutor elegível para pontuar e figurar no **Ranking de Motoristas**.

| Campo | Regras e Orientações de Preenchimento |
| :--- | :--- |
| **Cargo** | **OBRIGATÓRIO INICIAR COM "Motorista":**<br>• \`Motorista de entrega\` *(para Pesados)*<br>• \`Motorista vendedor\` *(para Motos)*<br>*(Esse prefixo é o gatilho para o condutor aparecer no ranking e torna os campos adicionais, como CNH, obrigatórios).* |
| **Matrícula** | Informar a matrícula funcional do colaborador |
| **Equipe** | Selecionar a equipe do condutor. *(Exige prévio cadastro do Supervisor e da Equipe em \`Cadastro > Equipes\`).* |
| **Fórmula de Avaliação** | Selecionar a fórmula de pontuação baseada na operação (\`Regra de Pesado\` ou \`Regra de Moto\`). *(Cadastrada previamente em \`Cadastro > Ranking de Motoristas > Fórmulas de Avaliação\`).* |
| **Cartão** | Selecionar o cartão RFID decimal correspondente. *(Cadastrado em \`Cadastro > Cartão\`).* **Atenção:** Sem o cartão associado corretamente, nada do que o condutor fizer na condução será computado, pois o sistema entende que ele não está em rota. |
| **Dados de CNH** | Preencher todos os dados da CNH fornecidos (número, categoria, validade). |

---

## 📊 4. Resumo Comparativo: Condutor vs. Supervisor

| Campo / Função | Condutor (Pesado / Moto) | Supervisor |
| :--- | :---: | :---: |
| **Canal de Solicitação** | Chamado SD (ou E-mail em casos específicos) | Chamado SD (ou E-mail em casos específicos) |
| **Formato de E-mail** | \`CPF@app.com.br\` | E-mail corporativo SolarBR |
| **Senha Padrão** | CPF (11 dígitos) | \`solar2026\` |
| **Perfil** | \`Motoristas Pesados ou Motos SolarBR\` | \`Supervisão SolarBR\` |
| **Tipo de Acesso** | Exclusivo Mobile (App) | Web e Mobile |
| **Preenchimento de Fórmula** | ✅ Obrigatório | ❌ Não necessário |
| **Preenchimento de Equipe** | ✅ Obrigatório | ❌ Não necessário |
| **Preenchimento de Cartão RFID** | ✅ Obrigatório | ❌ Não necessário |
| **Preenchimento de CNH** | ✅ Obrigatório | ❌ Não necessário |

---

## 🔍 5. Diagnóstico e Resolução de Problemas

### 🚨 Sintoma: "O condutor não aparece no Ranking de Motoristas ou o aplicativo não registra pontuação"

Sempre que houver chamados ou reclamações de motoristas sem pontuação no app ou fora do ranking, a causa quase sempre é um **erro ou omissão no cadastro**.

Siga este checklist de auditagem no cadastro do colaborador no Vanguarda:

- [ ] **Prefixagem do Cargo:** Confirmar se o cargo começa estritamente com \`Motorista\` (\`Motorista de entrega\` ou \`Motorista vendedor\`).
- [ ] **Vínculo de Equipe:** Verificar se a equipe foi selecionada corretamente no cadastro.
- [ ] **Fórmula de Avaliação:** Garantir que a fórmula de avaliação referente à modalidade (Pesados ou Motos) está atrelada.
- [ ] **Associação do Cartão RFID:** Validar se a numeração decimal do cartão em \`Cadastro > Cartão\` está associada ao usuário. Se não estiver, o sistema não computará as viagens do condutor.
- [ ] **Validade e Dados de CNH:** Confirmar se todos os campos da CNH estão devidamente preenchidos.
- [ ] **CPF e Login:** Verificar se o CPF possui os 11 dígitos corretos e se o perfil concedido é o mobile (\`Motoristas Pesados\` ou \`Motos SolarBR\`).
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  await prisma.article.create({
    data: {
      title: 'Instalação do Rastreador Virloc6 Caminhão Solar',
      slug: 'instalacao-rastreador-virloc6-caminhao-solar',
      categoryId: catInstalacao.id,
      contentMarkdown: `# Instalação do Rastreador Virloc6 Caminhão Solar

Manual de instalação e manutenção técnica do equipamento Rastreador Virloc06 para a frota de caminhões Solar.

---

## 1. Introdução

Este manual é destinado aos técnicos devidamente treinados e qualificados, no intuito de auxiliar nos procedimentos de instalação e manutenção.

> ⚠️ **IMPORTANTE:** Cabe ressaltar que quaisquer reparos ou serviços podem ser perigosos se forem realizados por pessoas não habilitadas. Somente profissionais treinados devem instalar, dar partida inicial e prestar qualquer manutenção nos equipamentos objetos deste manual.

---

## 📋 Pré-Instalação

Antes de iniciar a instalação dos ativos, é de extrema importância que se verifiquem os seguintes itens do veículo:

- [ ] **Partes plásticas do veículo**
- [ ] **Painel de instrumentos do veículo**
- [ ] **Vidros**
- [ ] **Abertura das portas**
- [ ] **Funcionamento do Motor**
- [ ] **Luzes de erro no painel**
- [ ] **Adesivos de identificação**

---

## 🛠️ Materiais para Instalação do Sistema

Para realizar a instalação completa do sistema, assegure-se de ter em mãos os seguintes componentes:

* **Rastreador Virloc6 CAN BT TERMINAL**
* **KIT LEITOR RFID COM VOZ**
* **CHICOTE ELÉTRICO**
* **RELÉ 24 VOLTS OU 12 VOLTS** (dependendo da especificação do caminhão)
* **CHIP ALGAR**

---

## 1. Alimentação

A prévia instalação do equipamento requer que sejam avaliadas se todas as medidas de tensão que serão utilizadas estão de acordo com as especificações técnicas.

* **Tensão de Operação:** O VIRLOC 06 pode ser alimentado com tensão em corrente contínua de **9 a 40VDC**.
* **Identificação:** As tensões também estão especificadas na etiqueta traseira do equipamento, onde consta o número de série.

> 💡 **Práticas Importantes:**
> 1. Proteger os fios com fita isolante/auto-fusão adequada.
> 2. Instalar o equipamento no interior do veículo em local seco e sem umidade.
> 3. Não deixar os cabos próximos a emissores de rádio frequência.
> 4. Caso utilizar fusível, eles devem ser de **3A**.
> 5. Os fusíveis ou placas de proteção previstos no equipamento protegem o equipamento e **não a instalação**.

---

## 2. Fixação do Equipamento

Sabemos que o ambiente nem sempre provê condições ideais para acondicionamento do equipamento no processo de instalação. Independente da forma de fixação do equipamento, o profissional responsável pela instalação deverá garantir as seguintes condições:

- O equipamento deve ser fixado com firmeza, sem folgas para evitar vibrações indesejadas.
- Para a instalação é possível utilizar fita adesiva dupla face, parafusos ou abraçadeiras de Nylon.
- O acabamento do veículo é o padrão, então faça o chicote no padrão do veículo.
- O equipamento **não deve ficar suspenso pelo chicote**.

![Rastreador Virloc6](/images/virloc6/virloc6.png)

---

## 3. Entradas e Saídas (I/O)

Já no lado que será conectado ao veículo, temos os fios livres que serão utilizados para a instalação, conforme suas funções descritas na tabela abaixo:

| I/O | Descrição / Funções | Cores |
| :--- | :--- | :--- |
| **IN0** | Ignição | **Marrom** |
| **IN1** | Entrada Digital 1 | **Vermelho** |
| **IN2** | Entrada Digital 2 | **Laranja** |
| **IN3** | Entrada Digital 3 | **Azul** |
| **OUT0** | Saída Digital 0 | **Verde** |
| **OUT1** | Saída Digital 1 | **Amarelo** |

### 📌 Observações Técnicas:
* Para o **VIRLOC 06 CAN** ou **CAN-BT**, as entradas digitais 1 e 2 (fios **vermelho** e **laranja**) possuirão resistores de **2,2kΩ** como proteção para conexão ao barramento CAN do veículo.
* O VIRLOC 06 acompanha o chicote de instalação **MA-68**, que é conectado ao VL06 com conectores microfit e permitem a ligação da alimentação, CAN, sensores e periféricos.

---

## 4. Visão Geral (Pinout do Conector MA-68)

![Chicote e Conector Virloc6 MA-68](/images/virloc6/cabo_virloc.png)

| Pino | Conjunto | Descrição / Funções | Cores |
| :---: | :---: | :--- | :--- |
| **1** | IN3 | RX da comunicação TTL | Azul |
| **2** | OUT0 | BLOQUEIO CORPVS | Verde |
| **3** | IN0 | BOTÃO DE PÂNICO | Marrom |
| **4** | GND | Negativo (Terra) | Preto |
| **5** | IN2 | CAN1 Low | Laranja |
| **6** | IN1 | CAN1 High | Vermelho |
| **7** | OUT1 | TX da comunicação TTL | Amarelo |
| **8** | VCC | Alimentação (9 a 30VDC) | Vermelho |
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  await prisma.article.create({
    data: {
      title: 'Manual de Configuração: Rastreador ST4305 na Plataforma Scuti',
      slug: 'manual-configuracao-st4305-scuti',
      categoryId: catSistemas.id,
      contentMarkdown: `# Manual de Configuração: Rastreador ST4305 na Plataforma Scuti

Manual completo de operação, parametrização de telemetria, gestão de cartões RFID de condutores e procedimentos de envio de perfil na plataforma Scuti para a frota de motos da Solar Coca-Cola.

---

## 1. Introdução à Operação e Dispositivos

Na operação da **Solar Coca-Cola**, a frota é categorizada em duas principais frentes, cada uma utilizando um dispositivo de rastreamento específico:

* **Operação Pesados (Caminhões):** Utiliza o dispositivo **Virloc6**.
* **Operação Leve (Motos):** Utiliza o dispositivo **ST4305**. *(É importante notar que o ST4305 também é empregado em modelos de caminhões mais antigos, como observado na operação de Cajazeiras OP).*

Ambos os dispositivos requerem configurações específicas. Este manual focará exclusivamente na **Operação de Leves (Motos)**, utilizando o equipamento **ST4305**.

A configuração é realizada através da **plataforma Scuti** (distribuidora oficial da Suntech) e se baseia na importação de um *"Perfil de Configuração"*. Neste perfil, abordaremos duas frentes principais:
1. **Parâmetros de telemetria:** Referentes a curvas, acelerações e frenagens bruscas.
2. **Liberação de cartões de identificação:** Para o desbloqueio da moto.

---

## 2. Documentação Técnica e Especificações

Antes de iniciar a configuração, é crucial ter acesso ao manual do equipamento para consulta das especificações técnicas.

### 📥 Como baixar o manual:
1. Acesse o site de suporte da Suntech: [Suntech do Brasil - Downloads](https://www.suntechdobrasil.com.br/suporte#downloads)
2. Nos filtros de busca, selecione:
   * **Linha:** Rastreador
   * **Modelo:** ST4305
3. Acesse o caminho: \`Manual > Manual do usuário ST8300 Rev24\`.

---

## 3. Configuração de Parâmetros de Telemetria (Infrações)

Com o manual em mãos, é possível verificar os códigos que definem as sensibilidades de condução. Esses parâmetros são preenchidos e calibrados pelo equipamento, com valores que variam de **1 a 512 G**.

| Parâmetro | Código | Descrição |
| :--- | :---: | :--- |
| **Aceleração Brusca** | **1912** | Valor da aceleração brusca registrada pelo equipamento. |
| **Frenagem Brusca** | **1913** | Valor da frenagem brusca registrada pelo equipamento. |
| **Curva Acentuada** | **1914** | Valor da curva brusca registrada pelo equipamento. |
| **Velocidade para aceleração brusca** | **1921** | Velocidade mínima (km/h) exigida para que o dispositivo valide o evento de aceleração brusca. |
| **Velocidade para frenagem brusca** | **1922** | Velocidade mínima (km/h) exigida para que o dispositivo valide o evento de frenagem brusca. |
| **Velocidade para curva acentuada** | **1923** | Velocidade mínima (km/h) exigida para que o dispositivo valide o evento de curva acentuada. |

### 🔍 Como ler o Perfil de Configuração:
Os números acima (ex: \`1912\`) indicam a linha e o campo no código de configuração do rastreador:
* Os dois primeiros dígitos representam a **Linha** (ex: \`19\`).
* Os dois últimos dígitos representam o **Campo** (ex: \`12#\`).

> 💡 **Exemplo Prático:** O parâmetro **1912** significa que, na linha **19**, o campo **12#** dita a sensibilidade da Aceleração Brusca. Similarmente, o parâmetro **1921** significa que, na linha **19**, o campo **21#** define a velocidade mínima para registrar essa aceleração.

### 🔄 Atualização de Firmware
Ao analisar o código, verifique o campo de versão de firmware, geralmente sinalizado como \`VERSION=3.1.24\`.

* A versão **3.1.24** é a atual e padrão para todos os rastreadores.
* Caso encontre outra versão (como a versão **3.0.19**), é obrigatório alterar esse campo para a versão atual (**3.1.24**).

---

## 4. Autenticação e Liberação de Condutores (Cartões RFID)

Na Solar Coca-Cola, as motos possuem bloqueio, e apenas cartões liberados na memória do equipamento conseguem desbloqueá-las.

* **Frequência exigida:** \`13.56MHz\`
* **Padrão de leitura do equipamento:** \`One-Wire\`

### 4.1. Entendendo os Cartões CORPVS
Os cartões disponibilizados pela CORPVS possuem duas numerações impressas:
* **Canto inferior esquerdo (Decimal):** Uma conversão decimal própria. **NÃO UTILIZAMOS** esta numeração em nenhum sistema.
* **Canto inferior direito (Hexadecimal):** Uma sequência alfanumérica de 8 caracteres (Ex: \`0F42DED2\`). Esta é a numeração principal que usaremos para a lógica de liberação.

### 4.2. Conversão de Dados
O rastreador não interpreta a numeração Hexadecimal pura. É necessário convertê-la utilizando a planilha padrão de conversões:

🔗 [Acessar Planilha Padrão de Conversão RFID](https://docs.google.com/spreadsheets/d/1MSWDQrk_e1aSvVGZhCaxG38BRKU-H6RSty3NpMtCKkk/edit?gid=2058632925#gid=2058632925)

#### 🔹 Passo 1: Hexadecimal para Decimal (Identificação no Vanguarda)
1. Acesse a aba **Conversor Hex>Dec** na planilha.
2. Insira a numeração Hexadecimal do cartão (Ex: \`0F42DED2\`).
3. O resultado será um número Decimal (Ex: \`3537781263\`).

> 📝 **Nota:** Este número decimal é o que aparecerá na GRID do sistema Vanguarda e deve ser associado ao cadastro do motorista.

#### 🔹 Passo 2: Decimal para One-Wire (Inclusão no Rastreador)
1. Com o número Decimal em mãos, vá para a aba **Conversor Dec>1Wire**.
2. A planilha gerará o código One-Wire (Ex: \`B90F42DED2410001\`).

> 🧬 **Anatomia do código One-Wire:** O código gerado é composto pelo Hexadecimal original inserido entre um prefixo e um sufixo padrão:
> * **Prefixo:** \`B9\`
> * **Hexadecimal:** \`0F42DED2\`
> * **Sufixo:** \`410001\`

---

## 5. Inserindo e Removendo Cartões no Perfil de Configuração

Com as numerações One-Wire geradas, é necessário adicioná-las ao script de configuração que será enviado à memória do equipamento.

As linhas responsáveis pelo armazenamento de cartões são:
* \`HAD,PRG;;18;,\`
* \`HAD,PRG;;38;,\`
* \`HAD,PRG;;39;,\`
* \`HAD,PRG;;1800;,\`

### 📋 Lógica de Preenchimento (Linhas 18, 38 e 39)
As linhas iniciam a listagem de cartões seguindo uma ordem numérica sequencial e crescente, separada pelos caracteres \`#\` e \`;\`.

* **Formato:** \`00#NumeroOneWire;01#NumeroOneWire;02#NumeroOneWire;\` ... e assim por diante.
* **Capacidade:** As linhas 18, 38 e 39 podem armazenar **100 cartões cada** (da posição \`00#\` até \`99#\`).
* **Estrutura visual:** Cada linha de código no script geralmente acomoda 19 cartões antes de quebrar para a próxima linha.

> ⚠️ **Importante:** Cada posição (\`00#\`, \`01#\`, etc.) representa um *"slot"* (espaço) para um cartão diferente. É fundamental respeitar a sequência lógica e crescente ao adicionar novos colaboradores.

### 📋 Lógica da Linha 1800
A linha \`HAD,PRG;;1800;\` segue a mesma regra de preenchimento sequencial, mas possui uma capacidade expandida, começando no \`00#\` e podendo ir até a posição \`3000#\` e além.

### 🗑️ Como Remover um Cartão (Perda, quebra ou desligamento)
É de suma importância manter a memória do equipamento atualizada e revogar acessos de cartões perdidos ou de ex-colaboradores.

1. No script de configuração, localize a numeração Hexadecimal do cartão (ela está no *"meio"* da numeração One-Wire).
2. Ao encontrar o cartão, substitua o código por uma sequência de zeros.
   * **Exemplo:** Se o cartão estava em \`05#B90F42DED2410001;\`, altere para \`05#00000;\`.

> 🚫 **NUNCA apague a posição (\`05#\`), apenas zere o valor à frente dela.** Mantenha os perfis antigos como base para criar novos, atentando-se para limpar slots vazios corretamente.

---

## 6. Importação e Atualização do Perfil na Plataforma Scuti

Com o arquivo de texto configurado (parâmetros e cartões atualizados), o próximo passo crucial é carregar esse perfil na plataforma Scuti.

Acesse o site da Scuti e navegue até a aba **"Profiles" (Perfis)**. Nesta tela, observe três colunas principais:
* **Name (Nome):** O nome de identificação do perfil no sistema.
* **File Name (Nome do Arquivo):** O nome do arquivo salvo (geralmente em verde e clicável para download).
* **File (Arquivo):** Coluna que contém o ícone de "Importar".

### ⚙️ Passo a passo para atualizar um perfil existente:
1. **Baixar o perfil atual:** Na coluna *File Name*, localize o cliente/operação desejada e clique no link verde para baixar o arquivo vigente. *Exemplo:* \`4305_COCA_ALGAR_20260511\`.
2. **Editar:** Realize as edições necessárias de cartões ou parâmetros (conforme detalhado nas seções anteriores) neste arquivo baixado.
3. **Renomear com a data atual:** Após concluir e salvar as alterações, você deve renomear o arquivo para refletir a data da modificação.
   * *Exemplo:* Se a alteração for feita hoje, dia 18/05/2026, o arquivo \`4305_COCA_ALGAR_20260511\` passará a se chamar \`4305_COCA_ALGAR_20260518\`.
4. **Importar o novo arquivo:** Retorne à aba *Profiles*, localize a linha correspondente ao nome do perfil específico (Ex: \`ST4305_ALGAR_COCA_MOTO\`) e clique no ícone de **"Importar"** na coluna *File* para subir o seu arquivo recém-nomeado.

---

## 7. Atualização do Perfil nos Veículos (Módulos)

Após carregar o perfil na Scuti, é preciso enviar essa configuração para a moto. Acesse a aba **"Devices" (Dispositivos)**. Existem duas maneiras de realizar este envio: **Individual** ou **Em Massa**.

### 7.1. Envio Individual
Ideal para atualizar uma única moto específica.

1. **Buscar o Módulo:** Na barra *Search*, cole o número do equipamento ST4305 (Ex: \`16100...\`) e aperte Enter.
2. **Analisar o Status:** O sistema filtrará o equipamento. Atente-se às seguintes colunas:
   * **Last Comm (Última Comunicação):** Data e hora da última vez que o rastreador "falou" com a plataforma.
   * **Firmware:** A versão atual do sistema do equipamento.
   * **Profile / Status:** Mostra qual perfil está associado e o status atual da atualização:
     * 🟠 \`Requesting\` (Solicitado/Pendente)
     * 🔵 \`In process\` (Processando)
     * 🟢 \`Updated\` (Atualizado com sucesso)
     * 🔴 \`Error\` (Falha na atualização)
3. **Enviar a Atualização:** Clique no ícone de Engrenagem (*Change Profile*) ao lado do módulo e selecione o perfil que você acabou de importar na aba anterior. O status mudará imediatamente para **Requesting** (laranja).

### 7.2. Táticas para Agilizar o Envio Individual
Para forçar o rastreador a processar o perfil mais rapidamente, você pode utilizar três alternativas:

* 🔑 **Tática 1 (Física):** Solicite ao técnico ou cliente que ligue a ignição da moto (deixe em "meia chave").
* 📡 **Tática 2 (Via Vanguarda):** Acesse o *Vanguarda > Envio de comandos > Selecione COMANDO LIVRE*.
  * Digite: \`CMD;NÚMERORASTREADOR;01;01\` (Ex: \`CMD;1610049059;01;01\`).
  * *Observação:* Substitua "NÚMERORASTREADOR" pelo serial correto. Esse comando força a comunicação com a Scuti. O Vanguarda não retornará "Data de Execução", então não há confirmação visual por lá, apenas na própria Scuti.
* 🔄 **Tática 3 (Via IOT Algar - Apenas chips Algar):**
  * Descubra o ICCID do módulo acessando o Service (*Monitoramento > Suporte > Cadastro de CHIP*).
  * Acesse o site da IOT Algar, busque pelo ICCID e envie um comando de **Reset**. Isso reiniciará o chip e forçará a busca pela atualização.

---

## 8. Atualização de Perfis em Massa (Múltiplos Veículos)

Se você precisa atualizar várias motos ao mesmo tempo com o perfil recém-importado, utilize o recurso em massa na aba **"Devices"**.

1. **Iniciar Atribuição:** Clique no botão vermelho **"Assign Profile"**.
2. **Inserir Equipamentos:** Uma janela se abrirá contendo um campo de texto livre. Cole os números dos módulos que deseja atualizar, colocando um número abaixo do outro (quebra de linha).
3. **Checagem de Viabilidade:** Clique no botão azul **"Check"**. O sistema validará se os equipamentos estão aptos a receber atualizações.
   * ⚠️ *Atenção:* Se algum módulo apresentar erro na lista, remova-o do quadro e tente atualizá-lo individualmente depois.
4. **Finalizar Envio:** Quando o sistema retornar "OK" para todos os módulos inseridos, vá até o menu suspenso **"Select a profile"**, escolha o perfil desejado e clique em **"Assign"**.
5. **Acompanhamento:** Acompanhe o progresso na própria aba *Devices*, verificando se o status evolui de \`Requesting\` para \`Updated\`, utilizando as táticas de agilização do item 7.2 caso algum equipamento fique travado.

---

## 🔗 Downloads e Links de Suporte

* 📄 [Suntech do Brasil - Central de Downloads](https://www.suntechdobrasil.com.br/suporte#downloads)
* 📊 [Planilha Padrão de Conversão de Cartões RFID (Google Sheets)](https://docs.google.com/spreadsheets/d/1MSWDQrk_e1aSvVGZhCaxG38BRKU-H6RSty3NpMtCKkk/edit?gid=2058632925#gid=2058632925)
`,
      videoUrl: '',
      fileDownloadUrl: 'https://docs.google.com/spreadsheets/d/1MSWDQrk_e1aSvVGZhCaxG38BRKU-H6RSty3NpMtCKkk/edit?gid=2058632925#gid=2058632925'
    }
  });

  await prisma.article.create({
    data: {
      title: 'Fluxograma bloqueio de moto',
      slug: 'fluxograma-bloqueio-de-moto',
      categoryId: catSistemas.id,
      contentMarkdown: `# Fluxograma bloqueio de moto

Guia operacional e fluxograma de decisão para atendimento de ocorrências onde o cliente/condutor informa que a moto não está ligando.

---

## 1. Objetivo do Fluxo

Este material orienta o colaborador no atendimento de ocorrências em que o cliente informa:
**“Minha moto não está ligando”**.

O objetivo é:
- Coletar evidências iniciais obrigatórias;
- Identificar o comportamento do bloqueio e modelo do veículo;
- Validar cartão / identificador / rastreador;
- Direcionar a moto para manutenção quando necessário.

---

## 2. Coleta Inicial Obrigatória

> 🛑 **REGRA DE ATENDIMENTO:** Antes de qualquer conclusão, é **OBRIGATÓRIO** solicitar a placa da moto e um vídeo completo do ocorrido.

### 🎥 O vídeo enviado pelo condutor precisa obrigatoriamente mostrar:
1. **Placa da moto**.
2. **Painel de instrumentos**.
3. **Identificador RFID** e aproximação do cartão.
4. **Tentativa de partida**.
5. **Som do bipe** (áudio nítido do teste).

---

## 3. Identificação do Modelo e Posição do Identificador

Conforme o modelo da moto, a posição do identificador e o comportamento do painel variam:

| Modelo | Posição do Identificador | Comportamento Esperado ao Passar o Cartão |
| :--- | :--- | :--- |
| **Motos 2025** | Carenagem preta, lado direito | Ao girar meia chave, a luz da injeção acende e apaga rapidamente. O identificador bipa. Ao passar o cartão, o bipe para e a luz da injeção acende, liberando a moto. |
| **Motos anteriores a 2025** | Tanque, lado direito, acima do logo Honda | Ao girar meia chave, o painel apaga e o identificador bipa. Ao passar o cartão, o painel volta a acender e o bipe para, liberando a moto. |

### 📍 Localização Física de Instalação do Identificador

![Local de Instalação do Identificador nas Motos](/images/fluxograma_moto/local_instalacao.png)

---

## 4. Cenário A - O Bipe Não Para ao Passar o Cartão

Quando o condutor aproxima o cartão e o identificador **continua bipando**, significa que o cartão **ainda não foi lido**.

> 🔍 **Prioridade:** Confirmar se o identificador está no local correto ou se caiu/descolou da moto.

* **Possível causa mais comum:** Identificador caiu, descolou ou está fora do ponto correto de leitura. Em grande parte dos casos, a falha é resolvida recolocando o identificador no local.
* **Ação imediata:** Solicitar que o condutor passe a mão por baixo da moto e verifique se o identificador caiu. Se encontrar, orientar a recolocar no local e refazer o teste com o cartão.

### 📋 Passo a Passo Operacional
1. Solicitar vídeo do teste com o cartão aproximado do identificador.
2. Confirmar se o identificador está no local correto de instalação.
3. Pedir ao condutor para verificar se o identificador caiu ou está pendurado.
4. Caso o identificador seja encontrado, recolocar e testar novamente.
5. Se o identificador estiver no local correto e mesmo assim não ler o cartão, tratar como **possível falha no identificador**.

### ⚠️ Quando Caracterizar Falha no Identificador
Se o condutor enviar vídeo passando o cartão diretamente no identificador, com o identificador no local correto, e o bipe continuar sem parar, o atendimento deve considerar falha no identificador.

* **Perfil emergencial:** \`ST4305_ALGAR_FROTA_PADRÃO\`

> 🚨 **ATENÇÃO:** Ao aplicar o perfil \`ST4305_ALGAR_FROTA_PADRÃO\`, a moto fica sem bloqueio e passa a ligar sem necessidade de cartão. A moto deve ser orientada para uso emergencial, com direcionamento para moto reserva e encaminhamento obrigatório ao setor de Frotas para manutenção.
> 
> 📘 *Siga o Manual de Configuração Scuti para saber mais detalhes sobre como pode fazer o upload do perfil ST4305_ALGAR_FROTA_PADRÃO na moto.*

---

## 5. Cenário B - O Bipe Para, Mas a Moto Não Desbloqueia

Neste cenário, o identificador confirma a leitura do cartão (o som do bipe cessa), porém o bloqueio não é liberado corretamente.

### 🛑 Sintomas por Ano/Modelo:
* **Sintoma em motos antigas:** O identificador para de bipar, mas o painel **não volta a acender**.
* **Sintoma em motos 2025:** O identificador para de bipar, mas a **luz da injeção não acende** no painel.

### 🔹 Passo 1 - Verificar Interferência na Leitura
Antes de alterar perfil ou cartão, confirme se o condutor está passando o cartão junto com crachá, celular ou objeto metálico. Esses itens podem interferir na identificação.

> 🗣️ **Orientação ao condutor:**  
> *“Por gentileza, teste novamente passando somente o cartão branco, sem crachá, celular ou qualquer outro item próximo.”*

### 🔹 Passo 2 - Validar se o Cartão Está Autorizado
Se a moto continuar bloqueada, solicite uma foto do cartão. A numeração utilizada é a **Hexadecimal com 8 caracteres**, normalmente localizada no lado direito do cartão.
* **Exemplo de HEX:** \`410ED137\`

#### ⚙️ Procedimento na SCUTI:
1. Acessar a aba **Profiles**.
2. Baixar o perfil correspondente da moto, geralmente \`ST4305_ALGAR_COCA_MOTO\`.
3. Abrir o perfil e pressionar \`CTRL + F\`.
4. Pesquisar a numeração hexadecimal do cartão.
5. **Se localizar a numeração:** Reenviar o perfil para a moto e testar novamente.
6. **Se não localizar:** Converter HEX para 1-WIRE, inserir no perfil e atualizar a moto.

> 📘 *Siga o Manual de Configuração Scuti para saber mais detalhes sobre como pode fazer a adição do cartão no perfil.*

---

## 6. Validação no Operacional e Falha de Rastreador

Existe a possibilidade de o identificador bipar confirmando a leitura do cartão, mas a moto continuar bloqueada porque a informação não chega corretamente ao rastreador/sistema.

### 🔍 Como Validar:
1. Pesquisar a placa da moto no operacional.
2. Verificar se está chegando o dado **Motorista**.
3. **Se o dado Motorista não chegar:** Considerar possível falha no rastreador. Aplicar o perfil emergencial (\`ST4305_ALGAR_FROTA_PADRÃO\`) para liberar a moto e encaminhar para Frotas.

> 🚨 **REGRA CRÍTICA:** Toda moto identificada com falha e colocada no perfil \`ST4305_ALGAR_FROTA_PADRÃO\` deve ser **comunicada e encaminhada obrigatoriamente ao setor de Frotas**. Não pode haver moto da Solar rodando com esse perfil sem identificação, controle e manutenção programada.
> 
> 📘 *Siga o Manual de Configuração Scuti para saber mais detalhes sobre como pode fazer o upload do perfil ST4305_ALGAR_FROTA_PADRÃO na moto.*

---

## 7. Painel Piscando ou Moto Engasgando

Casos em que o painel fica piscando, a partida fica fraca ou a moto fica “engasgando” devem ser tratados como **possível problema de bateria**.

### ⚡ Sintomas Típicos:
* Painel piscando.
* Partida fraca.
* Moto falhando ao ligar / Comportamento de engasgo.

> 🔋 **Ação recomendada:** Encaminhar para verificação da bateria e avaliação mecânica/elétrica. **Não tratar inicialmente como falha de cartão** quando o sintoma principal for energia/partida fraca.

---

## 8. Checklist de Atendimento e Resumo Rápido de Decisão

| Etapa | Sintoma | O que Confirmar | Causa Provável | Ação | Resultado Esperado |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Coleta inicial** | Solicitou placa e vídeo completo? | N/A | Exigir vídeo com painel, identificador, cartão e áudio do bipe. | Evidência suficiente para análise inicial. |
| **2** | **Modelo do veículo** | Identificou se a moto é 2025 ou anterior? | N/A | Verificar tabela de posição do identificador. | Comportamento esperado do painel/luz da injeção definido. |
| **3** | **Bipe não para** | O bipe para ao passar o cartão? | Identificador caiu ou falhou | Verificar local do identificador. Se mantiver falha, perfil padrão emergencial e enviar para Frotas. | **Sim:** Cartão lido.<br>**Não:** Verificar identificador caído/falha. |
| **4** | **Bipe para, mas não desbloqueia** | Condutor está passando cartão sozinho? | Interferência ou cartão não autorizado | Testar cartão sozinho. Validar numeração no perfil na SCUTI. | Eliminar interferência de crachá, celular ou metal. Se não estiver, converter HEX para 1-WIRE e atualizar perfil. |
| **5** | **Cartão lido, mas Motorista não chega** | Dado Motorista chega no operacional? | Possível falha no rastreador | Perfil padrão emergencial, moto reserva e encaminhar para manutenção. | Se não chega, possível falha no rastreador. |
| **6** | **Painel piscando / moto engasgando** | Painel pisca ou moto engasga? | Possível bateria fraca | Encaminhar para verificação de bateria. | Avaliar bateria. Descartar falha de cartão. |
| **7** | **Uso de perfil emergencial** | Foi usado perfil padrão emergencial? | Moto liberada sem bloqueio | Registrar e enviar obrigatoriamente para Frotas. | Registrado e enviado obrigatoriamente para Frotas. |
| **8** | **Casos atípicos** | Nenhum dos cenários anteriores resolveu | Falha não catalogada | Realizar análise cautelosa, revisar particularidades da instalação e acionar suporte avançado. | Cobertura total das ocorrências operacionais de "moto não está ligando". |
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  await prisma.article.create({
    data: {
      title: 'Como fazer a tratativa de Falhas',
      slug: 'como-fazer-a-tratativa-de-falhas',
      categoryId: catSistemas.id,
      contentMarkdown: `# Como fazer a tratativa de Falhas de Comunicação

Material de treinamento para capacitação de colaboradores no fluxo de tratativa de falhas de comunicação de veículos da **Solar Coca-Cola**.

---

## 📌 1. Visão Geral & Importância Operacional

Este material tem como objetivo orientar os colaboradores na tratativa de **falhas de comunicação de veículos** (veículos que não estão transmitindo na plataforma de rastreamento).

> ⚠️ **IMPORTANTE - IMPACTO NO MONITORAMENTO:**
> Na **Solar Coca-Cola**, existe um sistema de **pontuação por condutor**. Caso o veículo não esteja transmitindo os dados de telemetria, o monitoramento da condução fica totalmente inviável, fazendo com que o condutor fique fora do radar de avaliação da empresa.

### Canal Duplo de Tratativa
1. **1ª Tentativa (Formalização em Lote):** Disparo automatizado de e-mail via Google Apps Script.
2. **2ª Tentativa (Contato Direto Operacional):** Atendimento e cobrança via **SmartZap** com os pontos focais da unidade.

---

## 📊 2. Estrutura da Planilha "Falhas Coca Cola"

Todas as tratativas e dados de apoio estão centralizados na planilha oficial da operação:
🔗 [Acessar Planilha Falhas Coca Cola (Google Sheets)](https://docs.google.com/spreadsheets/d/1_HFVfC1TMKLEc0TbsPTa6GnMqhNqcP_y8wWuVNKnKh4/edit?usp=sharing)

![Estrutura da Planilha Falhas Coca Cola](/images/falhas/picture1_falhas.png)

### Descrição das Abas da Planilha:

| Aba | Função / Finalidade |
| :--- | :--- |
| **\`Dinâmica\`** | Local de preenchimento dos dados atuais (\`Unidade\`, \`Placa\`, \`Tratativa\`) para execução do envio automático de e-mails. |
| **\`Pontos focais\`** | Contém a lista de e-mails dos responsáveis por cada unidade. Serve de base para o disparo dos e-mails automáticos. Adicione ou remova e-mails aqui seguindo o padrão. |
| **\`Contato responsáveis\`** | Cadastro com o número de telefone e nome do responsável de cada unidade para contato via SmartZap. |
| **\`Fonte\`** | Base de dados completa de toda a operação Solar. **Precisa ser mantida sempre atualizada!** Sempre que houver instalação, retirada ou mudança de titularidade, atualize esta aba. É dela que extraímos \`Unidade\`, \`Tipo de Veículo\` e \`UF\`. |
| **\`Falhas DD.MM\`** | Abas históricas de falhas puxadas por data (Exemplo: *Falhas 09.07*, *Falhas 15.07*). |

---

## 🕒 3. Extração dos Veículos sem Comunicação no Vanguarda

> 🗓️ **FREQUÊNCIA DE EXTRAÇÃO:** As falhas são puxadas **toda quarta-feira no período da tarde** (quando os veículos já estão em rota).

### Passo a Passo no Vanguarda:
1. Acesse o módulo **Operacional** da plataforma Vanguarda.
2. Busque pelo cliente: **\`SOLAR BR - MATRIZ\`**.
3. Clique no **Ícone Cinza** para filtrar os veículos sem comunicação.
4. Clique em **"Exportar todos os dados"** para baixar a lista em formato Excel (\`.xlsx\`).

![Extração dos Veículos sem Comunicação no Vanguarda](/images/falhas/picture2_falhaseditado.png)

---

## 📋 4. Preparação da Nova Aba na Planilha

1. Abra a planilha **Falhas Coca Cola**.
2. Clique com o botão direito na aba da **última tratativa** efetuada (Exemplo: \`Falhas 09.07\`) e selecione **Duplicar**.
3. Renomeie a nova aba duplicada com a data atual em que fez o download das falhas (Exemplo: \`Falhas 15.07\`).
4. Apague os dados antigos da tabela, mantendo apenas o cabeçalho.
5. Da planilha baixada do Vanguarda, copie e cole nas respectivas colunas:
   - **\`PLACA\`** (Coluna A)
   - **\`GPRS / Última Transmissão\`** (Coluna D)
   - **\`BATERIA\`** (Coluna E)

![Preparação da Nova Aba na Planilha](/images/falhas/picture3_falhas.png)

---

## 🧮 5. Aplicação de Fórmulas para Enriquecimento dos Dados

Com as colunas **Placa (A)**, **GPRS (D)** e **Bateria (E)** preenchidas na linha 2, aplique as seguintes fórmulas nas demais colunas (arrastando para as demais linhas):

### 🔹 Unidade (Coluna B - Célula \`B2\`):
\`\`\`excel
=ÍNDICE(Fonte!C:C;CORRESP(A2;Fonte!B:B;0))
\`\`\`

### 🔹 UF (Coluna C - Célula \`C2\`):
\`\`\`excel
=ÍNDICE(Fonte!D:D;CORRESP(A2;Fonte!B:B;0))
\`\`\`

### 🔹 Situação da Bateria (Coluna F - Célula \`F2\`):
\`\`\`excel
=SE(E2<11;"BATERIA BAIXA";"BATERIA OK")
\`\`\`

### 🔹 Tipo do Veículo (Coluna G - Célula \`G2\`):
\`\`\`excel
=ÍNDICE(Fonte!F:F;CORRESP(A2;Fonte!B:B;0))
\`\`\`

### 🔹 Tipo de Falha - Recorrência (Coluna H - Célula \`H2\`):
> *Muda apenas o nome da aba antiga para a última aba existente na planilha (Ex: \`Falhas 09.07\`)*
\`\`\`excel
=SE(ÉNÚM(CORRESP(A2;'Falhas 09.07'!A:A;0));"FALHA RECORRENTE";"NOVA FALHA")
\`\`\`

### 🔹 Status (Coluna I):
Preencha a coluna Status de todas as linhas como: **\`Email enviado\`**.

### 🔹 Tratativa (Coluna J - Célula \`J2\`):
> *Recupera a última tratativa se for falha recorrente ou define como "Pendente de Contato" se for nova*
\`\`\`excel
=SEERRO(ÍNDICE('Falhas 09.07'!J:J;CORRESP(A2;'Falhas 09.07'!A:A;0));"Pendente de Contato")
\`\`\`

### 🔹 O.S. (Coluna K - Célula \`K2\`):
\`\`\`excel
=SEERRO(ÍNDICE('Falhas 09.07'!K:K;CORRESP(A2;'Falhas 09.07'!A:A;0));"")
\`\`\`

### 🔹 Data de Contato (Coluna L - Célula \`L2\`):
\`\`\`excel
=SEERRO(ÍNDICE('Falhas 09.07'!L:L;CORRESP(A2;'Falhas 09.07'!A:A;0));"")
\`\`\`

---

## 🔒 6. Trava de Valores (CTRL + C / CTRL + SHIFT + V) e Ordenação

Após o preenchimento de toda a tabela por fórmula:

1. Selecione **toda a tabela**.
2. Digite **\`CTRL + C\`** para copiar.
3. Em seguida, digite **\`CTRL + SHIFT + V\`** (para colar apenas os valores estáticos e remover as fórmulas).
4. Ordene a coluna **Unidade (Coluna B)** de **A a Z** para manter tudo organizado por filial/regional.

---

## ✉️ 7. Disparo Automático de E-mails via Google Apps Script

Com a planilha preenchida e organizada:

1. Vá para a aba **\`Dinâmica\`** (esta aba contém apenas 3 colunas: \`Unidade\` | \`Placa\` | \`Tratativa\`).
2. Copie os dados das colunas \`Unidade\`, \`Placa\` e \`Tratativa\` da aba do dia recém-tratada e cole na aba **\`Dinâmica\`**.
3. Na barra de navegação superior, clique em **Extensões** > **Apps Script**.
4. Na tela do editor que se abrir, clique no botão **"Executar"**.
5. Todos os e-mails serão disparados automaticamente com base na aba \`Pontos focais\`.

![Disparo Automático de E-mails via Google Apps Script - Visualização Planilha](/images/falhas/picture4_falhas.png)

![Disparo Automático de E-mails via Google Apps Script - Execução no Apps Script](/images/falhas/picture5_falhas.png)

---

## 📱 8. Segunda Tratativa via SmartZap

Caso a falha persista ou seja classificada como **FALHA RECORRENTE**:

1. Acesse a aba **\`Contato responsáveis\`**.
2. Identifique o número de telefone e o nome do responsável pela unidade.
3. Realize o contato via **SmartZap** para realizar a cobrança direta e agendamento de suporte técnico.
4. Atualize os campos de **O.S.** e **Data de Contato** na aba de falhas do dia para histórico.
`,
      videoUrl: '',
      fileDownloadUrl: 'https://docs.google.com/spreadsheets/d/1_HFVfC1TMKLEc0TbsPTa6GnMqhNqcP_y8wWuVNKnKh4/edit?usp=sharing'
    }
  });

  await prisma.article.create({
    data: {
      title: 'Manual de Orientações Gerais',
      slug: 'manual-de-orientacoes-gerais',
      categoryId: catSistemas.id,
      contentMarkdown: `# Manual de Orientações Gerais

Manual de diretrizes gerais da operação Solar Coca-Cola, abrangendo visão geral da frota, funcionamento do sistema de bloqueio, equipamentos, telemetria, comunicação e processos administrativos.

---

## 📌 Sumário
1. [Visão Geral da Operação](#1-visão-geral-da-operação)
2. [Equipamentos Utilizados](#2-equipamentos-utilizados)
3. [Funcionamento do Sistema de Bloqueio](#3-funcionamento-do-sistema-de-bloqueio)
4. [Operação de Vídeo Telemetria](#4-operação-de-vídeo-telemetria)
5. [Processos Administrativos](#5-processos-administrativos)
6. [Comunicação Oficial](#6-comunicação-oficial)
7. [Procedimento para Desbloqueio de Veículos](#7-procedimento-para-desbloqueio-de-veículos)
8. [Tratativa de Falhas](#8-tratativa-de-falhas)
9. [Reunião Semanal da Operação](#9-reunião-semanal-da-operação)

---

## 1. Visão Geral da Operação

A operação da **Solar Coca-Cola** está distribuída pelos estados das regiões **Norte** e **Nordeste**, além do estado do **Mato Grosso**.

A frota é dividida em duas categorias principais:
* 🚚 **Caminhões (Pesados)**
* 🏍️ **Motos (Leves)**

Embora utilizem equipamentos diferentes, ambas seguem o mesmo princípio de funcionamento para liberação da partida do veículo:

> Todos os veículos possuem sistema de bloqueio de ignição vinculado à autorização do cartão RFID.

### 🔄 Fluxo de Funcionamento
1. O cartão RFID é aproximado do leitor.
2. O equipamento valida a autorização.
3. **Se autorizado:** O veículo é liberado para partida.
4. **Caso contrário:** O veículo permanecerá bloqueado.

---

## 2. Equipamentos Utilizados

| Categoria | Equipamento Padrão | Observações |
| :--- | :---: | :--- |
| **Caminhões (Pesados)** | **VIRLOC6** | Equipamento padrão para frota pesada com comunicação CAN |
| **Motos (Leves)** | **ST4305** | Equipamento padrão para frota leve |

### 🛑 Exceções
* **Vans (Print Houses):** Utilizam o **ST4305**.
* **Caminhões da unidade de Cajazeiras:** Também utilizam o **ST4305**.
  * 💡 *Motivo:* Veículos antigos que não necessitam de comunicação via Rede CAN.

---

## 3. Funcionamento do Sistema de Bloqueio

Este é o ponto mais importante da operação. Existem dois modelos de funcionamento:

### 3.1. Modelo Padrão (Demais unidades)
O bloqueio é realizado pelo próprio equipamento.

* O número do cartão RFID fica gravado na memória do equipamento.
* Após atualização do perfil, qualquer cartão autorizado realiza normalmente o desbloqueio.

\`\`\`
Cartão RFID ➔ Equipamento ➔ Validação ➔ Veículo Liberado
\`\`\`

---

### 3.2. Modelo por Identificador (Unidades Específicas)
Utilizado exclusivamente nas unidades de:
* **Natal**
* **Mossoró**
* **Campina Grande**
* **João Pessoa**

Nessas quatro unidades, o bloqueio ocorre **através do Identificador**. Isso significa que:
* A senha fica gravada diretamente no cartão.
* O cartão precisa ser configurado previamente na bancada (CRPV).

\`\`\`
Bancada (CRPV) ➔ Configuração do Cartão ➔ Envio para a Unidade ➔ Veículo
\`\`\`

> ⚠️ **ATENÇÃO CRÍTICA:**  
> Todo cartão destinado a essas quatro unidades (**Natal, Mossoró, Campina Grande e João Pessoa**) deve obrigatoriamente ser configurado na bancada antes do envio. **Caso contrário, o cartão não funcionará.**

---

## 4. Operação de Vídeo Telemetria

Aproximadamente **30% da frota de caminhões** possui sistema de vídeo monitoramento instalado.

* 📹 **Equipamento padrão:** **Hikvision G40**
* 📹 **Equipamentos antigos em operação:** **Jimi JC450 Standard** (Presente nas unidades: *Mossoró, Natal, João Pessoa e Campina Grande*)

> 🔄 **Padronização:** Sempre que houver manutenção nesses veículos com equipamento antigo (Jimi JC450), **substituir pelo Hikvision G40**, seguindo a padronização oficial da operação.

---

## 5. Processos Administrativos

### 👤 Analista Responsável
A responsável corporativa pela gestão da frota é:
* **Maria Iris (Corporativo Solar)**
* 🌟 *Todas as solicitações realizadas por ela possuem prioridade máxima.*

### 📋 Solicitações Administrativas
Todos os processos devem ser realizados obrigatoriamente mediante abertura de **SD (Solicitação de Demanda)**.

Exemplos de solicitações via SD:
* Cadastro de condutor
* Atualização cadastral
* Transferência de veículo/condutor
* Alteração de equipe
* Demais solicitações administrativas

> ❌ **IMPORTANTE - REGRA DE SEGURANÇA:**  
> Caso algum Supervisor solicite essas alterações via SmartZap: **NÃO REALIZAR.**  
> Orientar educadamente o solicitante a abrir uma **SD** oficial.

---

## 6. Comunicação Oficial

Os canais oficiais de comunicação da operação são:
1. ✉️ **E-mail**
2. 📄 **CCR**
3. 💬 **SmartZap** *(Exclusivamente para suporte operacional)*

### 📲 Uso Permitido do SmartZap:
* Dúvidas sobre o sistema
* Desbloqueios operacionais
* Tratativas de falhas
* Suporte operacional imediato

### 🚫 Proibido Usar o SmartZap Para:
* Cadastro de condutores
* Transferências de frota
* Alterações administrativas gerais
*(Estes itens devem ser solicitados estritamente por **SD** ou **E-mail**)*

> ⚠️ **Atenção:** Toda solicitação deve ser formalizada. Acompanhar diariamente os canais oficiais (**E-mails, CCRs e SmartZap**) e responder sempre no menor prazo possível.

---

## 7. Procedimento para Desbloqueio de Veículos

Este procedimento deve ser seguido rigorosamente por todos os operadores.

> 🛑 **REGRA PRINCIPAL:**  
> O condutor **NÃO** possui autorização para solicitar desbloqueio diretamente. A solicitação deve partir obrigatoriamente do **Supervisor responsável**.

### 📱 Fluxo caso o condutor entre em contato:
1. **Não realizar o desbloqueio** de imediato.
2. Solicitar ao condutor que peça para o **Supervisor entrar em contato**.
3. **Após autorização do Supervisor**, realizar o procedimento de desbloqueio.

*Esse processo garante a segurança total e a rastreabilidade da operação.*

---

## 8. Tratativa de Falhas

* 📊 A planilha de tratativa de falhas é atualizada **todas as quartas-feiras (no período da tarde)**.
* 📧 Caso **Maria Iris** solicite a planilha fora do prazo ou em outro momento, enviar normalmente por e-mail.

---

## 9. Reunião Semanal da Operação

Ocorre semanalmente entre as equipes da **Solar** e da **CORPVS**.

* 📅 **Dias habituais:** Segunda-feira ou Quinta-feira.

### 📋 Assuntos Tratados:
* Pendências operacionais
* Chamados abertos
* Problemas ocorridos na semana
* Solicitações das unidades
* Alinhamentos gerais

> 👥 **Obrigatório:** Sempre deve haver **pelo menos um integrante da equipe de suporte presente** na reunião.
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  await prisma.article.create({
    data: {
      title: 'Fluxograma bloqueio de caminhão',
      slug: 'fluxograma-bloqueio-de-caminhao',
      categoryId: catSistemas.id,
      contentMarkdown: `# GUIA OPERACIONAL E FLUXOGRAMA DE DECISÃO

## Atendimento de Ocorrências: Caminhão Não Liga

---

## 1. Objetivo do Fluxo

Este material tem como objetivo orientar a equipe de atendimento na análise de ocorrências em que o cliente ou condutor informa:

> **“Meu caminhão não está ligando.”**

O fluxo foi desenvolvido para auxiliar na identificação inicial da causa do problema, permitindo diferenciar possíveis falhas relacionadas a:

* Cartão RFID ou crachá;
* Identificador;
* Sistema de bloqueio;
* Configuração do equipamento;
* Comunicação com o veículo;
* Possíveis falhas mecânicas ou elétricas não relacionadas ao rastreador.

### Objetivos principais

Durante o atendimento, o colaborador deverá:

1. Coletar as evidências iniciais obrigatórias;
2. Identificar a placa e a unidade do veículo;
3. Identificar o comportamento do sistema de bloqueio;
4. Verificar a resposta do identificador ao cartão;
5. Validar o cartão ou crachá utilizado;
6. Identificar o modelo e a unidade de operação;
7. Seguir o fluxo de decisão adequado para cada cenário;
8. Solicitar apoio técnico sempre que necessário.

---

# 2. Coleta Inicial Obrigatória

## REGRA DE ATENDIMENTO

Antes de realizar qualquer conclusão sobre a causa do problema, é **obrigatório solicitar a placa do caminhão e um vídeo completo da ocorrência**.

O vídeo é fundamental para identificar o comportamento do sistema e evitar diagnósticos equivocados.

---

## O vídeo deve mostrar obrigatoriamente:

### 1. Painel do veículo

O painel deve ser mostrado de forma clara, permitindo verificar:

* Se está aceso ou apagado;
* Se apresenta alguma mensagem de erro;
* Se existem luzes de advertência;
* Se o comportamento muda após a autenticação do cartão.

### 2. Identificador RFID

O vídeo deve mostrar:

* A localização do identificador;
* A aproximação do cartão ou crachá;
* A resposta sonora do identificador.

### 3. Tentativa de partida

O condutor deve demonstrar:

* A posição da chave;
* O comportamento do painel;
* A tentativa de partida do caminhão.

### 4. Rotograma (caixa de voz)

Sempre que possível, o vídeo deve registrar o comportamento da Rotograma.

Em uma operação normal, após a autenticação e o desbloqueio, a Rotograma poderá emitir a mensagem de início de viagem, como:

> **“Boa viagem. Acenda os faróis, use o cinto de segurança e dirija com atenção.”**

---

# 3. Funcionamento Normal do Sistema de Bloqueio

Na maioria dos caminhões, o identificador RFID está localizado próximo à ignição, geralmente no lado direito do painel.

O modelo mais comum é um identificador TTL, que integra o conjunto de equipamentos responsável pela autenticação do cartão e pelos alertas sonoros da operação.

---

## Fluxo normal de desbloqueio

### Etapa 1 — Ignição

O condutor coloca o veículo em posição de meia-chave.

Em grande parte dos veículos, o painel pode apagar ou alterar seu comportamento enquanto o bloqueio está ativo.

> **Observação:** o comportamento do painel pode variar conforme o modelo do caminhão e o tipo de instalação realizada. Portanto, o painel permanecer aceso não significa, isoladamente, que o veículo esteja desbloqueado.

---

### Etapa 2 — Identificador

O identificador inicia um alerta sonoro, normalmente por meio de bipes.

---

### Etapa 3 — Aproximação do cartão

O condutor aproxima o cartão RFID ou crachá do identificador.

---

### Etapa 4 — Confirmação

Após a leitura correta do cartão, o identificador emite um sinal sonoro de confirmação.

Em seguida:

* O alerta sonoro do identificador é interrompido;
* A Rotograma pode emitir a mensagem de início de viagem;
* O veículo é liberado para a partida.

---

## Fluxo resumido

**Meia-chave → Identificador emite alerta → Cartão é aproximado → Bipe de confirmação → Rotograma confirma → Veículo é liberado**

Este é o comportamento esperado quando o sistema de autenticação e bloqueio está funcionando normalmente.

---

# 4. FLUXO DE DECISÃO

Após receber o vídeo e as informações iniciais, identifique qual dos cenários abaixo corresponde ao comportamento apresentado.

---

# CENÁRIO A

## O identificador continua emitindo bipes após a aproximação do cartão

### Possível causa

O cartão ou crachá não foi lido pelo identificador.

Neste cenário, as principais possibilidades são:

* Cartão danificado;
* Crachá com problema;
* Cartão incompatível;
* Identificador com falha;
* Cartão sendo aproximado no local incorreto.

---

## Procedimento de atendimento

### 1. Verificar a aproximação

Confirmar se o condutor está aproximando corretamente o cartão do identificador.

### 2. Verificar a integridade do cartão

Solicitar que o condutor verifique se o cartão apresenta:

* Quebras;
* Trincas;
* Desgaste excessivo;
* Danos físicos.

### 3. Realizar teste com outro cartão ou crachá

Sempre solicitar, quando disponível, um segundo cartão ou crachá.

O objetivo é identificar se:

* Apenas um cartão não funciona; ou
* Nenhum cartão é reconhecido pelo identificador.

---

## Quando considerar possível falha no identificador

Se o vídeo demonstrar que:

* O cartão está sendo aproximado corretamente;
* O identificador está no local adequado;
* O procedimento está sendo realizado corretamente;
* O identificador continua emitindo bipes sem reconhecer o cartão;

deve-se considerar uma possível falha no identificador.

### Próximas ações

1. Verificar a possibilidade de manutenção no veículo;
2. Avaliar a necessidade de desbloqueio prévio;
3. Priorizar a tratativa para evitar impacto na operação do cliente;
4. Solicitar apoio técnico quando necessário.

---

# CENÁRIO B

## O identificador emite um som grave, semelhante a uma negativa

Este cenário ocorre exclusivamente nas unidades de:

* Mossoró;
* Natal;
* Campina Grande;
* João Pessoa.

Nessas unidades, o sistema de desbloqueio dos caminhões utiliza uma arquitetura diferente.

O cartão precisa possuir previamente a senha de liberação configurada em seu chip.

---

## O que significa o som de negativa?

Quando um cartão sem a senha previamente configurada é aproximado do identificador, o sistema poderá emitir um som mais grave, indicando que o cartão não possui a credencial necessária para liberar o veículo.

---

## Procedimento de atendimento

1. Confirmar a unidade do veículo;
2. Verificar qual cartão ou crachá está sendo utilizado;
3. Entender por que o condutor está utilizando aquele cartão;
4. Verificar se existe outro cartão disponível;
5. Testar outro cartão previamente configurado.

---

## Caso não exista outro cartão disponível

A solução poderá exigir:

* Envio de um cartão corretamente configurado;
* Envio de comando de desbloqueio;
* Atendimento técnico presencial.

### Atenção

Dependendo da situação, o envio de comando remoto pode apresentar demora ou não ser suficiente para resolver a ocorrência.

Quando houver risco de impacto na operação, deve-se avaliar a possibilidade de **priorizar o atendimento técnico presencial**.

---

# CENÁRIO C

## O identificador emite o bipe de confirmação, mas o caminhão continua bloqueado

Neste cenário, o cartão aparentemente foi reconhecido, porém o veículo não é liberado.

O procedimento será diferente conforme a unidade do veículo.

---

# CENÁRIO C1

## Unidades com bloqueio pelo Identificador

Aplica-se às unidades:

* Natal;
* Mossoró;
* Campina Grande;
* João Pessoa.

---

## Comportamento

O identificador:

* Emite o alerta sonoro;
* Recebe o cartão;
* Emite o bipe de confirmação;
* Porém, o veículo continua bloqueado.

---

## Procedimento

### 1. Realizar reset elétrico do veículo

Solicitar ao condutor:

1. Desligar a chave geral do caminhão;
2. Aguardar aproximadamente 5 minutos;
3. Religar a chave geral;
4. Realizar novamente o procedimento de autenticação;
5. Tentar dar partida no veículo.

---

### 2. Caso o problema persista

Pode-se avaliar o envio de um comando de desbloqueio.

> **Observação:** nesses veículos, o comando remoto pode apresentar baixa efetividade, dependendo da condição do equipamento e da comunicação com o veículo.

---

### 3. Próxima ação recomendada

Caso o veículo permaneça bloqueado:

* Agendar manutenção;
* Avaliar a retirada prévia do bloqueio;
* Solicitar atendimento técnico com prioridade.

O objetivo é reduzir o impacto na operação do cliente.

---

# CENÁRIO C2

## Unidades com bloqueio pelo módulo do rastreador

Aplica-se às demais unidades que utilizam o modelo padrão de autenticação.

Nesse modelo, o número do cartão precisa estar previamente cadastrado na memória do equipamento.

---

## Possível causa

O cartão pode ter sido reconhecido pelo identificador, mas não estar cadastrado na memória do rastreador.

Nesse caso:

> **O identificador reconhece o cartão, mas o equipamento não possui autorização para liberar o veículo.**

---

# 5. Verificação da Autenticação do Cartão

Os equipamentos possuem uma configuração operacional chamada **SCRIPT**.

O SCRIPT contém os parâmetros utilizados pelo equipamento, como:

* Aceleração;
* Curvas;
* Tempo de tolerância com a ignição ligada;
* Parâmetros operacionais;
* Autenticação de cartões.

---

## Localização dos arquivos

Os arquivos de configuração da operação estão disponíveis no Drive, no caminho:

**Coca-Cola Geral → BIBLIOTECA SOLAR**

Cada unidade possui seu respectivo SCRIPT.

---

# 6. Como verificar se o cartão está cadastrado

Solicitar a numeração do cartão ou crachá utilizado pelo condutor.

No SCRIPT correspondente à unidade:

1. Abrir o arquivo;
2. Utilizar **Ctrl + F**;
3. Pesquisar a numeração do cartão;
4. Verificar se o número está presente na lista de autenticação.

---

## Cartão branco disponibilizado pela CORPVS

Caso seja utilizado o cartão branco da CORPVS:

1. Localizar a numeração hexadecimal impressa no cartão;
2. Converter o número hexadecimal para decimal;
3. Utilizar o número decimal na configuração do SCRIPT.

---

## Crachá do condutor

Quando se tratar de um crachá cuja numeração já esteja em formato decimal:

* Utilizar diretamente a numeração informada;
* Não realizar nova conversão.

---

# 7. Inclusão do cartão no SCRIPT

Os cartões são inseridos na memória do equipamento por meio da sequência:

**VSRT1,NÚMERO DO CARTÃO**

**VSRT2,NÚMERO DO CARTÃO**

**VSRT3,NÚMERO DO CARTÃO**

E assim sucessivamente.

---

## Estrutura do comando

**VSRT + posição + número do cartão**

Exemplo:

**VSRT25,123456789**

Neste exemplo:

* **25** = posição lógica do cartão;
* **123456789** = número decimal do cartão.

---

## Regras de posicionamento

A sequência de posições é lógica e crescente:

**1 → 2 → 3 → 4 → ... → 999**

---

# 8. Procedimento para inclusão ou atualização do cartão

## Se o cartão já estiver cadastrado

Caso o número seja encontrado no SCRIPT:

1. Identificar a posição em que o cartão está cadastrado;
2. Utilizar novamente o comando correspondente àquela posição;
3. Enviar o comando por meio do Vanguarda, utilizando o campo de comando livre.

---

## Se o cartão não estiver cadastrado

1. Identificar a última posição utilizada;
2. Adicionar o cartão na próxima posição disponível;
3. Atualizar o arquivo do SCRIPT;
4. Salvar a versão atualizada no Drive da operação;
5. Enviar o comando correspondente pelo Vanguarda, utilizando o campo de comando livre.

---

## Caso o problema persista

Se, mesmo após a atualização da autenticação, o veículo continuar bloqueado:

> **Solicitar atendimento técnico para diagnóstico e desbloqueio presencial.**

---

# 9. IMPORTANTE: LIMITAÇÕES DO RASTREADOR

O rastreador **não possui função de interferência mecânica no veículo**.

O equipamento:

* Coleta dados da rede CAN, quando aplicável;
* Realiza o posicionamento do veículo;
* Recebe e transmite informações;
* Pode estar conectado à bateria;
* Pode participar do sistema de bloqueio conforme a arquitetura da instalação.

Entretanto:

> **O rastreador não deve ser considerado responsável por alterações mecânicas, força de tração ou funcionamento físico do motor.**

Portanto, o equipamento não deve:

* Alterar componentes mecânicos;
* Aplicar força física ao veículo;
* Interferir diretamente na tração;
* Causar falhas mecânicas por ação física.

Caso o veículo apresente um comportamento mecânico, elétrico ou de funcionamento que não esteja relacionado ao sistema de autenticação e bloqueio, a ocorrência deverá ser investigada separadamente.

---

# 10. FLUXO RESUMIDO DE DECISÃO

## Caminhão não liga

### 1. Solicitar placa e vídeo completo

↓

### 2. O identificador continua bipando após passar o cartão?

**SIM**
→ Verificar cartão
→ Testar outro cartão/crachá
→ Se nenhum cartão for reconhecido, considerar possível falha no identificador
→ Avaliar manutenção ou desbloqueio prévio

**NÃO**
↓

### 3. O identificador emite som grave de negativa?

**SIM**
→ Confirmar se o veículo pertence a Natal, Mossoró, Campina Grande ou João Pessoa
→ Verificar se o cartão possui senha previamente configurada
→ Testar outro cartão autorizado
→ Se necessário, solicitar cartão correto ou atendimento técnico

**NÃO**
↓

### 4. O identificador emite bipe de confirmação, mas o veículo continua bloqueado?

**SIM**
↓

### 5. Qual é o modelo de bloqueio?

#### Bloqueio pelo Identificador

Natal, Mossoró, Campina Grande e João Pessoa:

→ Desligar chave geral por 5 minutos
→ Religar
→ Testar novamente
→ Avaliar comando de desbloqueio
→ Persistindo a falha: solicitar atendimento técnico

#### Bloqueio pelo módulo

Demais unidades:

→ Solicitar numeração do cartão/crachá
→ Verificar o cartão no SCRIPT
→ Se cadastrado: reenviar comando na posição correspondente
→ Se não cadastrado: adicionar na próxima posição disponível
→ Atualizar o SCRIPT
→ Enviar comando pelo Vanguarda
→ Persistindo a falha: solicitar atendimento técnico

---

# 11. RECOMENDAÇÃO FINAL

Este guia tem como objetivo fornecer uma orientação inicial para a identificação de possíveis causas relacionadas ao bloqueio de caminhões da operação Solar Coca-Cola.

O diagnóstico deve sempre ser baseado em evidências.

Por isso, sempre que houver dúvida:

1. Solicite um vídeo completo da ocorrência;
2. Verifique a placa e a unidade do veículo;
3. Identifique o comportamento do identificador;
4. Confirme o cartão ou crachá utilizado;
5. Consulte o fluxo correspondente;
6. Solicite apoio dos técnicos sempre que necessário.

Em caso de situações não previstas neste material, o vídeo da ocorrência poderá ser encaminhado ao grupo da Frota para análise da equipe técnica e definição da tratativa mais adequada.

> **Na dúvida, não conclua apenas com base no relato do condutor. Solicite evidências, analise o comportamento do sistema e valide a ocorrência com a equipe técnica quando necessário.**
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  await prisma.article.create({
    data: {
      title: 'Eventos de telemetria',
      slug: 'eventos-de-telemetria',
      categoryId: catSistemas.id,
      contentMarkdown: `# Eventos de Telemetria

Guia completo sobre a pontuação, critérios de ativação, situações comuns, impactos e recomendações de prevenção para os eventos de telemetria da frota Solar Coca-Cola.

---

## 📌 Visão Geral

Os **Eventos de Telemetria** são parâmetros essenciais monitorados pela plataforma para mensurar o desempenho, a segurança dos motoristas e a preservação dos veículos e cargas da frota. Eles dividem-se em três categorias principais:

1. 🛡️ **Segurança Viária**
2. ⚡ **Performance Operacional**
3. 🛠️ **Manutenção Preventiva**

---

## 1. 🛡️ Segurança Viária

Os eventos de **Segurança Viária** são cruciais para a proteção dos motoristas, da carga e de terceiros. Eles indicam comportamentos de risco que podem levar a acidentes ou infrações.

### 1.1. Excesso de Velocidade da Via (>10% por +10s)

* 🎯 **Pontuação:** \`50 PT\` por evento
* ⚙️ **Ativação:** Registrado quando o veículo ultrapassa o limite de velocidade da via em mais de 10% e mantém essa velocidade por mais de 10 segundos.
* 🚦 **Situações Comuns:** Ocorre frequentemente em avenidas e rodovias, quando o motorista tenta recuperar tempo perdido ou simplesmente não está atento aos limites.
* ⚠️ **Impactos:** Representa um risco significativo à segurança, aumentando a probabilidade de acidentes e a chance de multas de trânsito, além de elevar o consumo de combustível e o desgaste dos componentes do veículo.
* 💡 **O que evitar:** O motorista deve sempre respeitar os limites de velocidade estabelecidos para cada via, ajustando a condução às condições de tráfego e climáticas. A pressa e a desatenção são os principais fatores a serem combatidos.

---

### 1.2. Aceleração Brusca

* 🎯 **Pontuação:** \`50 PT\` por evento
* ⚙️ **Ativação:** Detectada quando há um ganho de mais de 15 km/h em apenas 1 segundo.
* 🚦 **Situações Comuns:** Geralmente ocorre ao arrancar fortemente em cruzamentos, semáforos ou ao tentar ultrapassagens rápidas.
* ⚠️ **Impactos:** Pode causar instabilidade da carga, especialmente em veículos de transporte, aumentando o risco de danos à mercadoria. Além disso, resulta em maior consumo de combustível, desgaste prematuro de pneus e componentes da transmissão, e desconforto para o motorista e passageiros.
* 💡 **O que evitar:** O motorista deve adotar uma aceleração suave e progressiva, antecipando as condições do tráfego e evitando arranques desnecessariamente fortes. Uma condução mais fluida contribui para a segurança e a economia.

---

### 1.3. Curva Brusca (Aceleração Brusca em Curva)

* 🎯 **Pontuação:** \`100 PT\` por evento
* ⚙️ **Ativação:** Ocasionada quando o veículo realiza uma curva gerando força G lateral acima de 350 miliG.
* 🚦 **Situações Comuns:** Comum em curvas fechadas, rotatórias ou ao entrar e sair de vias, especialmente quando o motorista não reduz a velocidade adequadamente antes de iniciar a manobra.
* ⚠️ **Impactos:** Em caminhões, como o VW 17.190 com carga entre 5 e 10 toneladas (ex: grades de garrafas com líquidos), pode causar deslocamento interno da carga, aumentando drasticamente o risco de tombamento do veículo ou quebra da mercadoria. Compromete a estabilidade do veículo e a segurança da operação.
* 💡 **O que evitar:** O motorista deve ajustar a velocidade antes de entrar na curva, realizando a manobra de forma suave e controlada. Velocidades seguras em curvas devem ser ajustadas conforme o raio da curva; no geral, curvas urbanas não devem ser feitas acima de 25–35 km/h quando o veículo está com carga. A antecipação e a redução gradual da velocidade são essenciais.

---

## 2. ⚡ Performance Operacional

Os eventos de **Performance Operacional** refletem a eficiência e a economia na condução, impactando diretamente os custos e a sustentabilidade da frota.

### 2.1. Faixa Amarela de RPM (> 15s)

* 🎯 **Pontuação:** \`15 PT\` por evento
* ⚙️ **Ativação:** Registrado quando o veículo permanece acima de 2.000 RPM por mais de 15 segundos com o acelerador acionado.
* 🚦 **Situações Comuns:** Indica uso excessivo do motor fora das condições de freio motor, geralmente em subidas íngremes, ao tentar manter uma alta velocidade em marchas inadequadas ou ao acelerar desnecessariamente.
* ⚠️ **Impactos:**
  * ⛽ **Maior consumo de combustível:** O motor opera em uma faixa de rotação menos eficiente, queimando mais combustível.
  * 🌡️ **Aquecimento excessivo:** A alta rotação prolongada pode levar ao superaquecimento do motor.
  * ⚙️ **Desgaste acelerado de válvulas e pistões:** Componentes internos do motor sofrem maior estresse e desgaste.
  * 🔊 **Ruído e vibração aumentados:** Afeta o conforto do motorista e pode indicar sobrecarga do motor.
* 💡 **O que evitar:** O motorista deve buscar manter o veículo na faixa de RPM ideal, utilizando as marchas corretas para cada situação e evitando acelerações desnecessárias.

---

### 2.2. Faixa Vermelha de RPM

* 🎯 **Pontuação:** \`30 PT\` por evento
* ⚙️ **Ativação:** Disparado imediatamente ao ultrapassar 2.700 RPM, sem tempo mínimo de permanência. É uma zona crítica para o motor.
* 🚦 **Situações Comuns:** Ocorre quando o motorista força o motor ao máximo, seja por aceleração excessiva, redução de marcha inadequada em alta velocidade ou descidas sem o uso correto do freio motor.
* ⚠️ **Impactos:** Cada segundo nessa faixa aumenta drasticamente o risco de:
  * 🌡️ **Superaquecimento:** Danos severos ao motor devido ao calor excessivo.
  * 💥 **Quebra de cabeçote:** Componente vital do motor pode ser danificado irreversivelmente.
  * 🔧 **Desgaste acelerado de juntas:** Comprometimento da vedação e integridade do motor.
  * 🛑 **Falha total do motor:** Pode levar à parada completa do veículo e necessidade de reparos caros.
* 💡 **O que evitar:** Essa rotação deve ser evitada completamente em operações normais. O motorista deve ter total controle sobre as marchas e a aceleração para nunca atingir a faixa vermelha de RPM. É um indicativo de condução extremamente agressiva e prejudicial ao veículo.

---

### 2.3. Parado com Ignição Ligada (> 5min)

* 🎯 **Pontuação:** \`20 PT\` por evento
* ⚙️ **Ativação:** Registrado quando o caminhão permanece parado com o motor ligado por mais de 5 minutos.
* 🚦 **Situações Comuns:** É comum acontecer durante esperas em pontos de venda (PDVs), centros de distribuição, carregamentos ou descarregamentos.
* ⚠️ **Impactos:**
  * 💸 **Consumo de combustível desnecessário:** O consumo médio em marcha lenta é de aproximadamente 1,5 litro de diesel por hora. Com o diesel a R$ 6,00, isso representa um custo de R$ 9,00 por hora parada.
  * 💨 **Emissão desnecessária de poluentes:** Contribui para a poluição do ar e o impacto ambiental.
  * 🌡️ **Desgaste do sistema de arrefecimento:** O motor em marcha lenta pode não ter ventilação adequada, aumentando o desgaste.
  * 🛢️ **Acúmulo de carbono no motor:** Prejudica a eficiência e a vida útil do motor.
* 💡 **O que evitar:** O motorista deve desligar o motor sempre que o veículo for permanecer parado por mais de 5 minutos. Planejar as paradas e otimizar os tempos de espera são cruciais para a economia de combustível e a redução de custos operacionais.

---

## 3. 🛠️ Manutenção Preventiva

Os eventos de **Manutenção Preventiva** destacam a importância da inspeção e do cuidado contínuo com o veículo, prevenindo falhas e garantindo a segurança e a disponibilidade da frota.

### 3.1. Checklist não Realizado

* 🎯 **Pontuação:** \`100 PT\` por evento
* ⚙️ **Ativação:** Quando o condutor inicia a operação sem preencher o checklist de segurança e manutenção.
* 🚦 **Situações Comuns:** Ocorre por desatenção, pressa ou negligência do motorista em seguir os procedimentos operacionais padrão.
* ⚠️ **Impactos:** Oculta problemas potenciais em componentes críticos como pneus, freios, luzes, níveis de fluidos, entre outros. Isso compromete seriamente a segurança da viagem, da carga e do próprio motorista, além de poder gerar custos de manutenção corretiva muito mais elevados no futuro.
* 💡 **O que evitar:** O motorista deve ser rigoroso no preenchimento do checklist antes de cada jornada via APP. É uma etapa fundamental para identificar e corrigir pequenos problemas antes que se tornem grandes falhas, garantindo a segurança e a conformidade do veículo.

---

## 📊 Resumo dos Eventos de Telemetria

| Categoria | Evento | Condição / Ativação | Pontuação |
| :--- | :--- | :--- | :---: |
| 🛡️ **Segurança Viária** | Excesso de Velocidade da Via | >10% por +10s | **50 PT** |
| 🛡️ **Segurança Viária** | Aceleração Brusca | >15 km/h em 1s | **50 PT** |
| 🛡️ **Segurança Viária** | Curva Brusca | Força G lateral > 350 miliG | **100 PT** |
| ⚡ **Performance Operacional** | Faixa Amarela de RPM | >2.000 RPM por >15s com acelerador | **15 PT** |
| ⚡ **Performance Operacional** | Faixa Vermelha de RPM | >2.700 RPM (Imediato) | **30 PT** |
| ⚡ **Performance Operacional** | Parado com Ignição Ligada | Parado por > 5 min | **20 PT** |
| 🛠️ **Manutenção Preventiva** | Checklist não Realizado | Iniciar jornada sem preencher no APP | **100 PT** |
`,
      videoUrl: '',
      fileDownloadUrl: ''
    }
  });

  console.log('✓ Artigos de exemplo semeados.');
  } else {
    console.log('✓ Artigos já existem no banco. Pulando criação de artigos padrão.');
  }

  await prisma.article.upsert({
    where: { slug: 'como-utilizar-o-painel-de-telemetria' },
    update: {
      title: 'Como utilizar o Painel de Telemetria',
      categoryId: catSistemas.id,
      contentMarkdown: `# Como utilizar o Painel de Telemetria

Guia completo sobre a navegação, filtros de busca, interpretação dos pilares de condução, consulta de notas e auditoria de infrações no Painel de Telemetria da Solar Coca-Cola.

---

## 📌 1. Visão Geral e Acesso ao Painel

O **Painel de Telemetria** é o coração da operação para análise dos eventos e infrações dos condutores da Solar Coca-Cola. É nele que fica concentrada a performance dos condutores e o acompanhamento de como estão conduzindo os veículos da frota.

### 🌐 Como acessar:
Na barra lateral (*sidebar*) da plataforma, clique no ícone da Solar e selecione **Painel de Telemetria**.

![Acesso ao Painel de Telemetria via Sidebar](/images/painel_telemetria/picture1_paineltelemetria.png)

---

## 🔍 2. Filtros de Pesquisa e Regras de Equipamentos

Para realizar uma consulta no painel, preencha os campos de filtro conforme as orientações abaixo:

| Campo | Preenchimento | Regra / Comportamento no Sistema |
| :--- | :--- | :--- |
| **Cliente** | **Obrigatório** | Selecionar a unidade operacional que deseja verificar. |
| **Equipe** | *Opcional* | • **Se preenchido:** Exibe os condutores e a média específica daquela equipe.<br>• **Se em branco:** Traz os dados de todas as equipes e exibe a média geral da unidade. |
| **Data Inicial e Final** | **Obrigatório** | Define o período específico para extração da análise. |
| **Tipo de Veículos** | Selection Box | Categorias disponíveis: **Pesados** (Caminhões) e **Motos**. |

### 🛠️ Regra de Interpretação por Equipamento:
> ⚠️ **ATENÇÃO AO DISPOSITIVO INSTALADO:**  
> O fator determinante para o sistema interpretar um veículo como **Pesado** ou **Moto** é o modelo do equipamento instalado:
> * Dispositivos **ST4305** ➔ Interpretados pelo sistema como **Moto**.
> * Dispositivos **VIRLOC6** ➔ Interpretados pelo sistema como **Caminhão (Pesado)**.
> 
> 💡 **Resolução de Inconsistências:** Como alguns caminhões possuem o rastreador ST4305 instalado (ex: frota antiga), eles serão interpretados no sistema como "Moto". Caso encontre divergência na extração do relatório, verifique qual equipamento está instalado no veículo antes de visualizar os dados.

Após preencher todos os campos necessários, clique no botão **Pesquisar**.

---

## 📊 3. Pilares de Condução e Eventos Monitorados

Ao realizar a pesquisa (como no exemplo com equipe inserida), o painel exibirá o card **"Avaliação Geral"** com a média da equipe e a divisão por pilares de condução.

![Visualização do Painel com Equipe e Avaliação Geral](/images/painel_telemetria/picture2_paineltelemetria.png)

### 🏍️ 3.1. Pilares para Frota de Motos (3 Pilares)

1. 🛠️ **Manutenção:**
   * **Evento monitorado:** *Checklist não realizado*.
2. 🛡️ **Segurança:**
   * **Eventos monitorados:** *Aceleração Brusca*, *Curva Brusca* (ambos com severidades leve, média e alta) e *Velocidade Máxima da Via*.
   * > 💡 **Regra de Severidade:** Apenas os eventos de severidade **média e alta** descontam pontos da nota do condutor. Eventos de severidade **leve** servem apenas para notificação educacional ao condutor.
3. ⏱️ **Jornada:**
   * **Evento monitorado:** *Movimentação em horário indevido*.

---

### 🚚 3.2. Pilares para Frota de Veículos Pesados / Caminhões (4 Pilares)

1. 🛡️ **Segurança:** *Aceleração Brusca*, *Curva Brusca* e *Velocidade Máxima da Via*.
2. ⚡ **Performance:** *Faixa Amarela*, *Faixa Vermelha* e *Excesso de tempo parado com Ignição ligada*.
3. 🛠️ **Manutenção:** *Checklist não realizado*.
4. 📹 **VídeoTelemetria:** *Fadiga ao dirigir*, *Distração do condutor*, *Condutor sem cinto de segurança*, *Uso de celular em condução*, *Fumando ao conduzir* e *Veículo dianteiro muito próximo*.

> ⚖️ **REGRA DE COMPOSIÇÃO DA MÉDIA DE PESADOS:**  
> Para calcular a média dos caminhões, **apenas 3 pilares são computados** (*Segurança*, *Manutenção* e *Performance*). O pilar de **VídeoTelemetria** fica temporariamente fora da média geral para garantir a equidade com veículos que ainda não possuem câmeras instaladas.

---

## 📉 4. Comparativo de Pontuação e Acesso ao Condutor

Todos os condutores iniciam a jornada com **nota 100** e vão perdendo pontuação conforme cometem infrações.

Ao clicar em qualquer pilar para investigar o motivo de uma nota reduzida, o painel abre a seção **"Comparativo de pontuação"**, apresentando a lista de condutores em ordem **decrescente** (da maior nota para a menor nota).

Para detalhar o comportamento de um colaborador, clique diretamente sobre o **nome do condutor** para ser direcionado à tela **Painel de Motorista**.

![Seleção do Condutor no Comparativo de Pontuação](/images/painel_telemetria/picture3_paineltelemetria.png)

---

## 👤 5. Painel do Motorista e Detalhes da Operação

Ao abrir a nova aba do **Painel do Motorista**, os filtros já serão carregados preenchidos. É possível visualizar todas as informações do condutor, média geral, notas individuais por pilar e o card **"Detalhes da Operação"**, composto por 3 sub-abas:

![Painel do Motorista com Filtros Preenchidos e Detalhes](/images/painel_telemetria/picture4_paineltelemetria.png)

### 📋 5.1. Sub-aba: "Infrações"
* Exibe a lista completa de infrações registradas para o condutor no período.
* **Aplicação de Feedback:** Marque a checkbox da infração e clique em **"Adicionar Feedback"** para registrar a tratativa efetuada pelo supervisor de equipe.
* **Auditoria de Evento:** Para visualizar o local e o momento exato em que a infração ocorreu, clique nos **três pontos ("...")** da infração e selecione **Visualizar**.

![Ação de Visualizar nos Três Pontos da Infração](/images/painel_telemetria/picture5_paineltelemetria.png)

> 🔍 *Ao clicar em Visualizar, você será redirecionado para o mapa com os detalhes do evento para auditar a veracidade da ocorrência.*

### 💬 5.2. Sub-aba: "Ações Educacionais"
* Permite verificar as infrações que já possuem feedback aplicado.
* Permite registrar **Elogios** para condutores que mantiveram boa conduta ao longo do mês.

### 🚚 5.3. Sub-aba: "Viagens"
* Exibe o histórico de veículos utilizados pelo condutor no período selecionado, com data e hora de início e término das conduções.

---

## 🎯 6. Notas por Pilar e Detalhamento da Avaliação

Descendo a página do Painel do Motorista, é exibida a nota final do condutor com a separação por cada pilar de condução.

![Nota por Pilar e Detalhamento de Infrações do Condutor](/images/painel_telemetria/picture6_paineltelemetria.png)

No exemplo acima, o condutor perdeu pontuação exclusivamente no pilar de **Manutenção**, onde registrou **15 ocorrências** da infração **Checklist Não Realizado**.

---

## 💡 7. Resumo e Boas Práticas

Com o Painel de Telemetria, a equipe de gestão e supervisão consegue:
* 🔎 Fazer pesquisas dinâmicas por filiais e equipes;
* 📈 Acompanhar o ranking e evolução das notas dos condutores;
* 🛑 Identificar quais pilares e infrações estão impactando a segurança da unidade;
* 📝 Aplicar feedbacks educativos e registrar elogios operacionais;
* 🗺️ Auditar a localização e horários exatos de ocorrência de eventos.`
    },
    create: {
      title: 'Como utilizar o Painel de Telemetria',
      slug: 'como-utilizar-o-painel-de-telemetria',
      categoryId: catSistemas.id,
      contentMarkdown: `# Como utilizar o Painel de Telemetria

Guia completo sobre a navegação, filtros de busca, interpretação dos pilares de condução, consulta de notas e auditoria de infrações no Painel de Telemetria da Solar Coca-Cola.

---

## 📌 1. Visão Geral e Acesso ao Painel

O **Painel de Telemetria** é o coração da operação para análise dos eventos e infrações dos condutores da Solar Coca-Cola. É nele que fica concentrada a performance dos condutores e o acompanhamento de como estão conduzindo os veículos da frota.

### 🌐 Como acessar:
Na barra lateral (*sidebar*) da plataforma, clique no ícone da Solar e selecione **Painel de Telemetria**.

![Acesso ao Painel de Telemetria via Sidebar](/images/painel_telemetria/picture1_paineltelemetria.png)

---

## 🔍 2. Filtros de Pesquisa e Regras de Equipamentos

Para realizar uma consulta no painel, preencha os campos de filtro conforme as orientações abaixo:

| Campo | Preenchimento | Regra / Comportamento no Sistema |
| :--- | :--- | :--- |
| **Cliente** | **Obrigatório** | Selecionar a unidade operacional que deseja verificar. |
| **Equipe** | *Opcional* | • **Se preenchido:** Exibe os condutores e a média específica daquela equipe.<br>• **Se em branco:** Traz os dados de todas as equipes e exibe a média geral da unidade. |
| **Data Inicial e Final** | **Obrigatório** | Define o período específico para extração da análise. |
| **Tipo de Veículos** | Selection Box | Categorias disponíveis: **Pesados** (Caminhões) e **Motos**. |

### 🛠️ Regra de Interpretação por Equipamento:
> ⚠️ **ATENÇÃO AO DISPOSITIVO INSTALADO:**  
> O fator determinante para o sistema interpretar um veículo como **Pesado** ou **Moto** é o modelo do equipamento instalado:
> * Dispositivos **ST4305** ➔ Interpretados pelo sistema como **Moto**.
> * Dispositivos **VIRLOC6** ➔ Interpretados pelo sistema como **Caminhão (Pesado)**.
> 
> 💡 **Resolução de Inconsistências:** Como alguns caminhões possuem o rastreador ST4305 instalado (ex: frota antiga), eles serão interpretados no sistema como "Moto". Caso encontre divergência na extração do relatório, verifique qual equipamento está instalado no veículo antes de visualizar os dados.

Após preencher todos os campos necessários, clique no botão **Pesquisar**.

---

## 📊 3. Pilares de Condução e Eventos Monitorados

Ao realizar a pesquisa (como no exemplo com equipe inserida), o painel exibirá o card **"Avaliação Geral"** com a média da equipe e a divisão por pilares de condução.

![Visualização do Painel com Equipe e Avaliação Geral](/images/painel_telemetria/picture2_paineltelemetria.png)

### 🏍️ 3.1. Pilares para Frota de Motos (3 Pilares)

1. 🛠️ **Manutenção:**
   * **Evento monitorado:** *Checklist não realizado*.
2. 🛡️ **Segurança:**
   * **Eventos monitorados:** *Aceleração Brusca*, *Curva Brusca* (ambos com severidades leve, média e alta) e *Velocidade Máxima da Via*.
   * > 💡 **Regra de Severidade:** Apenas os eventos de severidade **média e alta** descontam pontos da nota do condutor. Eventos de severidade **leve** servem apenas para notificação educacional ao condutor.
3. ⏱️ **Jornada:**
   * **Evento monitorado:** *Movimentação em horário indevido*.

---

### 🚚 3.2. Pilares para Frota de Veículos Pesados / Caminhões (4 Pilares)

1. 🛡️ **Segurança:** *Aceleração Brusca*, *Curva Brusca* e *Velocidade Máxima da Via*.
2. ⚡ **Performance:** *Faixa Amarela*, *Faixa Vermelha* e *Excesso de tempo parado com Ignição ligada*.
3. 🛠️ **Manutenção:** *Checklist não realizado*.
4. 📹 **VídeoTelemetria:** *Fadiga ao dirigir*, *Distração do condutor*, *Condutor sem cinto de segurança*, *Uso de celular em condução*, *Fumando ao conduzir* e *Veículo dianteiro muito próximo*.

> ⚖️ **REGRA DE COMPOSIÇÃO DA MÉDIA DE PESADOS:**  
> Para calcular a média dos caminhões, **apenas 3 pilares são computados** (*Segurança*, *Manutenção* e *Performance*). O pilar de **VídeoTelemetria** fica temporariamente fora da média geral para garantir a equidade com veículos que ainda não possuem câmeras instaladas.

---

## 📉 4. Comparativo de Pontuação e Acesso ao Condutor

Todos os condutores iniciam a jornada com **nota 100** e vão perdendo pontuação conforme cometem infrações.

Ao clicar em qualquer pilar para investigar o motivo de uma nota reduzida, o painel abre a seção **"Comparativo de pontuação"**, apresentando a lista de condutores em ordem **decrescente** (da maior nota para a menor nota).

Para detalhar o comportamento de um colaborador, clique diretamente sobre o **nome do condutor** para ser direcionado à tela **Painel de Motorista**.

![Seleção do Condutor no Comparativo de Pontuação](/images/painel_telemetria/picture3_paineltelemetria.png)

---

## 👤 5. Painel do Motorista e Detalhes da Operação

Ao abrir a nova aba do **Painel do Motorista**, os filtros já serão carregados preenchidos. É possível visualizar todas as informações do condutor, média geral, notas individuais por pilar e o card **"Detalhes da Operação"**, composto por 3 sub-abas:

![Painel do Motorista com Filtros Preenchidos e Detalhes](/images/painel_telemetria/picture4_paineltelemetria.png)

### 📋 5.1. Sub-aba: "Infrações"
* Exibe a lista completa de infrações registradas para o condutor no período.
* **Aplicação de Feedback:** Marque a checkbox da infração e clique em **"Adicionar Feedback"** para registrar a tratativa efetuada pelo supervisor de equipe.
* **Auditoria de Evento:** Para visualizar o local e o momento exato em que a infração ocorreu, clique nos **três pontos ("...")** da infração e selecione **Visualizar**.

![Ação de Visualizar nos Três Pontos da Infração](/images/painel_telemetria/picture5_paineltelemetria.png)

> 🔍 *Ao clicar em Visualizar, você será redirecionado para o mapa com os detalhes do evento para auditar a veracidade da ocorrência.*

### 💬 5.2. Sub-aba: "Ações Educacionais"
* Permite verificar as infrações que já possuem feedback aplicado.
* Permite registrar **Elogios** para condutores que mantiveram boa conduta ao longo do mês.

### 🚚 5.3. Sub-aba: "Viagens"
* Exibe o histórico de veículos utilizados pelo condutor no período selecionado, com data e hora de início e término das conduções.

---

## 🎯 6. Notas por Pilar e Detalhamento da Avaliação

Descendo a página do Painel do Motorista, é exibida a nota final do condutor com a separação por cada pilar de condução.

![Nota por Pilar e Detalhamento de Infrações do Condutor](/images/painel_telemetria/picture6_paineltelemetria.png)

No exemplo acima, o condutor perdeu pontuação exclusivamente no pilar de **Manutenção**, onde registrou **15 ocorrências** da infração **Checklist Não Realizado**.

---

## 💡 7. Resumo e Boas Práticas

Com o Painel de Telemetria, a equipe de gestão e supervisão consegue:
* 🔎 Fazer pesquisas dinâmicas por filiais e equipes;
* 📈 Acompanhar o ranking e evolução das notas dos condutores;
* 🛑 Identificar quais pilares e infrações estão impactando a segurança da unidade;
* 📝 Aplicar feedbacks educativos e registrar elogios operacionais;
* 🗺️ Auditar a localização e horários exatos de ocorrência de eventos.`
    }
  });

  console.log('✓ Tópico "Como utilizar o Painel de Telemetria" garantido no banco.');
  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
