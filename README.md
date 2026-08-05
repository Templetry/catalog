# Templetry default catalog

The official template registry for [Templetry](https://github.com/Templetry). `registry.json` (schema v2) lists every **parent** and its **forms**; the engine and the future web app read it to offer the catalog.

## The model ([ADR-0011](https://github.com/Templetry/wiki/blob/main/adr/0011-template-forms.md))

- **Parent** = one repo per concept (`kmp`, `android`).
- **Form** = one structural variant, living as a subdirectory of the parent repo. Each form compiles on its own and carries its own `template.yml`. Forms are *chosen*, not combined.
- **Features** = the freely combinable axis inside a form (platform targets, capabilities), declared in the form's manifest.

## Parents

| Parent | Forms |
|---|---|
| [kmp](https://github.com/Templetry/kmp) | `modular-features` ✅ · `single-module` ✅ · `modular-ui` 🏗️ planned |
| [android](https://github.com/Templetry/android) | `modular-features` ✅ · `single-module` 🏗️ planned |
| [meta](https://github.com/Templetry/meta) | `template` ✅ — creates new Templetry templates (start your own catalog here) |

## Using a form

One command — the [CLI](https://github.com/Templetry/engine/releases) (v0.2.0+) reads this registry, fetches the form and renders it:

```sh
templetry list
templetry init kmp/single-module --out ./my-app \
  --set "project_name=My App" --set "base_package=com.me.myapp" \
  --feature web=false
```

`templetry render --template <local-dir>` still works for local checkouts, and `--registry <url|file>` points `init`/`list` at an alternative catalog.

## Registry format

`registry.json` is public API, versioned with `schema_version`. Parents carry `key`, `label`, `repo`, `ref` and `forms`; each form carries `form`, `name` (matches its manifest), `path` (subdirectory), `status` (`ready` | `planned`) and `description`.

## Contributing a form

A form is a subdirectory that compiles on its own with a valid [`template.yml`](https://github.com/Templetry/wiki/blob/main/spec/template-yml.md). Golden rule: additive variation (add/remove files) belongs in an existing form as a **feature**; only structural variation (same code, different layout) justifies a new form.
