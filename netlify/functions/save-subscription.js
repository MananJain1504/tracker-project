// netlify/functions/save-subscription.js
// Saves browser push subscription object to Supabase for a user

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
    const { user_id, subscription } = JSON.parse(event.body);

    if (!user_id || !subscription) {
      return { statusCode: 400, body: JSON.stringify({ error: 'user_id and subscription required' }) };
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('save-subscription error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
