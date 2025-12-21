DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'beekeeper') THEN
        CREATE DATABASE beekeeper;
    END IF;
END $$;

\c beekeeper

DO $$
DECLARE
    user_password text;
BEGIN
    user_password := current_setting('db_password', true);

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'beekeeper') THEN
        EXECUTE format('CREATE USER beekeeper WITH ENCRYPTED PASSWORD %L', user_password);
        EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE beekeeper TO beekeeper';
    END IF;
END $$;

-- Contexts
CREATE TABLE IF NOT EXISTS contexts (
    name TEXT PRIMARY KEY,
    cluster TEXT NOT NULL,
    authinfo TEXT NOT NULL,
    namespace TEXT
);

-- Namespace
CREATE TABLE IF NOT EXISTS namespaces (
    context TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    -- operational / degraded / down (ok - green, warning - orange, alert - red) 
    service_status TEXT NOT NULL,
    AGE TEXT NOT NULL,
    PRIMARY KEY (context, name)
);

-- Namespace notes
CREATE TABLE IF NOT EXISTS namespace_notes (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    namespace TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pods
CREATE TABLE IF NOT EXISTS pods (
    name TEXT NOT NULL,
    ready TEXT NOT NULL,
    status TEXT NOT NULL,
    restarts TEXT NOT NULL,
    age TEXT NOT NULL,
    context TEXT NOT NULL,
    namespace TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (context, namespace, name)
);

-- Global logs
CREATE TABLE IF NOT EXISTS global_log (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    event TEXT NOT NULL,
    status TEXT NOT NULL,
    command TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Local logs
CREATE TABLE IF NOT EXISTS local_log (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    name TEXT NOT NULL,
    namespace TEXT NOT NULL,
    event TEXT NOT NULL,
    command TEXT NOT NULL,
    app TEXT,
    pod TEXT,
    status TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Global commands
CREATE TABLE IF NOT EXISTS global_commands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    author TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Namespace specific commands
CREATE TABLE IF NOT EXISTS local_commands (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    name TEXT NOT NULL,
    namespace TEXT NOT NULL,
    command TEXT NOT NULL,
    author TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Namespace domains
CREATE TABLE IF NOT EXISTS namespace_domains (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    context TEXT NOT NULL,
    namespace TEXT NOT NULL,
    UNIQUE (context, namespace, url)
);

-- Namespace incidents
CREATE TABLE IF NOT EXISTS namespace_incidents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    context TEXT NOT NULL, 
    namespace TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Namespace ingress
CREATE TABLE IF NOT EXISTS namespace_ingress (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    namespace TEXT NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    hosts TEXT NOT NULL,
    address TEXT NOT NULL,
    ports TEXT NOT NULL,
    age TEXT NOT NULL,
    UNIQUE (context, namespace, name)
);

-- Namespace ingress events
CREATE TABLE IF NOT EXISTS namespace_ingress_events (
    id SERIAL PRIMARY KEY,
    context TEXT NOT NULL,
    namespace TEXT NOT NULL,
    name TEXT NOT NULL,
    events TEXT NOT NULL
);

-- Docker containers
CREATE TABLE IF NOT EXISTS containers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    container TEXT NOT NULL,
    rebuild BOOLEAN NOT NULL DEFAULT false
);


-- Traffic table
CREATE TABLE IF NOT EXISTS traffic (
    id SERIAL PRIMARY KEY,
    user_agent TEXT NOT NULL,
    domain TEXT NOT NULL,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    referer TEXT NOT NULL,
    request_time DOUBLE PRECISION NOT NULL,
    status INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status table
CREATE TABLE IF NOT EXISTS status (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fetch', 'post')),
    url TEXT,
    interval INTEGER NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    expected_down BOOLEAN NOT NULL DEFAULT FALSE,
    max_consecutive_failures INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    notified TIMESTAMPTZ,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS status_details (
    id INTEGER PRIMARY KEY REFERENCES status(id) ON DELETE CASCADE,
    expected_down BOOLEAN NOT NULL DEFAULT FALSE,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    delay INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status notifications table
CREATE TABLE IF NOT EXISTS status_notifications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    message TEXT,
    webhook TEXT NOT NULL
);

-- Status tags
CREATE TABLE IF NOT EXISTS status_tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
);

-- Loadbalancing
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT FALSE,
    operational BOOLEAN NOT NULL DEFAULT FALSE,
    added_by TEXT NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sites
CREATE UNIQUE INDEX primary_site ON sites ("primary") WHERE "primary" = TRUE;

-- Indexes for traffic
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_domain_trgm ON traffic (domain);
CREATE INDEX IF NOT EXISTS idx_traffic_path_trgm ON traffic (path);
CREATE INDEX IF NOT EXISTS idx_traffic_user_agent_trgm ON traffic (user_agent);
CREATE INDEX IF NOT EXISTS idx_traffic_status ON traffic (status);
CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic (method);
CREATE INDEX IF NOT EXISTS idx_traffic_domain_btree ON traffic (domain);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp_status ON traffic (timestamp DESC, status);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp_domain ON traffic (timestamp DESC, domain);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp_method ON traffic (timestamp DESC, method);

-- --- Local log optimizations ---

-- Heavy operations, more RAM required
SET maintenance_work_mem = '1GB';

-- Indexes to speed up local log refresh query
CREATE INDEX ON local_log (LOWER(namespace));
CREATE INDEX ON local_log (LOWER(context));

-- Index for namespace equality
CREATE INDEX IF NOT EXISTS idx_local_log_namespace ON local_log(namespace);

-- Trigram indexes for ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index on context
CREATE INDEX IF NOT EXISTS idx_local_log_context_trgm
ON local_log USING gin (context gin_trgm_ops);

-- Index on name
CREATE INDEX IF NOT EXISTS idx_local_log_name_trgm
ON local_log USING gin (name gin_trgm_ops);

-- Index on event
CREATE INDEX IF NOT EXISTS idx_local_log_event_trgm
ON local_log USING gin (event gin_trgm_ops);

-- Index on context + namespace + timestamp
CREATE INDEX IF NOT EXISTS idx_local_log_namespace_context_ts
ON local_log (namespace, context, timestamp DESC);

-- Index on event prefiltered by context and namespace
CREATE INDEX IF NOT EXISTS idx_local_log_ns_ctx_event_trgm
ON local_log USING gin ((namespace || '|' || context || '|' || event) gin_trgm_ops);

-- Lowers RAM
SET maintenance_work_mem = '4MB';

-- Adds parallel workers
SET max_parallel_workers_per_gather = 4;
