-- SENTRY one-time data fix: time-in / time-out were stored as UTC.
--
-- Why: the Node API used to persist JavaScript toISOString() values, i.e. UTC
-- wall-clock time. Guards post in the Philippines (Asia/Manila, UTC+8, no
-- DST), so every stored time_in / time_out was 8 hours behind the time the
-- guard's clock actually showed (08:05 AM punches read back as 00:05:00).
-- The code now stores local wall-clock time verbatim; this migration brings
-- the existing rows in line.
--
-- Deploy the updated code first, then run this file ONCE as a MySQL
-- administrator:
--
--   mysql -u root -p sentry_attendance < db/migrate_timein_time_out_to_local_time.sql
--
-- The procedure below only applies the shift when the schema_migrations
-- marker is absent, so re-running this file is safe (it becomes a no-op).
-- If your posts are not in Asia/Manila, change "INTERVAL 8 HOUR" below to
-- your post's UTC offset BEFORE running.

USE sentry_attendance;

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration VARCHAR(120) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (migration)
) ENGINE=InnoDB;

-- State before running (0 = not applied yet, 1 = already applied):
SELECT IF(COUNT(*) = 0, 'NOT APPLIED - will migrate now', 'ALREADY APPLIED - nothing to do') AS migration_status
  FROM schema_migrations
 WHERE migration = 'timein_time_out_utc_to_pht';

DROP PROCEDURE IF EXISTS sentry_fix_attendance_local_time;

DELIMITER $$

CREATE PROCEDURE sentry_fix_attendance_local_time()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM schema_migrations WHERE migration = 'timein_time_out_utc_to_pht'
  ) THEN
    UPDATE attendance_logs
       SET time_in  = DATE_ADD(time_in, INTERVAL 8 HOUR),
           time_out = DATE_ADD(time_out, INTERVAL 8 HOUR),
           saved_at = DATE_ADD(saved_at, INTERVAL 8 HOUR)
     WHERE time_in IS NOT NULL OR time_out IS NOT NULL OR saved_at IS NOT NULL;

    UPDATE validated_attendance_data
       SET time_in  = DATE_ADD(time_in, INTERVAL 8 HOUR),
           time_out = DATE_ADD(time_out, INTERVAL 8 HOUR)
     WHERE time_in IS NOT NULL OR time_out IS NOT NULL;

    INSERT INTO schema_migrations (migration) VALUES ('timein_time_out_utc_to_pht');
  END IF;
END$$

DELIMITER ;

CALL sentry_fix_attendance_local_time();
DROP PROCEDURE sentry_fix_attendance_local_time;

-- State after running (should be 1):
SELECT (SELECT COUNT(*) FROM schema_migrations
         WHERE migration = 'timein_time_out_utc_to_pht') AS applied;
