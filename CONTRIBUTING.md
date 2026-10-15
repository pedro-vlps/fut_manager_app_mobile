# Desenvolvimento e contribuições · Fut Manager App

[Apresentação do projeto](https://github.com/pedro-vlps/fut_manager_app_mobile?tab=readme-ov-file) · [README em português](README.pt-BR.md)

Este guia descreve como preparar o ambiente, respeitar a arquitetura e validar alterações. O GitHub apresenta este arquivo na aba nativa **Contributing**, ao lado de **README**, na página principal do repositório.

## Preparar o ambiente

1. Instale Node.js compatível com o SDK 57 e as dependências com `npm ci`.
2. Configure `EXPO_PUBLIC_API_URL` em um `.env.local` privado, conforme `.env.example`.
3. Inicie a API complementar com as migrations atualizadas.
4. Execute:

```powershell
npm start
```

Para a versão web, execute `npm run web`. A geração da PWA usa `npm run build:pwa`. As instruções de build nativo estão em [BUILD_ANDROID.md](BUILD_ANDROID.md).

## Limites de responsabilidade

- Telas e layouts de navegação ficam em `src/app`, com Expo Router.
- Componentes, hooks e utilitários ficam fora da pasta de rotas.
- Preserve os contratos tipados do cliente em `src/services` e o tratamento centralizado de sessão expirada.
- Mantenha a invalidação de respostas antigas nos recursos e a proteção contra envios duplicados nas mutações.
- Valide mudanças de interface em celulares, tablets e desktop; builds nativos mantêm o layout mobile.
- Configurações `EXPO_PUBLIC_*` são públicas no bundle e não podem conter segredos.

## Validar uma alteração

```powershell
npm test
npm run lint -- --no-cache
npm run typecheck
npm run build:pwa
python scripts/check_private_config.py
```

Os testes unitários atuais verificam datas e fusos, senhas e regras de layout. O build valida a exportação da PWA; nenhum destes passos substitui a revisão dos fluxos de tela no navegador e nos dispositivos relevantes.

## Enviar uma contribuição

1. Descreva o problema e o comportamento esperado. Para correções, inclua os passos de reprodução.
2. Implemente a alteração seguindo os limites de responsabilidade descritos acima.
3. Atualize os testes relevantes quando o comportamento mudar e mantenha as versões inglesa e portuguesa da apresentação consistentes.
4. Execute as verificações locais e abra um pull request com a motivação, a mudança de comportamento e os resultados da validação.
5. Preserve credenciais, chaves, arquivos `.env` e dados reais fora dos commits e dos relatórios de teste.

## CI e publicação

O [workflow de validação](.github/workflows/tests.yml) executa em todo push e pull request. A [verificação de informações privadas](.github/workflows/private-config.yml) também continua ativa.

A produção usa deploy automático da branch `main` no Railway. Em cada serviço, **Settings → Source → Wait for CI** deve estar ativado para aguardar os workflows e impedir o deploy de commits cuja validação falhe. Criar o workflow, por si só, não ativa essa opção. Consulte a [documentação do Railway](https://docs.railway.com/deployments/github-autodeploys).
