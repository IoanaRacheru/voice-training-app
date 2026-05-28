# edition = "2024" + resolver = "3" require >= 1.85; time 0.3.47 dep requires >= 1.88
FROM rust:1.88-bookworm AS builder
ARG API_FEATURES=""

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkgconf \
    libssl-dev \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests so cargo can cache dependencies as a layer
COPY Cargo.toml Cargo.lock* ./
COPY api/Cargo.toml api/Cargo.toml
COPY app_core/Cargo.toml app_core/Cargo.toml
COPY desktop/Cargo.toml desktop/Cargo.toml
COPY web/Cargo.toml web/Cargo.toml

# Stub sources for every workspace member so `cargo build -p api` can resolve
RUN mkdir -p api/src app_core/src desktop/src web/src && \
    printf 'fn main(){}' | tee \
        api/src/main.rs \
        desktop/src/main.rs \
        web/src/main.rs > /dev/null
RUN printf 'pub fn _stub() {}' > app_core/src/lib.rs

# Build deps only (stubs compile but produce nothing useful)
RUN cargo build -p api ${API_FEATURES}

# Replace stubs with real source and rebuild only the api crate
RUN rm api/src/main.rs
COPY api/src api/src
RUN rm app_core/src/lib.rs
COPY app_core/src app_core/src
RUN touch api/src/main.rs app_core/src/lib.rs && cargo build -p api ${API_FEATURES}

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --uid 1001 --gid appgroup appuser

WORKDIR /app

COPY --from=builder /app/target/debug/api ./api

USER appuser

EXPOSE 3000

CMD ["./api"]
