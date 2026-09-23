/*
 * One-time data fix: shift the old UTC time-in/out rows into local time.
 *
 * The older API build persisted JavaScript toISOString() values, i.e. UTC
 * wall-clock time. Guards post in the Philippines (Asia/Manila, UTC+8, no
 * DST), so stored times were 8 hours behind the time the guard's clock
 * showed (08:05 AM punches read back as 00:05:00).
 *
 * This script uses the same .env database credentials as the app, so no
 * mysql CLI is needed:
 *
 *   npm run migrate:times
 *
 * Safe to re-run: it only applies when the schema_migrations marker is
 * absent, and it shares the marker with db/migrate_timein_time_out_to_local_time.sql
 * (whichever runs first wins; the other becomes a no-op).
 *
 * If your posts are not in Asia/Manila, change OFFSET_HOURS below first.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const MIGRATION = 'timein_time_out_utc_to_pht';
const OFFSET_HOURS = 8; // Asia/Manila (Philippines), no DST

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sentry_attendance',
  });

  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         migration VARCHAR(120) NOT NULL,
         applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (migration)
       ) ENGINE=InnoDB`,
    );

    const [markerRows] = await pool.query(
      'SELECT COUNT(*) AS applied FROM schema_migrations WHERE migration = ?',
      [MIGRATION],
    );
    if (Number(markerRows[0].applied) > 0) {
      console.log('Migration already applied - nothing to do.');
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [logs] = await connection.query(
        `UPDATE attendance_logs
            SET time_in  = DATE_ADD(time_in, INTERVAL ${OFFSET_HOURS} HOUR),
                time_out = DATE_ADD(time_out, INTERVAL ${OFFSET_HOURS} HOUR),
                saved_at = DATE_ADD(saved_at, INTERVAL ${OFFSET_HOURS} HOUR)
          WHERE time_in IS NOT NULL OR time_out IS NOT NULL OR saved_at IS NOT NULL`,
      );
      const [validated] = await connection.query(
        `UPDATE validated_attendance_data
            SET time_in  = DATE_ADD(time_in, INTERVAL ${OFFSET_HOURS} HOUR),
                time_out = DATE_ADD(time_out, INTERVAL ${OFFSET_HOURS} HOUR)
          WHERE time_in IS NOT NULL OR time_out IS NOT NULL`,
      );
      await connection.query('INSERT INTO schema_migrations (migration) VALUES (?)', [MIGRATION]);

      await connection.commit();
      console.log(`Migrated ${logs.affectedRows} attendance_logs row(s) and ${validated.affectedRows} validated_attendance_data row(s) by +${OFFSET_HOURS}h.`);
      console.log('Done. Verify with:');
      console.log('  SELECT employee_id, attendance_date, time_in, time_out FROM attendance_logs ORDER BY attendance_date DESC, employee_id;');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Migration failed:', error.code || error.message);
  process.exitCode = 1;
});
