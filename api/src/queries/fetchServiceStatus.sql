SELECT
    s.*,
    sd.*,
    n.id AS notification_id,
    n.name AS notification_name,
    n.message AS notification_message,
    n.webhook AS notification_webhook
FROM status s

-- Last N status_details per service
LEFT JOIN LATERAL (
    SELECT *
    FROM status_details sd
    WHERE sd.service_id = s.id
    ORDER BY sd.timestamp DESC
    LIMIT CASE
        WHEN s.max_consecutive_failures = 0 THEN 1
        ELSE s.max_consecutive_failures
    END
) sd ON TRUE

-- Optional notification
LEFT JOIN status_notifications n
    ON s.notification = n.id;
