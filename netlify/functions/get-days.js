const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { user_id, from, to } = event.queryStringParameters || {};
    if (!user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'user_id required' }) };
    }
    let query = supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false });
    if (from) query = query.gte('date', from);
    if (to)   query = query.lte('date', to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
