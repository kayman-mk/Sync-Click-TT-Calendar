# AGENTS.md - AI Coding Agent Guide

## Project Overview
**Sync-Click-TT-Calendar** is a TypeScript/Node.js CLI tool that synchronizes table tennis tournament appointments from Click-TT (German sports scheduling portal) to CalDAV calendars. It parses CSV exports or web pages, transforms appointment data, and syncs via WebDAV.

**Key Tech Stack**: TypeScript, InversifyJS (DI), Jest, Axios, TsDav (CalDAV), Js-Joda (date handling), Winston (logging)

## Architecture Patterns

### Dependency Injection via InversifyJS
All services use **InversifyJS decorators** (`@injectable`, `@inject`). The container is centralized in `src/adapter/CdiContainer.ts`:
- Services are registered in `CdiContainer.startContainer()` using symbols from `src/dependency_injection.ts`
- Configuration values (calendar credentials, URLs) are injected as constants
- **Always inject dependencies rather than instantiating directly**

Example pattern:
```typescript
@injectable()
export class MyService {
    constructor(
        @inject(SERVICE_IDENTIFIER.SomeService) readonly someService: SomeService,
        @inject(CONFIGURATION.SomeConfig) readonly configValue: string
    ) {}
}
```

### Layered Hexagonal Architecture
1. **Domain Layer** (`src/domain/`): Interfaces, pure models (Appointment, Team, Club, SportsHall, TeamLead)
2. **Application Layer** (`src/application/`): Business logic orchestration (SyncCalendarApplicationService)
3. **Adapter Layer** (`src/adapter/`): Implementations of domain services + external integrations
   - `repository/`: Data access (file-based: sports halls, team leads)
   - `service/`: External service implementations (CSV parsing, CalDAV, HTTP, file storage, logging)
   - `endpoint/`: CLI entry point (CommandLineInterface)

**Key principle**: Domain services define contracts; adapters implement them. Business logic never depends on concrete implementations.

### Critical Data Flow
1. **Input**: CSV file (Click-TT export) or web page (myTischtennis.de) via yargs CLI args
2. **Parsing**: `ClickTtCsvFileAppointmentParserServiceImpl` transforms raw data → Appointment objects
3. **Enrichment**: Sports halls & team leads loaded from `sports_halls.json` & `team_leads.json`
4. **Sync**: `CalDavCalendarServiceImpl` compares local calendar with new appointments, performs CRUD
5. **Output**: Updated CalDAV calendar via `TsDav` library

## Testing Conventions

### File Naming & Organization
- **Unit Tests**: `**/*.spec.ts` (focused on single module)
- **Integration Tests**: `**/*.infra.spec.ts` (test external integrations like Winston transports)
- Tests live in parallel structure under `tests/` matching `src/` structure

### Test Structure Pattern (`should_when_then` format)
```typescript
describe('ModuleName', () => {
    let service: ServiceType;
    let mockDependency: MockType;

    beforeEach(() => {
        mockDependency = new MockType();
        service = new ServiceType(mockDependency);
    });

    it('should_do_something_when_condition_is_met', () => {
        // given: setup preconditions
        const input = {...};

        // when: execute
        const result = service.doSomething(input);

        // then: verify
        expect(result).toBe(expectedValue);
    });
});
```

### Mock Pattern
Create custom mock transports/implementations that implement the interface. Winston transports are mocked via custom Transport subclasses (see `Logger.spec.ts` for MockTransport pattern). **Never use Mockito** - use plain TypeScript mocks or stubs.

### jest.setup.ts Cleanup
The setup file (`tests/jest.setup.ts`) removes Winston logger listeners after each test to prevent memory leaks. This is critical—ensure listeners added in tests are cleaned up.

## Critical Files & Their Responsibilities

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point; loads dotenv, instantiates CLI |
| `src/dependency_injection.ts` | Symbol definitions for all injectable services |
| `src/adapter/CdiContainer.ts` | IoC container setup; service registration |
| `src/application/SyncCalendarApplicationService.ts` | Core sync logic (main business algorithm) |
| `src/domain/model/Appointment.ts` | Appointment entity with Click-TT category tracking |
| `src/adapter/endpoint/CommandLineInterface.ts` | yargs CLI argument parsing |
| `src/adapter/service/ClickTtCsvFileAppointmentParserServiceImpl.ts` | CSV→Appointment transformation |
| `src/adapter/service/CalDavCalendarServiceImpl.ts` | CalDAV sync (uses TsDav) |
| `sports_halls.json` | Cached sports hall metadata (name, location, ID) |
| `team_leads.json` | Team lead contact info |

## Development Workflow

### Build & Test
```bash
npm run build           # TypeScript → target/src/
npm test               # Jest with coverage → target/coverage/
npm start              # Run with CLI args (requires NODE_PATH or full path)
```

### CLI Usage Pattern
Entry via `CommandLineInterface`: accepts `-f` (CSV file) OR `-u` (myTischtennis.de URL), `-c` (CalDAV URL). Configuration injected from env vars (`CALENDAR_USERNAME`, `CALENDAR_PASSWORD`) via dotenv.

### Date Handling
**Use `@js-joda/core` & `@js-joda/timezone`**, not native JS Date. All appointments use `LocalDateTime` with timezone handling.

## Edge Cases & Gotchas

1. **CSV Parsing**: Click-TT format uses specific column order; myTischtennis.de requires HTML table parsing (see commented axios call in `SyncCalendarApplicationService.syncCalendarFromMyTischtennisWebpage`—currently uses `spielplan.html` file)
2. **Appointment Matching**: ID field MUST match exactly for `isSameAs()` comparison; used to detect changes
3. **Click-TT Category**: All synced appointments tagged with `Appointment.CLICK_TT_CATEGORY` to enable filtering on updates
4. **Team Name Cleanup**: `Team.getClubName()` strips Roman numerals & age class suffixes (e.g., "SC Team V (wJ13)" → "SC Team")
5. **Sports Halls Caching**: Loaded from JSON file; fetched from external service and cached to avoid redundant HTTP calls
6. **Env Vars Required**: `CALENDAR_USERNAME` & `CALENDAR_PASSWORD` must be set (via `.env` or inline); missing values cause container binding failures

## Adding New Features

### New Service Implementation
1. Define interface in `src/domain/service/XyzService.ts`
2. Implement in `src/adapter/service/XyzServiceImpl.ts` with `@injectable`
3. Register in `CdiContainer.startContainer()` binding interface → impl
4. Add symbol to `SERVICE_IDENTIFIER` in `dependency_injection.ts`
5. Inject in dependents with `@inject(SERVICE_IDENTIFIER.XyzService)`

### New Model
Add to `src/domain/model/` (e.g., `MyModel.ts`). Consider immutability and domain validation logic in constructor.

### New Repository (Data Access)
1. Define interface in `src/domain/service/XyzRepository.ts`
2. Implement file/network-based variant in `src/adapter/repository/XyzRepositoryImpl.ts`
3. Register in CdiContainer (may use factory pattern if caching needed; see `SportsHallRepository` example with `toDynamicValue`)

## Common Patterns to Maintain

- **No circular dependencies**: Domain → no adapter imports; adapters depend on domain interfaces
- **Configuration as symbols**: All config values are constants injected via symbols, never hardcoded
- **Logging at integration points**: Use `Logger` for HTTP calls, file I/O, sync operations
- **Error messages**: Include context (e.g., calendar URL, team name) in error messages for debugging
- **Immutable models**: Appointment, Team, Club, etc. use getter properties; no mutation after construction

