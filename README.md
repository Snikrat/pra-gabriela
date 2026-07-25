# pra gabriela 🤍

> um envelope, uma carta, e um potinho cheio de post-its — feito com carinho pra ter sempre um lembrete de que tem alguém do seu lado.

---

## o que é isso

**pra gabriela** é um app pessoal (PWA) pra duas pessoas só. Você abre um envelope, encontra uma cartinha, e do outro lado um quadro de post-its que vocês dois escrevem um pro outro — cada um começa "trancado" (borrado) até quem recebe tocar pra revelar. Post-its viram memórias guardadas no **potinho** depois de 24h, buscáveis por palavra, mês ou por quem escreveu.

### ✨ funcionalidades

- 💌 **envelope animado** — abre com uma cartinha antes de entrar no quadro do dia
- 📌 **post-its revelados por toque** — cada um só destrava quando a pessoa clica, com uma chuva de partículas de brinde
- 🫙 **potinho de memórias** — arquivo pesquisável de todos os dias, com filtro por mês e por autor
- ✏️ **editar e apagar** — só o autor, e só na primeira hora depois de escrever
- 💬 **respostas** — cada post-it vira uma mini conversa
- 🎵 **link do spotify** — cola uma música junto do recado
- 🔄 **tempo real** — o que um escreve, revela ou responde aparece pro outro na hora, sem precisar dar refresh
- 🔒 **só vocês dois** — login com Google, restrito a uma allowlist de e-mails
- 📱 **PWA instalável** — funciona offline como app, com ícone na tela inicial

---

## 🛠️ tecnologias

| | |
|---|---|
| **React 18** | interface |
| **Vite** | build e dev server |
| **Tailwind CSS** | estilo |
| **Firebase** (Auth + Firestore) | login com Google e banco em tempo real |

O código anterior (vanilla JS + CSS puro) fica preservado em [`legacy-vanilla/`](./legacy-vanilla) como referência histórica.

---

## 🚀 rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Pra gerar o build de produção:

```bash
npm run build
```

Os arquivos finais saem em `dist/`.

---

## 📁 estrutura

```
src/
├── components/     # cada tela/modal em seu próprio componente
├── hooks/          # useAuth, useTodayNotes (tempo real), useConfirm
├── lib/            # firebase, regras de negócio, helpers de data/fuso
├── App.jsx         # orquestra tudo
└── main.jsx        # ponto de entrada
```

Regras do Firestore em [`firestore.rules`](./firestore.rules) — só os e-mails da allowlist conseguem ler/escrever.

---

<p align="center">feito com carinho 🤍</p>
