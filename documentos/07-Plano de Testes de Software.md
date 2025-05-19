# Plano de Testes de Software

# Plano de Testes de Software – Estudo Inteligente

## Pré-requisitos
- Especificação do Projeto
- Protótipos das Telas
- Regras de Negócio

## Requisitos para realização dos testes
- Aplicação publicada em ambiente local ou remoto
- Navegadores recomendados: Google Chrome, Mozilla Firefox ou Microsoft Edge

---

## CT-01 – Verificar o funcionamento dos links da página Inicial

- *Requisitos associados:*  
  RF-001: O sistema deve permitir navegação entre as páginas do menu lateral.

- *Objetivo do teste:*  
  Verificar se os links da página Inicial levam corretamente às páginas internas.

- *Passos:*  
  1. Acessar o navegador  
  2. Informar o endereço da aplicação  
  3. Clicar nos links: Cronograma, Tarefas, Sessão de Foco e Configurações

- *Critérios de êxito:*  
  Todos os links devem redirecionar corretamente para suas respectivas páginas.

- *Responsável:* José Carlos

---

## CT-02 – Verificar o funcionamento da página de Cronograma

- *Requisitos associados:*  
  RF-002: O sistema deve exibir os temas de estudo distribuídos no cronograma.

- *Objetivo do teste:*  
  Confirmar a correta distribuição visual dos temas no cronograma com base nas datas.

- *Passos:*  
  1. Acessar a página Cronograma  
  2. Verificar a visualização dos temas por dia  
  3. Conferir se a ordem respeita o planejamento

- *Critérios de êxito:*  
  O cronograma deve exibir corretamente os temas de estudo distribuídos por data.

- *Responsável:* Sávio

---

## CT-03 – Verificar o cadastro e exibição de tarefas

- *Requisitos associados:*  
  RF-003: O sistema deve permitir ao usuário cadastrar e visualizar tarefas.

- *Objetivo do teste:*  
  Garantir que o cadastro e a visualização de tarefas estejam funcionando corretamente.

- *Passos:*  
  1. Acessar a página Tarefas  
  2. Cadastrar uma nova tarefa com título, descrição e prioridade  
  3. Verificar se a tarefa aparece na lista

- *Critérios de êxito:*  
  A tarefa deve aparecer imediatamente na lista após o cadastro.

- *Responsável:* José Carlos

---

## CT-04 – Verificar edição e exclusão de tarefas

- *Requisitos associados:*  
  RF-004: O sistema deve permitir ao usuário editar e excluir tarefas.

- *Objetivo do teste:*  
  Confirmar se as funcionalidades de edição e exclusão funcionam corretamente.

- *Passos:*  
  1. Acessar a página Tarefas  
  2. Clicar para editar uma tarefa  
  3. Alterar campos e salvar  
  4. Verificar a atualização  
  5. Clicar para excluir uma tarefa  
  6. Confirmar a exclusão

- *Critérios de êxito:*  
  As alterações devem ser salvas e as tarefas devem ser excluídas corretamente.

- *Responsável:* Sávio

---

## CT-05 – Verificar seleção de tarefa na Sessão de Foco

- *Requisitos associados:*  
  RF-005: O sistema deve permitir a seleção de uma tarefa para a sessão de foco.

- *Objetivo do teste:*  
  Verificar se a seleção é refletida visualmente e vinculada ao tempo de estudo.

- *Passos:*  
  1. Acessar Sessão de Foco  
  2. Selecionar uma tarefa  
  3. Iniciar o cronômetro  
  4. Finalizar a sessão

- *Critérios de êxito:*  
  A tarefa deve estar visivelmente selecionada, e o tempo registrado após a sessão.

- *Responsável:* José Carlos

---

## CT-06 – Verificar funcionamento do cronômetro regressivo

- *Requisitos associados:*  
  RF-006: O sistema deve conter um cronômetro regressivo funcional com tempos de 10 a 120 minutos.

- *Objetivo do teste:*  
  Garantir o funcionamento preciso do cronômetro.

- *Passos:*  
  1. Selecionar um tempo de 25 minutos  
  2. Iniciar o cronômetro  
  3. Observar a contagem  
  4. Aguardar finalização

- *Critérios de êxito:*  
  O cronômetro deve contar corretamente até 0 e exibir um alerta visual.

- *Responsável:* Sávio

---

## CT-07 – Verificar barra de progresso visual (“subir a escada da inteligência”)

- *Requisitos associados:*  
  RF-007: O sistema deve apresentar uma barra de progresso animada durante a sessão.

- *Objetivo do teste:*  
  Confirmar se a barra se atualiza proporcionalmente ao tempo decorrido.

- *Passos:*  
  1. Iniciar uma sessão de foco  
  2. Observar a evolução da barra visual conforme o tempo passa

- *Critérios de êxito:*  
  A barra deve crescer de forma contínua até o fim da sessão.

- *Responsável:* José Carlos

---

## CT-08 – Verificar a contagem de tempo total de foco

- *Requisitos associados:*  
  RF-008: O sistema deve somar apenas sessões concluídas ao total de tempo.

- *Objetivo do teste:*  
  Validar o comportamento correto da contagem acumulada.

- *Passos:*  
  1. Concluir uma sessão de foco  
  2. Observar o tempo total aumentado  
  3. Iniciar outra sessão e interromper  
  4. Confirmar que o tempo não foi somado

- *Critérios de êxito:*  
  Apenas sessões completas devem contribuir para o total exibido.

- *Responsável:* Sávio

---

## CT-09 – Verificar a mudança de tema claro/escuro

- *Requisitos associados:*  
  RF-009: O sistema deve permitir a troca entre temas claro e escuro.

- *Objetivo do teste:*  
  Testar se o sistema aplica corretamente a troca de tema.

- *Passos:*  
  1. Acessar a página Configurações  
  2. Alterar o tema para escuro  
  3. Verificar a mudança  
  4. Alterar novamente para o tema claro

- *Critérios de êxito:*  
  As cores do sistema devem se atualizar corretamente em ambas as opções.

- *Responsável:* José Carlos

---

## CT-10 – Verificar personalização do nome do usuário

- *Requisitos associados:*  
  RF-010: O sistema deve exibir o nome do usuário nas telas após o login.

- *Objetivo do teste:*  
  Garantir que o nome do usuário seja exibido corretamente nas telas.

- *Passos:*  
  1. Informar o nome no início da aplicação  
  2. Navegar pelas telas  
  3. Verificar o nome nas interfaces superiores

- *Critérios de êxito:*  
  O nome deve ser exibido corretamente em todas as páginas principais.

- *Responsável:* Sávio
