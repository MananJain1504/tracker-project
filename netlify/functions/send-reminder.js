// netlify/functions/send-reminder.js
// Scheduled: runs daily at 2:00 UTC (7:30 AM IST)
// Fetches all push subscriptions and sends a reminder

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

webpush.setVapidDetails(
  'mailto:mananjain1504@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Motivating but terse messages — rotates daily
const MESSAGES = [
  { title: 'RTL block: 45 min', body: 'Open Vivado. Pick up where you left off on the pipeline.' },
  { title: 'Daily execution', body: 'Fundamentals + RTL + one application. 95 minutes total.' },
  { title: 'Consistency > brilliance', body: 'Log in. Mark your tasks. Build the streak.' },
  { title: 'Pipeline not going to build itself', body: '45 min on RV32I today. That\'s it.' },
  { title: 'Digital design window open', body: 'One concept: setup/hold, CDC, or FSM. 30 min.' },
  { title: 'Outreach window', body: '2 LinkedIn messages to RTL engineers today. 20 min.' },
  { title: 'Execute today', body: 'Small consistent effort. Open the tracker.' },
];

exports.handler = async () => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return { statusCode: 200, body: 'No subscriptions found.' };
    }

    const dayIndex = new Date().getDay(); // 0–6
    const msg = MESSAGES[dayIndex % MESSAGES.length];

    const payload = JSON.stringify({
      title: msg.title,
      body: msg.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: '/'
    });

    const results = await Promise.allSettled(
      subscriptions.map(row => {
        const sub = typeof row.subscription === 'string'
          ? JSON.parse(row.subscription)
          : row.subscription;
        return webpush.sendNotification(sub, payload);
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Reminders sent: ${sent}, failed: ${failed}`);
    return { statusCode: 200, body: JSON.stringify({ sent, failed }) };

  } catch (err) {
    console.error('send-reminder error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
