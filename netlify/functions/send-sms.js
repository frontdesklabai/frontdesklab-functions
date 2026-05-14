const twilio = require('twilio');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  console.log('Full Vapi payload:', JSON.stringify(body, null, 2));

  const callerPhone =
    body?.message?.toolCallList?.[0]?.function?.arguments?.phone_number ||
    body?.message?.toolCalls?.[0]?.function?.arguments?.phone_number ||
    body?.tool_call?.function?.arguments?.phone_number ||
    body?.function?.arguments?.phone_number ||
    body?.arguments?.phone_number ||
    body?.phone_number ||
    null;

  console.log('Extracted phone number:', callerPhone);

  if (!callerPhone) {
    console.log('No phone number found. Body was:', JSON.stringify(body, null, 2));
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No phone number provided', received: body })
    };
  }

  const accountSid   = process.env.TWILIO_ACCOUNT_SID;
  const authToken    = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber   = process.env.TWILIO_PHONE_NUMBER;
  const calendlyLink = process.env.CALENDLY_LINK;

  if (!accountSid || !authToken || !fromNumber || !calendlyLink) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: `Hi! Here's your link to book your free 15-min discovery call with FrontDesk Lab:\n\n${calendlyLink}\n\nWe look forward to speaking with you!`,
      from: fromNumber,
      to: callerPhone
    });

    console.log('SMS sent. SID:', message.sid);

return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results: [
          {
            toolCallId: body?.message?.toolCallList?.[0]?.id || body?.message?.toolCalls?.[0]?.id || 'unknown',
            result: 'SMS sent successfully with Calendly link.'
          }
        ]
      })
    };

  } catch (err) {
    console.error('Twilio error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
