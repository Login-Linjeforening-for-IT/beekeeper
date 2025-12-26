#!/bin/sh

START_TIME=$(date +%s)

echo "-------------------------------------------"
echo "Flushing logs..."
echo "Start time: $(date)"
echo "-------------------------------------------"

export PGHOST="${DB_HOST}"

psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}" <<EOF
BEGIN;

-- Delete from global logs older than 30 days
DELETE FROM global_log
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Delete from local logs older than 30 days
DELETE FROM local_log
WHERE timestamp < NOW() - INTERVAL '30 days';

COMMIT;
EOF

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "-------------------------------------------"
echo "Done flushing logs."
echo "End time: $(date)"
echo "Total duration: ${DURATION} seconds"
echo "-------------------------------------------"
