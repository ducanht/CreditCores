# CBI INTELLIGENCE & SECURITY RULES

## Before Code Changes
Use CBI-MCP for:
- Symbol resolution (`cbi_symbol`, `cbi_search`)
- Caller/callee analysis (`cbi_callers`, `cbi_callees`)
- Dependency analysis (`cbi_dependencies`)
- Architecture analysis (`cbi_architecture`, `cbi_architecture_guard`)
- Impact & change risk analysis (`cbi_impact`, `cbi_change_risk`)
- Security impact analysis (`cbi_security_impact`, `cbi_security_auth`)

## Context Discipline
Do NOT read the entire repository when targeted graph context is available.
Use:
- `cbi_context_packet`
- `cbi_hybrid_search`
- `cbi_impact`
- `cbi_security_impact`

## Security Guidelines
Before changing:
- Authentication (`login`, `token`, `session`, `password`)
- Authorization & Roles (`role`, `permission`, `canBo`, `bks`, `hdqt`)
- Financial transactions & funds (`disburse`, `debit`, `salary`, `interest`)
- API endpoints (`doGet`, `doPost`, `fetch`)
- Database queries & Google Sheet updates

Perform security impact analysis and ensure `LockService` atomicity concurrency locks.

## After Changes
Run:
1. Build check (`npm run build`)
2. Tests verification (`npm test` / live tests)
3. CBI incremental index (`cbi index`)
4. Security validation (`cbi security scan`)
