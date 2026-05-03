// api/init.js
// Visit /api/init once after deployment to create all tables.
// Protected by INIT_SECRET env var.

const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
    const secret = process.env.INIT_SECRET;
    if (secret && req.query.secret !== secret) {
        return res.status(401).json({ error: 'Unauthorized. Pass ?secret=YOUR_INIT_SECRET' });
    }

    try {
        // Contacts table
        await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        company     TEXT DEFAULT '',
        designation TEXT DEFAULT '',
        mobile      TEXT DEFAULT '',
        email       TEXT DEFAULT '',
        status      TEXT DEFAULT 'New',
        source      TEXT DEFAULT '',
        location    TEXT DEFAULT '',
        link        TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Remarks table
        await sql`
      CREATE TABLE IF NOT EXISTS remarks (
        id           SERIAL PRIMARY KEY,
        contact_id   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        contact_name TEXT DEFAULT '',
        remark       TEXT NOT NULL,
        image        TEXT DEFAULT '',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Reminders table
        await sql`
      CREATE TABLE IF NOT EXISTS reminders (
        id           SERIAL PRIMARY KEY,
        contact_id   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        contact_name TEXT DEFAULT '',
        type         TEXT DEFAULT 'Phone',
        date         TEXT NOT NULL,
        time         TEXT NOT NULL,
        agenda       TEXT NOT NULL,
        status       TEXT DEFAULT 'Pending',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        res.status(200).json({ success: true, message: 'All tables created successfully.' });
    } catch (err) {
        console.error('Init error:', err);
        res.status(500).json({ error: err.message });
    }
};