// netlify/functions/save-day.js
// Receives task states + notes for a given date, upserts into Supabase

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { date, tasks, notes, user_id } = JSON.parse(event.body);

    if (!date || !user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'date and user_id required' }) };
    }

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        { date, tasks, notes, user_id, updated_at: new Date().toISOString() },
        { onConflict: 'date,user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err) {
    console.error('save-day error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
