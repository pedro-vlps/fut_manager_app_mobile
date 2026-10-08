# Gerar o APK do FutManager

Execute os comandos na pasta `fut_manager_app_mobile`.

## 1. Conectar sua conta Expo

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure --platform android
```

Permita vincular/criar o projeto na sua conta Expo. Preserve os perfis do
`eas.json`: `preview` gera APK instalável e `production` gera AAB para Google Play.
Quando solicitado, escolha um identificador Android exclusivo, por exemplo
`com.seunome.futmanager`. Ele ficará em `expo.android.package` no `app.json`.
Use o mesmo identificador e a mesma chave de assinatura nas atualizações.

## 2. Configurar o endereço da API

O `eas.json` já configura `EXPO_PUBLIC_API_URL` nos perfis `preview` e
`production` com `ENDERECO_PRIVADO`.
Não é necessário cadastrar novamente essa URL no painel do EAS.

O endereço é público e é incluído no APK durante a compilação. Ao trocá-lo,
atualize os dois perfis e gere outro APK. Não use o endereço local do emulador
para a versão distribuída.

## 3. Verificar e gerar

```powershell
npm run lint
npx tsc --noEmit
npm run build:apk
```

Na primeira compilação, aceite a geração de uma nova keystore pelo EAS, caso
este aplicativo ainda não tenha uma chave. Se já foi distribuído, reutilize a
chave existente. Aguarde a compilação no link mostrado pelo terminal.

## 4. Instalar

Abra o link do build no Android, baixe o `.apk` e permita a instalação pelo
navegador quando o sistema solicitar. O perfil `preview` funciona sem Expo Go
e sem um servidor Metro no computador. A API online precisa estar disponível.

## Google Play e iOS

`npm run build:android:store` gera AAB para Google Play com a mesma API online.
iPhone não instala APK: a distribuição iOS é feita por um build próprio e TestFlight.

O Android nativo não precisa de uma origem CORS. CORS se aplica ao frontend web.

Referência: https://docs.expo.dev/build-reference/apk/

