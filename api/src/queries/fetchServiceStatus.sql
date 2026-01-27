SELECT
    s.*,
    sd.*,
    n.id AS notification_id,
    n.name AS notification_name,
    n.message AS notification_message,
    n.webhook AS notification_webhook,
    COALESCE(sd.bars, '[]'::json) AS bars
FROM status s

-- Last N status_details per service
LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
        'id', sd.id,
        'status', sd.status,
        'expected_down', sd.expected_down,
        'upside_down', sd.upside_down,
        'delay', sd.delay,
        'note', sd.note,
        'timestamp', sd.timestamp
    )) AS bars
    FROM (
        SELECT *
        FROM status_details sd
        WHERE sd.service_id = s.id
        ORDER BY sd.timestamp DESC
        LIMIT CASE
            WHEN s.max_consecutive_failures = 0 THEN 1
            ELSE s.max_consecutive_failures
        END
    ) sd
) sd ON TRUE

-- Notification
LEFT JOIN status_notifications n
    ON s.notification = n.id
ORDER BY s.id;
