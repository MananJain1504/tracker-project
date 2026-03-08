// netlify/functions/ai-analyze.js
// Calls Gemini to: summarize notes, analyze patterns, suggest tomorrow's focus

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { mode, notes, weekData, todayTasks } = JSON.parse(event.body);
    // mode: 'summarize' | 'analyze' | 'suggest'

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');

    let prompt = '';

    if (mode === 'summarize') {
      prompt = `You are a concise technical productivity assistant for an electronics engineering student preparing for RTL/VLSI job interviews.

The user wrote this raw daily note:
"${notes}"

Rewrite it as a clean, structured log entry. Keep it under 4 sentences. Focus on:
- What was actually done
- Any blockers or issues
- Concrete progress on the RV32I project or fundamentals

Be factual and terse. No motivational language.`;

    } else if (mode === 'analyze') {
      const summary = weekData.map(d =>
        `${d.date}: ${Object.entries(d.tasks).filter(([,v])=>v==='done').map(([k])=>k).join(', ')||'nothing'} | notes: ${d.notes||'none'}`
      ).join('\n');

      prompt = `You are a strategic thinking partner for Manan, an ECE student targeting RTL/VLSI jobs (target: RV32I CPU project, digital design fundamentals, job applications).

Here is his last 7 days of task completion:
${summary}

Analyze these patterns in 3-4 sentences:
1. Which tasks are being consistently skipped or done
2. Any concerning gaps
3. One concrete behavioral observation

Be direct. No fluff. No praise. Just pattern analysis.`;

    } else if (mode === 'suggest') {
      const taskStatus = Object.entries(todayTasks)
        .map(([k,v]) => `${k}: ${v}`)
        .join(', ');

      prompt = `You are a strategic thinking partner for Manan, an ECE student targeting RTL/VLSI jobs.

Today's task completion: ${taskStatus}
Today's notes: "${notes}"

Suggest ONE specific, concrete focus for tomorrow. Max 2 sentences. Must be tied to either:
- RV32I pipeline progress (if RTL was incomplete)
- A specific digital design concept (if fundamentals were skipped)
- A specific company/outreach action (if applications were skipped)

No generic advice. Be specific.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: text }),
    };

  } catch (err) {
    console.error('ai-analyze error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
