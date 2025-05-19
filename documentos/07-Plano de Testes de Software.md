## Plano de Testes de Software

*Pré-requisitos:* Especificação do Projeto, Projeto de Interface  
*Ambiente necessário:*  
- Site publicado na internet  
- Navegador da internet: Chrome, Firefox ou Edge  

---

### Casos de Teste

| Caso de teste | Requisitos associados | Objetivo do teste | Passos | Critérios de êxito | Responsável |
|---------------|------------------------|-------------------|--------|---------------------|-------------|
| *CT-01: Verificar o funcionamento dos links da página Home* | - RF-001: O site deve permitir ao usuário cadastrar uma conta.  
- RF-002: O site deve permitir ao usuário fazer o login da sua conta.  
- RF-005: O site deve permitir ao usuário disponibilizar informações das disciplinas de tutoria e suas informações para contato.  
- RF-007: O site deve permitir ao usuário visualizar os detalhes do livro. | Verificar se os links da página Home estão encaminhando para as respectivas páginas corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar nos links da página Home. | Todos os links da página Home devem encaminhar os usuários para as páginas descritas. | Maria |
| *CT-02: Verificar o funcionamento do filtro de pesquisa* | - RF-003: O site deve oferecer uma funcionalidade de filtro/pesquisa para permitir ao usuário localizar livros e disciplinas das tutorias disponíveis. | Verificar se o filtro de pesquisa está recuperando os dados inseridos pelo usuário | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar na página Livros.  
5. Digitar no filtro de pesquisa algum dado presente na página Livros e verificar se o resultado é exibido na página. | Os dados inseridos no filtro de pesquisa devem mostrar o livro onde há o dado informado. | Maria |
| *CT-03: Verificar detalhes dos livros* | - RF-006: O site deve apresentar, para cada livro, uma imagem correspondente à capa.  
- RF-007: O site deve permitir ao usuário visualizar os detalhes do livro. | Verificar se todas as informações referentes aos livros estão disponíveis na página Livros | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar na página Livros.  
5. Visualizar as informações referentes aos livros disponíveis na página. | Todas as informações, incluindo imagens das capas, referentes aos livros estão disponíveis na página Livros. | João |
| *CT-04: Verificar o cadastro de usuários* | - RF-001: O site deve permitir ao usuário cadastrar uma conta. | Verificar se o cadastro está sendo feito corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em "Cadastre-se", no Menu.  
5. Preencher o formulário e clicar em “Cadastrar”. | Deve ocorrer uma validação das informações fornecidas pelo usuário, e ao clicar em "Cadastrar", deve aparecer a mensagem "Usuário cadastrado com sucesso". | Silvia |
| *CT-05: Verificar o login de usuários* | - RF-002: O site deve permitir ao usuário fazer o login da sua conta. | Verificar se o login está sendo feito corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em “Entrar”, no menu.  
5. Preencher seus dados e clicar em “Entrar”. | Após o login, o usuário deverá ser redirecionado para a sua página de perfil. | Maria |
| *CT-06: Verificar o cadastro de livros* | - RF-004: O site deve permitir ao usuário fazer o cadastro de livros. | Verificar se o cadastro de livros está sendo feito corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em “Entrar”, no menu.  
5. Preencher seus dados e clicar em “Entrar”.  
6. Visualizar a página Perfil.  
7. Clicar em “Cadastro de livros”, no menu.  
8. Inserir as informações sobre o livro.  
9. Clicar em “Cadastrar”. | Deve ocorrer uma validação das informações fornecidas pelo usuário, e ao clicar em "Cadastrar", deve aparecer a mensagem "Livro cadastrado com sucesso". | João |
| *CT-07: Verificar o cadastro de tutores* | - RF-005: O site deve permitir ao usuário disponibilizar informações das disciplinas de tutoria e suas informações para contato. | Verificar se o cadastro de tutores está sendo feito corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em “Entrar”, no menu.  
5. Preencher seus dados e clicar em “Entrar”.  
6. Visualizar a página Perfil.  
7. Clicar em “Cadastro de tutores”, no menu.  
8. Inserir as informações sobre o tutor.  
9. Clicar em “Cadastrar”. | Deve ocorrer uma validação das informações fornecidas pelo usuário, e ao clicar em "Cadastrar", deve aparecer a mensagem "Tutoria cadastrada com sucesso". | Beatriz |
| *CT-08: Verificar a página de Tutores* | - RF-008: O site deve permitir ao usuário visualizar os detalhes dos tutores. | Verificar os detalhes dos Tutores e visualizar seus respectivos perfis | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em “Tutores”, no menu.  
5. Visualizar a página "Tutores".  
6. Verificar os perfis com foto e informações dos tutores, além da barra de pesquisa. | Deve ser possível visualizar todos os perfis de Tutores, com suas respectivas fotos e informações, além da visualização da barra de pesquisa acima dos perfis. | Pedro |
| *CT-09: Verificar a página de perfil de usuários cadastrados* | - RF-009: O site deve permitir ao usuário verificar as informações registradas no cadastro na página Perfil, após fazer seu login. | Verificar se a página Perfil está apresentando as informações cadastradas pelo usuário corretamente | 1. Acessar o navegador.  
2. Informar o endereço do site.  
3. Visualizar a página Home.  
4. Clicar em "Cadastre-se", no Menu.  
5. Preencher o formulário e clicar em “Cadastrar”.  
6. Visualizar a página Login.  
7. Preencher seus dados e clicar em “Entrar”.  
8. Visualizar a página Perfil. | As informações registradas pelo usuário no momento do cadastro devem estar disponibilizadas na página Perfil. | Silvia |
