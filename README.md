# Reverse Turing

[**Play in your browser**](https://reverse-turing.pages.dev/) · [简体中文](README.zh-CN.md) · [Run locally or deploy](docs/deploy.md)

A small browser game about sounding like a machine. Read an anonymous answer, then decide whether a human or an AI wrote it. Or answer a prompt yourself and see how strangers vote.

- **Guess:** Read an answer and vote. Then see how others voted and what the author said about its source.
- **Write:** Answer a random prompt, or paste an AI-generated answer. Label its source and post anonymously to the public pool.
- **Check back:** See your votes under **My answers** in the same browser, or use a saved private management link from another device. That link also lets you withdraw the answer.

There are no accounts, points, or leaderboards. Choose English or Simplified Chinese; each has its own pool, and answers stay in the language in which they were written.

## About the results

Starter examples are AI-generated and labeled as such after voting. Community authors label their own submissions. This is a guessing game, not an AI detector.

The site doesn’t ask for a name, email, or phone number. A random browser cookie helps prevent a browser from voting twice; it does not verify anyone’s identity. Answers are public, so leave out personal information. Keep your private management link to yourself.

## Development

The interface uses plain HTML, CSS, and JavaScript. A Cloudflare Pages Worker serves the interface and API; D1 stores answers and votes. The app doesn’t call a model and requires no AI API key.

Use Node.js 24 or newer:

```sh
npm test
npm run build
```

The tests exercise voting across multiple visitor sessions, language-specific pools, and private management links. The build creates `dist-pages/`. See the [deployment guide](docs/deploy.md) for local D1 setup and self-hosting.
