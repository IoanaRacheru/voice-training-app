# edition = "2024" + resolver = "3" require >= 1.85; time 0.3.47 dep requires >= 1.88
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
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
        app_core/src/main.rs \
        desktop/src/main.rs \
        web/src/main.rs > /dev/null

# Build deps only (stubs compile but produce nothing useful)
RUN cargo build --release -p api

# Replace stub with real source and rebuild only the api crate
RUN rm api/src/main.rs
COPY api/src api/src
RUN touch api/src/main.rs && cargo build --release -p api

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 1001 -s /bin/false appuser

WORKDIR /app

COPY --from=builder /app/target/release/api ./api

USER appuser

EXPOSE 3000

CMD ["./api"]
