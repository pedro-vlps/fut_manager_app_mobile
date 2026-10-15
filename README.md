# Fut Manager · App

**English** | [Português (Brasil)](README.pt-BR.md) | [Development guide](https://github.com/pedro-vlps/fut_manager_app_mobile?tab=contributing-ov-file)

<img src="assets/images/fut-manager-icon.png" alt="Fut Manager" width="128" />

Fut Manager is a personal project that brings amateur football organization from group chats into an app: gathering players, building teams, following matches, and keeping a record of tournament achievements.

The experience was built for use on the pitch and has already been tested in a real tournament. The project is evolving toward an MVP, with improvements based on that experience.

## Engineering decisions and code to explore

Developed by **[Pedro Vieira](https://github.com/pedro-vlps)** as an end-to-end portfolio project, connecting product requirements, cross-platform UI, typed API integration, testing, and delivery. These implementation details demonstrate frontend and mobile engineering:

| Challenge | Implementation | Code / evidence |
| --- | --- | --- |
| Prevent stale responses from replacing current data | Resource hooks associate results with the route and session token and invalidate outdated requests with a generation counter | [useApiResource](src/hooks/use-api-resource.ts) |
| Avoid duplicate submissions | A synchronous ref lock guards mutations, with busy/error state and handling of expired sessions | [useMutation](src/hooks/use-mutation.ts) |
| Keep API integration consistent | A shared typed request function applies bearer authentication, a 15-second timeout, HTTP error mapping, and support for empty responses | [API client](src/services/api.ts) |
| Share one application across screen sizes | Expo Router and shared components serve native mobile and responsive web layouts; browser detection and breakpoints have unit tests | [Layouts](src/contexts/responsive.tsx), [responsive rules](src/services/responsive-layout.ts), [tests](tests/responsive-layout.test.mjs) |
| Handle dates and input rules predictably | Pure TypeScript helpers implement event time zones and Unicode-aware password validation | [Date tests](tests/event-time.test.mjs), [password tests](tests/password-policy.test.mjs) |
| Deliver a reproducible web build | The Docker build exports the PWA; Caddy serves static assets and proxies same-origin `/api` requests to the backend | [Dockerfile](Dockerfile), [Caddyfile](Caddyfile), [PWA build](scripts/build-pwa.cjs) |

**Current tradeoffs:** distribution focuses on web/PWA; native builds are configured separately. Automated tests currently cover pure domain utilities, not end-to-end screen interactions. TypeScript checks static contracts; server responses still require server-side validation. Permissions and final competition decisions are enforced by the API.

## A complete experience for players and organizers

| For players | For organizers |
| --- | --- |
| Join groups and teams by invitation | Approve join requests and manage squads |
| Confirm attendance as an outfield player or goalkeeper | Configure capacity and waiting lists |
| Follow matches and statistics | Build and balance teams |
| Browse rankings and trophies | Record match reports, results, and penalties |
| Follow tournaments without entering | Create competitions and draw groups |

## Tournaments and teams

The app offers **leagues, group stages + knockout rounds, single elimination, and Cascade brackets**. Each edition has a menu for registration, teams, matches, results, standings, rankings, and trophies.

- **Flexible leagues:** any number of teams starting from two, with a single round robin or home-and-away matches and byes for odd numbers.
- **Group draws:** random assignment alongside manual adjustments before match records are entered.
- **Starting goalkeepers:** predefined by the team and filled in automatically for each fixture. Organizers confirm substitutions during a match; conceded goals are tracked for each goalkeeper.
- **Walkovers:** a 3–0 win for the team that attends, without assigning goals to players.
- **Penalties:** points deductions or disqualification from the edition, with a recorded reason and a review step before confirmation.
- **Compact match reports:** repeated events are grouped, such as `2x Goals · Player`, while still allowing one occurrence to be removed during the match.
- **Trophy rooms:** teams keep their tournament titles, and collective awards are displayed under the team's name in each edition.
- **Individual awards:** one winner for top scorer, assists, and best goalkeeper, with team placement breaking ties.
- **Tournament feed:** matches, results, and statistics available to any authenticated user, even without registering a team.

## Pickup games and seasons

Groups support members, guest players, recurring events, attendance confirmation, waiting lists, team selection, a match timer, and records of goals, assists, and cards. Rankings and seasons preserve historical results; player profiles bring together preferred positions and achievements.

Administrators can configure team draws to consider positions, ratings, and performance. Invitation codes remain private and can be regenerated by the person responsible.

## Technology

**Expo SDK 57 · React Native · React 19 · TypeScript · Expo Router**

One codebase supports Android, iOS, and the web. Current distribution focuses on **web/PWA**, with configuration for native builds. Shared components provide the same match report and ranking experience across pickup games and tournaments.

The app consumes the **Fut Manager API**, a companion project built with Python/FastAPI and PostgreSQL. The API enforces permissions and competition rules and protects stored personal data.

```mermaid
flowchart LR
    Screens[Expo Router screens] --> Components[Shared components]
    Screens --> Hooks[Resources and mutations]
    Hooks --> API[Fut Manager API]
    API --> DB[(PostgreSQL)]
```

## Run locally

1. Install a Node.js version compatible with SDK 57 and install dependencies with `npm ci`.
2. Configure `EXPO_PUBLIC_API_URL` in a private `.env.local`, following `.env.example`.
3. Start the companion API with its migrations up to date.
4. Run:

```powershell
npm start
```

For the web version, run `npm run web`. Generate the PWA with `npm run build:pwa`. Native build instructions are in [BUILD_ANDROID.md](BUILD_ANDROID.md) (Portuguese).

Variables beginning with `EXPO_PUBLIC_*` are public in the bundle: use them only for client configuration, never for database credentials or encryption keys.

## Responsive web delivery

The same PWA serves phones, tablets, and desktop browsers. Phones and tablets keep the mobile interface, while desktop browsers get a sidebar and multi-column lists that adapt to the window width. Layout selection follows the browser identification; requesting the desktop site uses the browser's own setting. Native builds keep the mobile layout.

Desktop and mobile web share the same API, permissions, and deployment. Rebuild with `npm run build:pwa`; the existing hosting flow serves `dist`.

## Quality and structure

```powershell
npm run lint -- --no-cache
npm run typecheck
npm test
```

- `src/app`: screens and navigation.
- `src/components`: tournament, match, ranking, and form components.
- `src/hooks`: resource loading and mutations.
- `src/services`: API contracts and utilities.
- `src/contexts`: authentication and session state.
- `public`: PWA resources.

## Continuous integration and Railway

Both repositories are deployed on Railway, with automatic redeployment from `main`. GitHub Actions runs on **every push and pull request**, and can also be started manually.

The [app workflow](.github/workflows/tests.yml) uses Node 22.22.0 and `npm ci`, then runs `npm test`, lint, TypeScript checking, and the production PWA build. The unit suite covers dates/time zones, password policy, and responsive layout; it does not need a live backend.

The existing private-configuration and secret-history checks also remain enabled.

**Required Railway setting:** workflows alone do not block the existing automatic deployment. In **each service**, open **Settings → Source → Wait for CI** and enable it, keeping `main` as the deployment branch. After publishing the workflow, accept any pending Railway GitHub App permission update if the option is unavailable. This is a service setting, not a `railway.json` property.

With **Wait for CI enabled**, Railway waits for the commit's GitHub Actions workflows; a failed workflow skips that deployment. Push runs are not automatically cancelled by these workflows. Confirm the integration on the next `main` push: the deployment should wait for CI, proceed after successful checks, and be skipped when a workflow fails. **Until that setting is enabled, automatic deployment is not protected by these tests.** See [Railway's autodeploy documentation](https://docs.railway.com/deployments/github-autodeploys).

## More about the project

- [Changes following tournament testing (Portuguese)](Feedback.md)
- [Previous technical documentation (Portuguese)](docs/DEVELOPMENT.md)
- [Android builds (Portuguese)](BUILD_ANDROID.md)

Developed by **Pedro Vieira** as a personal portfolio project.
