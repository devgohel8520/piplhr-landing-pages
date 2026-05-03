// api/crm.js — CRM API backed by Vercel Postgres (no Google Sheets)
const { sql } = require('@vercel/postgres');

const STATUSES = ['New', 'Nurture', 'Contacted', 'Qualified', 'Demo', 'Register', 'Won'];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { fn, args = [] } = body || {};

    try {
        let result;
        switch (fn) {

            // ── getAllData ──────────────────────────────────────────────────────────
            case 'getAllData': {
                const { rows } = await sql`
          SELECT * FROM contacts ORDER BY created_at DESC
        `;
                const contacts = rows.map(r => ({
                    row: r.id,
                    name: r.name || '',
                    company: r.company || '',
                    designation: r.designation || '',
                    mobile: r.mobile || '',
                    email: r.email || '',
                    status: r.status || 'New',
                    source: r.source || '',
                    location: r.location || '',
                    link: r.link || '',
                }));

                const stats = { New: 0, Contacted: 0, Qualified: 0, Demo: 0, Register: 0, Won: 0, Nurture: 0 };
                contacts.forEach(c => { if (stats.hasOwnProperty(c.status)) stats[c.status]++; });

                result = { contacts, stats };
                break;
            }

            // ── addNewContact ───────────────────────────────────────────────────────
            case 'addNewContact': {
                const c = args[0] || {};
                const { rows } = await sql`
          INSERT INTO contacts (name, company, designation, mobile, email, status, source, location, link)
          VALUES (
            ${c.name || ''},
            ${c.company || ''},
            ${c.designation || ''},
            ${c.mobile || ''},
            ${c.email || ''},
            ${c.status || 'New'},
            ${c.source || ''},
            ${c.location || ''},
            ${c.link || ''}
          )
          RETURNING id
        `;
                result = { success: true, id: rows[0].id };
                break;
            }

            // ── batchImportContacts ────────────────────────────────────────────────
            case 'batchImportContacts': {
                const contacts = args[0] || [];
                let imported = 0;
                let errors = 0;
                for (const c of contacts) {
                    try {
                        await sql`
              INSERT INTO contacts (name, company, designation, mobile, email, status, source, location, link)
              VALUES (
                ${c.name || ''},
                ${c.company || ''},
                ${c.designation || ''},
                ${c.mobile || ''},
                ${c.email || ''},
                ${c.status || 'New'},
                ${c.source || ''},
                ${c.location || ''},
                ${c.link || ''}
              )
            `;
                        imported++;
                    } catch (e) { errors++; }
                }
                result = { success: true, imported, errors };
                break;
            }

            // ── updateContactStatus ─────────────────────────────────────────────────
            case 'updateContactStatus': {
                const [id, status] = args;
                await sql`UPDATE contacts SET status = ${status} WHERE id = ${id}`;
                result = { success: true };
                break;
            }

            // ── updateContactDetails ────────────────────────────────────────────────
            case 'updateContactDetails': {
                const c = args[0] || {};
                await sql`
          UPDATE contacts SET
            name        = ${c.name || ''},
            company     = ${c.company || ''},
            designation = ${c.designation || ''},
            mobile      = ${c.mobile || ''},
            email       = ${c.email || ''},
            status      = ${c.status || 'New'},
            source      = ${c.source || ''},
            location    = ${c.location || ''},
            link        = ${c.link || ''}
          WHERE id = ${c.row}
        `;
                result = { success: true };
                break;
            }

            // ── deleteContact ───────────────────────────────────────────────────────
            case 'deleteContact': {
                const [id] = args;
                // Remarks and reminders are CASCADE deleted via FK
                await sql`DELETE FROM contacts WHERE id = ${id}`;
                result = { success: true };
                break;
            }

            // ── addRemark ───────────────────────────────────────────────────────────
            case 'addRemark': {
                const [contactId, contactName, remark, image] = args;
                await sql`
          INSERT INTO remarks (contact_id, contact_name, remark, image)
          VALUES (${contactId}, ${contactName || ''}, ${remark}, ${image || ''})
        `;
                result = { success: true };
                break;
            }

            // ── getRemarks (for one contact) ────────────────────────────────────────
            case 'getRemarks': {
                const [contactId] = args;
                const { rows } = await sql`
          SELECT * FROM remarks WHERE contact_id = ${contactId}
          ORDER BY created_at DESC
        `;
                result = rows.map(r => ({
                    contactRow: r.contact_id,
                    contactName: r.contact_name || '',
                    remark: r.remark || '',
                    image: r.image || '',
                    dateTime: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                }));
                break;
            }

            // ── getAllRemarks ───────────────────────────────────────────────────────
            case 'getAllRemarks': {
                const { rows } = await sql`
          SELECT * FROM remarks ORDER BY created_at DESC
        `;
                result = rows.map(r => ({
                    contactRow: r.contact_id,
                    contactName: r.contact_name || '',
                    remark: r.remark || '',
                    image: r.image || '',
                    dateTime: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                }));
                break;
            }

            // ── addReminder ─────────────────────────────────────────────────────────
            case 'addReminder': {
                const rem = args[0] || {};
                const { rows } = await sql`
          INSERT INTO reminders (contact_id, contact_name, type, date, time, agenda, status)
          VALUES (
            ${rem.contactRow || 0},
            ${rem.contactName || ''},
            ${rem.type || 'Phone'},
            ${rem.date || ''},
            ${rem.time || ''},
            ${rem.agenda || ''},
            ${rem.status || 'Pending'}
          )
          RETURNING id
        `;
                result = { success: true, id: rows[0].id };
                break;
            }

            // ── getAllReminders ─────────────────────────────────────────────────────
            case 'getAllReminders': {
                const { rows } = await sql`
          SELECT * FROM reminders ORDER BY
            CASE WHEN status != 'Completed' THEN 0 ELSE 1 END,
            date ASC, time ASC
        `;
                result = rows.map(r => ({
                    id: r.id,
                    contactRow: r.contact_id,
                    contactName: r.contact_name || '',
                    type: r.type || 'Phone',
                    date: r.date || '',
                    time: r.time || '',
                    agenda: r.agenda || '',
                    status: r.status || 'Pending',
                    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                }));
                break;
            }

            // ── getRemindersForContact ──────────────────────────────────────────────
            case 'getRemindersForContact': {
                const [contactId] = args;
                const { rows } = await sql`
          SELECT * FROM reminders WHERE contact_id = ${contactId}
          ORDER BY date ASC, time ASC
        `;
                result = rows.map(r => ({
                    id: r.id,
                    contactRow: r.contact_id,
                    contactName: r.contact_name || '',
                    type: r.type || 'Phone',
                    date: r.date || '',
                    time: r.time || '',
                    agenda: r.agenda || '',
                    status: r.status || 'Pending',
                    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                }));
                break;
            }

            // ── updateReminderStatus ────────────────────────────────────────────────
            case 'updateReminderStatus': {
                const [id, status] = args;
                await sql`UPDATE reminders SET status = ${status} WHERE id = ${id}`;
                result = { success: true };
                break;
            }

            // ── deleteReminder ──────────────────────────────────────────────────────
            case 'deleteReminder': {
                const [id] = args;
                await sql`DELETE FROM reminders WHERE id = ${id}`;
                result = { success: true };
                break;
            }

            default:
                return res.status(400).json({ error: 'Unknown function: ' + fn });
        }

        res.status(200).json({ result });

    } catch (err) {
        console.error(`CRM [${fn}] error:`, err);
        res.status(500).json({ error: err.message });
    }
};