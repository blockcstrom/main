## PLANO PARA CRIAÇÃO AUTOMATICA DE REPO:
1. UI aceita apenas o token classic e cria o nome(para o sistema interno) automatico usando a logica que já temos.
2. O processo se inicia com API de IA, teremos um acervo de temas de projeto FICTÍCO.
- Teremos varias APIs de IA, rotativas para contornar o limite de uso (dentro das regras, contas reais que não usam o serviço)
3. Enviaremos a API da IA um prompt. 
   [ORDEM] Projeto (tema simples do acervo sempre rotacionando)
   - Nome do repositorio
      - Crie estrutura de pastas
         - Crie estrutura de arquivos de código
            - Cria os arquivos com nomes aleatorios [arquivo].yml
               - Crie estrutura de arquivos de configuração
                  - Crie um README.MD indicando o projeto ficticio

4. Retorno via JSON - Comunicação entre a IA >< Worker, com o output da IA.
5. Após o resultado sendo entregue pela IA, o Worker cria:
   Com base no [RESULTADO] pode ser um .txt ou propriamente um .md:
      - Cria o repositorio.
         - Cria pastas, arquivos [codigo/config]
            - Cria os genericos [arquivos].yml
               - Cria o Readme.md final.

6. O Worker coloca as linhas obrigatórias de docker run dentro dos [arquivos].yml
   - Dockers: Nginx local, Tunnel CF, Raiz principal do sistema.

7. Com isso o sistema ficará robusto.

## OBSERVAÇÕES:
1. Ideal que a IA não precise se atentar a funcionalidade real
2. Deixar explicito ser ficticio para rápida resposta/output
3. Rotatividade de temas para não ser repetitivo.
4. Garantir que a IA não seja embarcada de contextos anteriores.
5. Implementar uma barra de loading real na UI sobre o andamento do processo.
