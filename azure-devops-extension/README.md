# OptSolv Time Tracker — Azure DevOps Extension

Registre e visualize horas diretamente nos work items do Azure DevOps, sem precisar alternar entre aplicações.

## Funcionalidades

- **Timer integrado** — inicie/pare o timer diretamente no painel do work item
- **Registro rápido** — lance horas com projeto, descrição e data em segundos
- **Histórico do item** — veja todos os lançamentos vinculados ao work item atual (seus e da equipe)
- **Totais em tempo real** — total de horas do item e suas próprias horas

## Instalação

### 1. Pré-requisitos

- Acesso ao Azure DevOps (Publisher)
- Node.js 18+ e `pnpm`
- `tfx-cli`: `pnpm add -g tfx-cli`

### 2. Build e empacotamento

```bash
cd azure-devops-extension
pnpm install
pnpm build
pnpm package
# Gera: dist/vsix/OptSolv.optsolv-time-tracker-X.X.X.vsix
```

### 3. Publicação no Marketplace (privado)

```bash
tfx extension publish --manifest-globs vss-extension.json \
  --token <SEU_PAT_MARKETPLACE>
```

Ou faça upload manual em: https://marketplace.visualstudio.com/manage

### 4. Instalação na organização

1. Acesse **Organization Settings → Extensions**
2. Clique em **Browse local extensions** ou pesquise `optsolv-time-tracker`
3. Clique em **Install**

## Configuração da Extensão

Na primeira vez que o painel aparecer em um work item:

1. Na **aplicação OptSolv Time Tracker**, vá em:  
   `Integrações → Azure DevOps → Extensão`
2. Clique em **Gerar Token de Extensão** e copie o token.
3. No painel da extensão dentro do Azure DevOps, preencha:
   - **URL da Aplicação**: ex. `https://app.optsolv.com`
   - **Token de Extensão**: cole o token gerado
4. Clique em **Conectar**

## Segurança

- O token é gerado aleatoriamente (256 bits) e armazenado de forma segura no banco de dados
- Cada usuário tem seu próprio token
- O token pode ser revogado a qualquer momento na página de Integrações
- Toda comunicação é feita via HTTPS com header `Authorization: Bearer <token>`
- O token **não expira automaticamente** — revogue-o se desconfiar de comprometimento

## Desenvolvimento Local

```bash
cd azure-devops-extension
pnpm install
pnpm dev
# Abra http://localhost:5173/src/work-item-form/index.html
```

> **Nota:** A extensão tenta inicializar o SDK do Azure DevOps. Em desenvolvimento local, o SDK falhará graciosamente e a UI renderizará sem contexto de work item.
