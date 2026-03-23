## PROBLEMAS:
0. O worker ao receber input (ghp_token) puxa o nome da conta, exclui todos os repo.
    - Após exclusão gera 4 nomes (2 repo | 2 yml) cria 2 repos: A-Server | A-Stream.
    - Após criar os 2 repos, envia os 2 yml. E dispara o primeiro Actions (A-Boot).
    - O A-Boot (como é a primeira init) baixa os links(2) .zip extrai e envia p/ repos.
    - Nas proximas vezes que o action inicia ele sabe que já foi populado com repo e passa.
    - Logica de decks|hash também será aplicada aos .zips cadastrados para randomização. 
1. O worker não verifica se já tem repo, quem faz isso é o A-Server na primeira inicialização.
2. Sempre separar 1 Unico slot actions para A-Server e 19 slots para A-Stream.
    - Nunca uma G.A pode ter 2 A-Servers sequenciais.
    - 1:1 A-Server | 2:20 A-Stream 