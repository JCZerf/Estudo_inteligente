# Plano de Testes de Software

<span style="color:red">Pré-requisitos: <a href=""> Especificação do Projeto</a></span>, <a href="https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e1-proj-web-t8-grupo-2-estudo-inteligente/blob/main/documentos/04-Projeto%20de%20Interface.md"> Projeto de Interface</a>

Os requisitos para realização dos testes de software são:
<ul>
  <li>Aplicação publicada em ambiente local ou remoto</li>
  <li>Navegadores recomendados: Google Chrome, Mozilla Firefox ou Microsoft Edge</li>
</ul>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-01</td>
  <td><ul><li>RF-001: Navegação entre páginas do menu lateral</li></ul></td>
  <td>Validar redirecionamento dos links principais</td>
  <td><ol><li>Acessar aplicação</li><li>Clicar em: Cronograma, Tarefas, Sessão de Foco</li></ol></td>
  <td>Redirecionamento correto para cada página</td>
  <td>José Carlos</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-02</td>
  <td><ul><li>RF-002: Exibição de temas no cronograma</li></ul></td>
  <td>Confirmar distribuição correta de temas</td>
  <td><ol><li>Acessar Cronograma</li><li>Verificar ordenação por dia</li></ol></td>
  <td>Temas exibidos na ordem planejada</td>
  <td>Sávio</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-03</td>
  <td><ul><li>RF-003: Cadastro/visualização de tarefas</li></ul></td>
  <td>Validar fluxo completo de criação</td>
  <td><ol><li>Acessar Tarefas</li><li>Cadastrar nova tarefa</li><li>Verificar lista</li></ol></td>
  <td>Tarefa visível imediatamente após cadastro</td>
  <td>José Carlos</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-04</td>
  <td><ul><li>RF-004: Edição/exclusão de tarefas</li></ul></td>
  <td>Testar modificações e remoção</td>
  <td><ol><li>Editar tarefa existente</li><li>Salvar alterações</li><li>Excluir tarefa</li></ol></td>
  <td>Alterações persistidas e exclusão efetiva</td>
  <td>Sávio</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-05</td>
  <td><ul><li>RF-005: Vinculação tarefa-sessão</li></ul></td>
  <td>Validar associação entre tarefa e timer</td>
  <td><ol><li>Selecionar tarefa</li><li>Iniciar cronômetro</li><li>Finalizar sessão</li></ol></td>
  <td>Tarefa vinculada ao tempo registrado</td>
  <td>José Carlos</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-06</td>
  <td><ul><li>RF-006: Cronômetro regressivo (10-120min)</li></ul></td>
  <td>Testar precisão temporal</td>
  <td><ol><li>Definir tempo (25min)</li><li>Iniciar contagem</li><li>Aguardar término</li></ol></td>
  <td>Contagem precisa até zero com alerta</td>
  <td>Sávio</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-07</td>
  <td><ul><li>RF-007: Animação de progresso</li></ul></td>
  <td>Validar atualização proporcional</td>
  <td><ol><li>Iniciar sessão</li><li>Monitorar barra</li></ol></td>
  <td>Progresso contínuo até 100%</td>
  <td>José Carlos</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-08</td>
  <td><ul><li>RF-008: Soma de sessões concluídas</li></ul></td>
  <td>Validar acumulação correta</td>
  <td><ol><li>Completar sessão</li><li>Verificar total</li><li>Interromper sessão</li></ol></td>
  <td>Somente sessões completas contabilizadas</td>
  <td>Sávio</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-09</td>
  <td><ul><li>RF-009: Troca de tema</li></ul></td>
  <td>Testar alternância visual</td>
  <td><ol><li>Acessar Configurações</li><li>Alternar temas</li></ol></td>
  <td>Mudança imediata de cores</td>
  <td>José Carlos</td>
 </tr>
</table>


<table>
 <tr>
  <th>Caso de teste</th>
  <th>Requisitos associados</th>
  <th>Objetivo do teste</th>
  <th>Passos</th>
  <th>Critérios de êxito</th>
  <th>Responsável</th>
 </tr>
 <tr>
  <td>CT-10</td>
  <td><ul><li>RF-010: Exibição do nome pós-login</li></ul></td>
  <td>Validar exibição consistente</td>
  <td><ol><li>Inserir nome</li><li>Navegar entre páginas</li></ol></td>
  <td>Nome visível em todas as telas</td>
  <td>Sávio</td>
 </tr>
</table>
