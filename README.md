# Templetry default catalog

The official template registry for [Templetry](https://github.com/Templetry). `registry.json` lists every default template; the engine and the future web app read it to offer the catalog.

## Templates

| Name | Platform | What you get |
|---|---|---|
| [kmp-native-base](https://github.com/Templetry/kmp-native-base) | Multiplatform (Android + Desktop + iOS) | Modular clean architecture, convention plugins, CI, AI context docs |
| [android-native-base](https://github.com/Templetry/android-native-base) | Android | Modular clean architecture, convention plugins, Compose |
| [compose-multiplatform-app](https://github.com/Templetry/compose-multiplatform-app) | Multiplatform (+ Web) | Compose Multiplatform single-codebase app |

## Using a template today

Remote fetching lands with engine Phase 2. Until then:

```sh
git clone https://github.com/Templetry/kmp-native-base
templetry render --template ./kmp-native-base --out ./my-app \
  --set "project_name=My App" --set "base_package=com.me.myapp"
```

Every template is also a GitHub *template repository*, so "Use this template" works as a dumb-copy fallback (no variables applied).

## Registry format

`registry.json` is public API, versioned with `schema_version`. Each entry: `name` (matches the template's manifest), `repo`, `ref`, catalog tags (`platform`, `framework`) and `description`.

## Contributing a template

A template is any repo with a valid [`template.yml`](https://github.com/Templetry/wiki/blob/main/spec/template-yml.md) that compiles on its own. Adapt it, verify `templetry render` leaves zero identity leftovers, and open a PR adding it to `registry.json`.
