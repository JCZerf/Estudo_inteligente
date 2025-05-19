# Plano de Testes de Software

<span style="color:red">Pré-requisitos: 
[Especificação do Projeto]([link_para_especificação](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e1-proj-web-t8-grupo-2-estudo-inteligente/blob/main/documentos/02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md)), 
[Projeto de Interface]([link_para_interface](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e1-proj-web-t8-grupo-2-estudo-inteligente/blob/main/documentos/04-Projeto%20de%20Interface.md))</span>

Os requisitos para realização dos testes de software são:
<ul>
  <li>Aplicação publicada em ambiente local ou remoto</li>
  <li>Navegadores recomendados: Google Chrome, Mozilla Firefox ou Microsoft Edge</li>
</ul>

Os testes funcionais a serem realizados na aplicação são descritos a seguir.

<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 
 <!-- CT-01 -->
 <tr>
  <td>CT-01: Verificar funcionamento dos links da página Inicial</td>
  <td><ul><li>RF-001: Navegação entre páginas do menu lateral</li></ul></td>
  <td>Validar redirecionamento dos links principais</td>
  <td><ol><li>Acessar aplicação</li><li>Clicar em: Cronograma, Tarefas, Sessão de Foco</li></ol></td>
  <td>Redirecionamento correto para cada página</td>
  <td>José Carlos</td>
 </tr>

 <!-- CT-02 -->
 <tr>
  <td>CT-02: Verificar página de Cronograma</td>
  <td><ul><li>RF-002: Exibição de temas no cronograma</li></ul></td>
  <td>Confirmar distribuição correta de temas por data</td>
  <td><ol><li>Acessar Cronograma</li><li>Verificar ordenação por dia</li></ol></td>
  <td>Temas exibidos na ordem planejada</td>
  <td>Sávio</td>
 </tr>

 <!-- CT-03 -->
 <tr>
  <td>CT-03: Cadastro e exibição de tarefas</td>
  <td><ul><li>RF-003: Cadastro/visualização de tarefas</li></ul></td>
  <td>Validar fluxo completo de criação</td>
  <td><ol><li>Acessar Tarefas</li><li>Cadastrar nova tarefa</li><li>Verificar lista</li></ol></td>
  <td>Tarefa visível imediatamente após cadastro</td>
  <td>José Carlos</td>
 </tr>

 <!-- CT-04 -->
 <tr>
  <td>CT-04: Edição e exclusão de tarefas</td>
  <td><ul><li>RF-004: Edição/exclusão de tarefas</li></ul></td>
  <td>Testar modificações e remoção</td>
  <td><ol><li>Editar tarefa existente</li><li>Salvar alterações</li><li>Excluir tarefa</li></ol></td>
  <td>Alterações persistidas e exclusão efetiva</td>
  <td>Sávio</td>
 </tr>

 <!-- CT-05 -->
 <tr>
  <td>CT-05: Seleção de tarefa na Sessão de Foco</td>
  <td><ul><li>RF-005: Vinculação tarefa-sessão</li></ul></td>
  <td>Validar associação entre tarefa e timer</td>
  <td><ol><li>Selecionar tarefa</li><li>Iniciar cronômetro</li><li>Finalizar sessão</li></ol></td>
  <td>Tarefa vinculada ao tempo registrado</td>
  <td>José Carlos</td>
 </tr>

 <!-- CT-06 -->
 <tr>
  <td>CT-06: Funcionamento do cronômetro</td>
  <td><ul><li>RF-006: Cronômetro regressivo (10-120min)</li></ul></td>
  <td>Testar precisão temporal</td>
  <td><ol><li>Definir tempo (25min)</li><li>Iniciar contagem</li><li>Aguardar término</li></ol></td>
  <td>Contagem precisa até zero com alerta</td>
  <td>Sávio</td>
 </tr>

 <!-- CT-07 -->
 <tr>
  <td>CT-07: Barra de progresso visual</td>
  <td><ul><li>RF-007: Animação de progresso</li></ul></td>
  <td>Validar atualização proporcional</td>
  <td><ol><li>Iniciar sessão</li><li>Monitorar barra</li></ol></td>
  <td>Progresso contínuo até 100%</td>
  <td>José Carlos</td>
 </tr>

 <!-- CT-08 -->
 <tr>
  <td>CT-08: Contagem de tempo total</td>
  <td><ul><li>RF-008: Soma de sessões concluídas</li></ul></td>
  <td>Validar acumulação correta</td>
  <td><ol><li>Completar sessão</li><li>Verificar total</li><li>Interromper sessão</li></ol></td>
  <td>Somente sessões completas contabilizadas</td>
  <td>Sávio</td>
 </tr>

 <!-- CT-09 -->
 <tr>
  <td>CT-09: Mudança de tema claro/escuro</td>
  <td><ul><li>RF-009: Troca de tema</li></ul></td>
  <td>Testar alternância visual</td>
  <td><ol><li>Acessar Configurações</li><li>Alternar temas</li></ol></td>
  <td>Mudança imediata de cores</td>
  <td>José Carlos</td>
 </tr>

 <!-- CT-10 -->
 <tr>
  <td>CT-10: Personalização do nome do usuário</td>
  <td><ul><li>RF-010: Exibição do nome pós-login</li></ul></td>
  <td>Validar exibição consistente</td>
  <td><ol><li>Inserir nome</li><li>Navegar entre páginas</li></ol></td>
  <td>Nome visível em todas as telas</td>
  <td>Sávio</td>
 </tr>
</table>


### Destaques da formatação:
1. *Estrutura uniforme*:
   - Todos os 10 casos seguem exatamente o mesmo padrão de tabela
   - Mesma numeração (CT-01 a CT-10) e responsáveis originais

2. *Elementos preservados*:
   - Links em vermelho para pré-requisitos
   - Listas HTML para requisitos e passos
   - Colunas idênticas ao modelo

3. *Otimizações*:
   - Conteúdo mais conciso mantendo todos os critérios originais
   - Passos simplificados (sem perder precisão)
   - Requisitos destacados por caso

4. *Consistência visual*:
   - Mesmo estilo de tabelas do exemplo
   - Uniformidade na capitalização
   - Alinhamento vertical

*Pronto para implementação imediata!* Caso queira ajustar algum elemento específico (como adicionar screenshots ou detalhar mais algum caso), é só me avisar.
