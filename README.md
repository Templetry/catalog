# Templetry default catalog

The official template registry for [Templetry](https://github.com/Templetry). `registry.json` (schema v2) lists every **parent** and its **forms**; the CLI, the desktop app and the MCP server all read it.

## The model ([ADR-0011](https://github.com/Templetry/wiki/blob/main/adr/0011-template-forms.md), [ADR-0014](https://github.com/Templetry/wiki/blob/main/adr/0014-lazy-pieces.md))

- **Parent** = one repo per concept (`web`, `go`, `python`…).
- **Form** = a structural variant living as a subdirectory of the parent. Each form compiles on its own and carries its own `template.yml`. Forms are *chosen*, not combined.
- **Feature** = the freely combinable axis inside a form, resolved at render time (with `requires`/`conflicts` and named `presets`).
- **Piece** = a decoupled unit adopted *after* creation, with its own variables and update cycle.

Golden rule: **additive → feature · structural → form · independent lifecycle → piece.**

## Parents and forms

Every form is CI-verified: its parent's workflow renders it and builds the output with the real toolchain on every push. `status: ready` is gated on green CI.

| Parent | Forms | Pieces |
|---|---|---|
| [kmp](https://github.com/Templetry/kmp) | `modular-features` · `single-module` · `modular-ui` | — |
| [android](https://github.com/Templetry/android) | `modular-features` · `single-module` | — |
| [web](https://github.com/Templetry/web) | `react-spa` · `vue-spa` · `nextjs` · `svelte-spa` | `axios-api`, `zustand-store`, `pinia-store`, `zod-env` |
| [go](https://github.com/Templetry/go) | `cli` · `http-service` · `rest-sqlite` | `version-endpoint`, `crud-resource` |
| [python](https://github.com/Templetry/python) | `fastapi-service` · `cli-typer` · `fastapi-users` | `rbac`, `api-keys`, `audit-trail`, `soft-delete`, `verifactu`, `crud-resource` |
| [rust](https://github.com/Templetry/rust) | `cli` · `axum-service` | — |
| [node](https://github.com/Templetry/node) | `express-api` · `fastify-api` · `nestjs` | — |
| [jvm](https://github.com/Templetry/jvm) | `spring-boot` · `ktor` | — |
| [dotnet](https://github.com/Templetry/dotnet) | `minimal-api` · `razor-web` | — |
| [meta](https://github.com/Templetry/meta) | `template` — creates new Templetry templates (start your own catalog here) | — |

## Using a form

```sh
templetry list
templetry init python/fastapi-users --out ./my-api --set "project_name=My Api"

# later, adopt decoupled pieces
templetry pieces ./my-api
templetry add rbac ./my-api
templetry add crud-resource ./my-api --set entity=Product

# and pull template improvements
templetry update ./my-api --apply
```

`--registry <url|file>` points `list`/`init` at an alternative catalog, and `--preset <name>` picks a named feature combo.

## Registry format

`registry.json` is public API, versioned with `schema_version` (currently 2). Parents carry `key`, `label`, `repo`, `ref`, an optional `source` (forge scheme: `gitlab:host/group/proj`, `gitea:host/owner/repo`; empty means GitHub) and `forms`. Each form carries `form`, `name` (matching its manifest), `path`, `status` (`ready` | `planned`) and `description`.

## Contributing a form

A form is a subdirectory that compiles on its own with a valid [`template.yml`](https://github.com/Templetry/wiki/blob/main/spec/template-yml.md), an `AGENTS.md` operating contract, and a job in its parent's Verify workflow. Pieces live in `_pieces/<name>/` (or `pieces/`) with a [`piece.yml`](https://github.com/Templetry/wiki/blob/main/spec/piece-yml.md).

Start from [`meta/template`](https://github.com/Templetry/meta), which scaffolds a template with its manifest, author guide and verify CI already in place. Step by step: [authoring templates](https://github.com/Templetry/wiki/blob/main/guide/authoring-templates.md) and [authoring pieces](https://github.com/Templetry/wiki/blob/main/guide/authoring-pieces.md).
