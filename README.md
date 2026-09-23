# Fut Manager Mobile

## Login e grupos

A tela inicial solicita e-mail e senha de um perfil já cadastrado na API.
Após o login, a home lista os grupos criados pelo usuário e aqueles em que ele
é membro ativo, com busca, atualização ao puxar a lista e opção de sair.
Perfis legados com senha `RESET_REQUIRED` precisam ter uma senha definida na API.

Inicie a API na porta 8000 (`docker compose up --build` no projeto da API).
O mobile usa `ENDERECO_PRIVADO` no emulador Android e
`ENDERECO_PRIVADO` na web/iOS Simulator. Para celular físico ou outra API,
copie `.env.example` para `.env` e configure `EXPO_PUBLIC_API_URL` com o IP
do computador na rede local. Recarregue o app após mudar essa variável.

Execute `npm run android` ou `npm run web`. A sessão fica em memória:
fechar/recarregar completamente o aplicativo exige novo login. Senhas não são
persistidas. Sessões expiradas retornam à tela de login.

Verificação: `npm run lint` e `npx tsc --noEmit`.

## Área do grupo

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
