# Execução nativa opcional

A distribuição atual usa o site/PWA. Nenhuma conta Expo ou endpoint nativo é
necessário para publicar o Docker web.

Se voltar a gerar APK, configure no ambiente privado:
- `EXPO_PUBLIC_API_URL`
- `ANDROID_APPLICATION_ID`
- `EAS_PROJECT_ID`
- `EAS_UPDATE_URL`, se desejar updates nativos

Esses valores são lidos por `app.config.ts`; `eas.json` não contém endereços.
Nunca coloque credenciais do banco ou tokens privados em `EXPO_PUBLIC_*`.
Execute lint, TypeScript e `npm run build:apk`. Preserve o identificador Android
e a chave de assinatura existentes, configurados fora do controle de versão.
A publicação de updates usa o ambiente privado `production` do EAS.
