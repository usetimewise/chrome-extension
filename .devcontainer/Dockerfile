FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

ARG REMBG_VERSION=2.0.76

RUN apt-get update \
    && apt-get install --yes --no-install-recommends python3-venv \
    && python3 -m venv /opt/rembg \
    && /opt/rembg/bin/pip install --no-cache-dir "rembg[cpu,cli]==${REMBG_VERSION}" \
    && ln --symbolic /opt/rembg/bin/rembg /usr/local/bin/rembg \
    && rm -rf /var/lib/apt/lists/*
