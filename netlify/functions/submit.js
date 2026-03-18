exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    const portalId = '8153409';
    const formId   = '505fac89-5d3e-4bd9-9f4c-c1590775c438';
    const endpoint = `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

    const payload = {
      fields: data.fields,
      context: {
        pageUri: data.pageUri || 'https://inside-fitune-form.netlify.app',
        pageName: 'Inside Fitune - Mega Demo',
        ipAddress: event.headers['x-forwarded-for'] || '',
      },
      legalConsentOptions: {
        consent: {
          consentToProcess: true,
          text: 'I agree to allow Fitune to store and process my personal data.',
          communications: [{
            value: true,
            subscriptionTypeId: 999,
            text: 'I agree to receive marketing communications from Fitune.'
          }]
        }
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();

    if (res.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      console.error('HubSpot error:', res.status, responseText);
      return { statusCode: res.status, body: responseText };
    }
  } catch (e) {
    console.error('Function error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
