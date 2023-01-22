# oras-pull-web

[ORAS](https://oras.land) pull for [ghcr.io](https://ghcr.io)

Requires a modern web browsers.

No features, minimal implementation for simplest scenario.

## Usage

Before runnig `npm serve`, you need to visit
https://cors-anywhere.herokuapp.com/ and enable temporary access. We cannot
access GitHub without this (or another) CORS proxy.

```
git clone https://github.com/mikaello/oras-pull-web.git
cd oras-pull-web
export GITHUB_TOKEN=<PAT>
npm install
npm build
npm serve
```

Open browser at `localhost:8080` and check results in console.

Currently hard coded to pull ghcr.io/larshp/oras-test/oras-test:latest
