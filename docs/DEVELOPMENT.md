> Documento técnico anterior, preservado como referência. As regras atualizadas e a implantação desta versão estão em `Feedback.md` e no README principal.

# Fut Manager Mobile

## Campeonatos e times

O menu **Rankings** dos campeonatos usa a mesma interface dos grupos, com abas e
navegação ao deslizar: Artilharia, Assistências, Gols contra, Amarelos,
Vermelhos e Gols sofridos. Vitórias e Derrotas não aparecem. O menu está disponível
em todos os formatos: Liga, Grupos + mata-mata, Mata-mata e Cascata. Os totais consideram
somente partidas finalizadas; jogadores empatados compartilham a posição.
Derrotas e quantidade de partidas são atribuídas ao elenco inscrito do time;
desempates eliminatórios com placar igual não contam como derrota.
Em cada jogo pendente, selecione o goleiro de cada time para alimentar Gols
sofridos. Goleiros sem gols sofridos também aparecem após jogar uma partida.
Essa seleção exige a migration `023_championship_goalkeepers.sql` na API.

O formato **Liga (pontos corridos)** permite escolher **Jogo único** ou **Ida e volta**
na criação. Todos os times se enfrentam uma ou duas vezes, com mandos invertidos
no returno. Com 16 times, são 15 ou 30 rodadas. O líder ao fim de todos os jogos é
campeão; o segundo é vice. Edições existentes continuam em jogo único.
A tela **Jogos** mostra uma rodada por página, com abas horizontais e navegação
ao deslizar para o lado, como nos rankings do grupo. Cada time joga uma vez por
rodada, e os placares concluídos ficam visíveis. Qualquer jogo pendente pode
receber lances e resultado, independentemente das rodadas anteriores.
A tela **Resultados** usa as mesmas abas por rodada e navegação ao deslizar,
exibindo apenas partidas finalizadas. Rodadas sem resultados mostram um aviso;
os confrontos pendentes continuam acessíveis em **Jogos**.
O menu do campeonato oferece **Classificação geral**, com pontos de todos os times
em todas as fases. Vitória vale 3 pontos, empate vale 1 e derrota vale 0. Desempates:
mais vitórias, mais empates, menos derrotas e mais gols marcados; persistindo o empate,
ordem de inscrição. Placares empatados contam como empate, inclusive no mata-mata.
Requer as migrations `021_league_championships.sql` e `022_league_home_and_away.sql` na API.

No menu da pelada, **Classificação geral** mostra os jogadores e convidados por pontos
da temporada atual, com os mesmos desempates e gols individuais. Sem temporadas
ativas, os pontos são acumulados. O primeiro lugar recebe Campeão da temporada
no encerramento; empates em todos os critérios compartilham o troféu.
Somente partidas finalizadas de eventos não cancelados contam. Jogadores sem jogos
não aparecem; empates completos dividem a posição.

Na home, **Criar grupo ou campeonato** abre a escolha entre as duas opções.
Campeonatos têm nome, temporada/edição, formato e 4, 8 ou 16 times.
**Campeonatos** permite buscar edições, consultar elencos, classificação e jogos.
**Meus times e convites** permite criar times permanentes, convidar jogadores
pelo e-mail cadastrado e aceitar/recusar os convites recebidos no app.

O criador do time o inscreve no campeonato com ao menos dois jogadores
confirmados. O elenco fica salvo na inscrição; para alterá-lo antes do início,
retire e reinscreva o time. O organizador inicia quando todas as vagas estiverem
preenchidas e confirma os resultados para avançar as fases até a final.

Grupos + mata-mata usa grupos de quatro e classifica os dois melhores de cada
grupo. Mata-mata usa eliminação simples; empates pedem o vencedor do desempate.
Cascata aceita exatamente quatro times e usa chaves de vencedores e perdedores, com final geral única. O app respeita a ordem dos jogos para que o perdedor da final dos vencedores descanse durante a semifinal dos perdedores.

Requer a API com as migrations `017_championships.sql` e `018_cascade_trophies.sql`. Ao confirmar os resultados, informe gols, assistências e gols contra por jogador. A final distribui os troféus exclusivos de campeão, vice-campeão, artilheiro e líder de assistências, exibidos na edição e na coleção do perfil. Empatados nas maiores marcas positivas também recebem os troféus individuais.

## Login e grupos

A tela inicial solicita e-mail e senha de um perfil já cadastrado na API.
Após o login, a home lista os grupos criados pelo usuário e aqueles em que ele
é membro ativo, com busca, atualização ao puxar a lista e opção de sair.
Perfis legados com senha `RESET_REQUIRED` precisam ter uma senha definida na API.

Inicie a API na porta 8000 (`docker compose up --build` no projeto da API).
Na web, o aplicativo acessa somente `/api`, no mesmo domínio do site.
O servidor encaminha as requisições ao destino definido em `API_UPSTREAM`,
configurado no painel do provedor ou em um arquivo `.env` ignorado pelo Git.
O build web não precisa da URL do servidor nem recebe credenciais do banco.
Para uma execução nativa futura, defina `EXPO_PUBLIC_API_URL` no ambiente privado.

Execute `npm run android` ou `npm run web`. A sessão fica em memória:
fechar/recarregar completamente o aplicativo exige novo login. Senhas não são
persistidas. Sessões expiradas retornam à tela de login.

Verificação: `npm run lint` e `npx tsc --noEmit`.

Ao agendar com **Repetir toda semana**, selecione o dia da semana e o horário.
O app mostra a primeira ocorrência disponível no fuso escolhido, respeitando
uma hora de antecedência. Se o horário de hoje já passou ou está muito próximo,
o primeiro evento fica para a semana seguinte. Eventos avulsos continuam usando
uma data completa. Ao encerrar um evento semanal, a API cria o próximo no mesmo
dia e horário, com novas confirmações.

## Área do grupo

Em **Configurações do grupo → Parâmetros de sorteio**, owners e administradores
podem ligar ou desligar **Posição**, **Notas** e **Vitórias** e salvar a escolha.
Essa é a ordem de prioridade dos critérios ativos. Todos começam desligados.

Para avaliar alguém, abra **Membros do grupo → perfil do jogador → Avaliação
privada**. A nota é de 0 a 10, com uma casa decimal; pode usar vírgula ou ponto.
Deixe vazio e salve para remover. Somente owners e administradores do grupo veem e
editam as notas, inclusive a própria avaliação. As alterações podem ser
feitas a qualquer momento e só afetam os próximos sorteios, preservando os times
já montados.

Depois do sorteio, a lista **Times e jogadores** mostra as notas atuais aos
owners e administradores, incluindo a própria avaliação. Pessoas sem nota aparecem
como **Sem avaliação**. Jogadores comuns continuam vendo somente a escalação.

Toque em um grupo na home para abrir seu menu. O próximo evento mostra data,
horário, local, quantidade de confirmados e sua situação. A confirmação respeita
as inscrições e o limite de vagas; se estiver lotado, o app informa a posição
na lista de espera. A lista de confirmados mostra membros e convidados.

O menu também abre o histórico de eventos, os membros ativos e os rankings
(artilharia, assistências, vitórias, derrotas, gols contra, cartões e gols sofridos).
Os rankings usam partidas finalizadas. Gols sofridos ordena goleiros pelo menor
total e informa quantas partidas disputaram nessa função. As telas podem ser
atualizadas pelo botão Atualizar ou puxando a lista para baixo.

---

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Times, partidas e histórico

Abra o evento no grupo. Como organizador ou administrador, inicie o evento,
forme os times por sorteio ou selecionando cada jogador, e escolha/sorteie os dois
times iniciais. Há seleção opcional de goleiro por time. Durante a partida,
escolha time, jogador e tipo de lance para registrar gols, assistências, cartões
e gols contra. Lances podem ser removidos antes de finalizar a partida.

Ao confirmar o resultado, o vencedor fica, o próximo da fila entra e o perdedor
vai para o fim. Em empate, escolha ou sorteie quem avança. Marque a opção de
encerrar o evento para não iniciar outra partida. Membros comuns acompanham o
estado pelo botão Atualizar; a tela também atualiza ao retornar à navegação.

O histórico contém somente eventos encerrados. Nele, partidas, placares, súmulas
e jogadores são somente para consulta, sem controles de início ou edição.

## Publicação do site/PWA

`npm run build:pwa` exporta `dist/` com manifesto, ícones e suporte à instalação.
O navegador utiliza apenas `/api`, no mesmo domínio do site. A URL do destino
não é incorporada ao JavaScript; somente o servidor recebe `API_UPSTREAM`.
Não coloque credenciais ou parâmetros de banco em variáveis `EXPO_PUBLIC_*`.

No Railway, use este repositório como serviço, na raiz do projeto.
`railway.json` seleciona o Dockerfile e o healthcheck `/health`.
Defina `API_UPSTREAM` no painel do serviço web com o destino da API, sem `/api`
no final. O servidor falha explicitamente se essa variável não estiver definida,
evita escolher um servidor por padrão e omite valores na mensagem de configuração ausente.
A porta padrão é `8080`, ou a variável `PORT` fornecida pelo provedor.
As credenciais de PostgreSQL são configuradas exclusivamente no serviço da API.
Não é necessário definir comandos de build ou inicialização manualmente.

No iPhone, abra o domínio no Safari e use Compartilhar → Adicionar à Tela de Início.
No Android, use a opção de instalar no navegador. A mesma publicação atende
celulares e computadores. Reabrir o PWA carrega as alterações publicadas;
a atualização não recarrega uma partida em andamento. Consultar e registrar dados
exige internet. O service worker guarda somente o aviso de falta de conexão.

## Configurações privadas e execução nativa futura

`.env.example` contém somente nomes de variáveis e campos vazios.
Os arquivos `.env`, chaves, certificados, dumps e artefatos são ignorados pelo Git
e excluídos do contexto Docker. Não adicione os valores reais aos exemplos ou README.

A execução web funciona sem uma conta Expo configurada. Se voltar a usar APK,
forneça `EXPO_PUBLIC_API_URL`, `ANDROID_APPLICATION_ID`, `EAS_PROJECT_ID` e
`EAS_UPDATE_URL` pelo ambiente privado/EAS. `app.config.ts` lê esses valores e
nenhum projeto ou endpoint EAS está fixado no `app.json`.
As atualizações nativas ficam desativadas quando não há um endpoint configurado.
As configurações públicas necessárias à execução nativa aparecem no aplicativo
compilado; credenciais de banco e tokens privados nunca devem ser usados nelas.

## Layout web adaptável

`ResponsiveProvider` usa `useWindowDimensions` para acompanhar redimensionamentos
e `useSyncExternalStore` para ler a identificação do navegador sem divergência de
hidratação no export estático. Celulares Android/iOS, tablets e iPads com user
agent de Mac e suporte a toque recebem o layout mobile por padrão. Computadores
com tela touch não são classificados como tablets só por terem toque.

`responsive-layout.ts` centraliza os breakpoints: menu lateral a partir de 900px,
barra compacta abaixo de 1280px e navegação superior em janelas menores. As
colunas dependem do espaço disponível depois do menu e do padding, com limite
de 1240px para o conteúdo desktop e 760px para mobile/tablet.

`desktop-shell.web.tsx` contém os elementos web de navegação, estilos de hover e
foco para teclado. O arquivo sem sufixo é o fallback nativo. A estrutura que
contém o navegador de rotas não é remontada ao redimensionar a janela, preservando
formulários e a rota atual. Não há controle manual, armazenamento de preferência
ou leitura de preferências antigas. A seleção de versão é exclusiva do navegador.

Valide com lint, TypeScript, `node --test tests/responsive-layout.test.mjs` e
`npm run build:pwa`. Para a inspeção visual, teste desktop de 1920/1280/1024/800px,
mobile de 390px e tablet em orientação horizontal, conferindo navegação, listas,
rolagem e formulários. Teste também a opção de versão para computador do navegador:
o modo desktop é utilizado quando ele informa uma identificação de desktop.
A identificação pelo navegador é uma heurística; o site não consegue distinguir
modos para os quais o navegador envia a mesma identificação.

## Revisão antes de enviar ao GitHub

Verifique `git diff` e confirme que arquivos privados continuam ignorados.
A remoção de um valor nos arquivos atuais não remove commits antigos.
Informações já publicadas precisam de tratamento separado no histórico;
credenciais expostas também precisam ser substituídas no provedor.

A revisão automática `python scripts/check_private_config.py` rejeita arquivos
privados, endpoints de implantação e credenciais fixas antes de publicar.
O workflow do GitHub repete essa revisão e usa Gitleaks com saída redigida.
