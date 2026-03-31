---
description: Guia de Build iOS em Ambiente Windows (Capacitor + GitHub Actions)
---

Este documento detalha o fluxo operacional para gerar e testar a versão iOS do app utilizando a infraestrutura de nuvem do GitHub, contornando a ausência de hardware macOS local.

---

## 🛠️ Ferramentas Necessárias

1.  **Conta no GitHub:** Onde o código está hospedado.
2.  **Sideloadly (Windows):** Utilitário para instalar o app no iPhone via USB ([Download aqui](https://sideloadly.io/)).
3.  **Apple ID:** Uma conta iCloud ativa para assinar o app temporariamente.

---

## 🚀 1. Configuração do Workflow (GitHub Actions)

O agente deve garantir que exista o arquivo `.github/workflows/ios-build.yml` com o seguinte conteúdo para automatizar a compilação:

```yaml
name: Build iOS (Debug)

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  build_ios:
    runs-on: macos-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Dependencies
        run: npm install

      - name: Build Web Project
        run: npm run build # Garanta que este comando gera a pasta definida no capacitor.config.ts

      - name: Capacitor Sync
        run: |
          npm install @capacitor/ios
          npx cap add ios
          npx cap sync ios

      - name: Xcode Build (Debug Simulator/Testing)
        run: |
          xcodebuild -workspace ios/App/App.xcworkspace \
                     -scheme App \
                     -configuration Debug \
                     -sdk iphonesimulator \
                     clean build

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ios-debug-app
          path: ~/Library/Developer/Xcode/DerivedData/**/Build/Products/Debug-iphonesimulator/*.app
```
