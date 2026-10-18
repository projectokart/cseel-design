const nodemailer = require('nodemailer');

const NOTIFICATION_EMAILS = ['ptdevkaushik102@gmail.com', 'ptdevkaushik101@gmail.com'];
const SENDER_EMAIL = 'website@design.cseel.org';

// In-memory rate limiting for serverless instance
const ipRecords = new Map();
const deviceRecords = new Map();

function checkMaliciousPayload(text) {
  if (!text) return false;
  const sqlPatterns = [
    /(\bunion\s+(all\s+)?select\b)/i,
    /(\bselect\s+[\w\*\s,]+\s+from\b)/i,
    /(\binsert\s+into\s+[\w\.]+)/i,
    /(\bdrop\s+table\b)/i,
    /(\btruncate\s+table\b)/i,
    /(\balter\s+table\b)/i,
    /(\bdelete\s+from\b)/i,
    /(\bexec(ute)?\s*\()/i,
    /('|\")\s*(or|and)\s*('|\")?\d+('|\")?\s*=\s*('|\")?\d+/i,
    /('|\")\s*(or|and)\s+true\b/i,
    /(--\s*$|--\s*[\r\n]|;\s*--|;\s*drop|;\s*select|;\s*delete)/i,
    /(\/\*[\s\S]*?\*\/)/i,
    /(\bxp_cmdshell\b)/i,
  ];
  for (const pattern of sqlPatterns) {
    if (pattern.test(text)) return true;
  }
  const xssPatterns = [
    /<script\b[\s\S]*?>/i,
    /<\/script>/i,
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /<iframe\b[\s\S]*?>/i,
    /<embed\b[\s\S]*?>/i,
    /<object\b[\s\S]*?>/i,
    /<svg\b[\s\S]*?>/i,
    /\bonerror\s*=/i,
    /\bonload\s*=/i,
    /\bonclick\s*=/i,
  ];
  for (const pattern of xssPatterns) {
    if (pattern.test(text)) return true;
  }
  return false;
}

async function sendEmailNotification(enquiry) {
  const cleanPhone = enquiry.contact_number.replace(/[^0-9]/g, '').slice(-10);
  const waMessage = encodeURIComponent(
    'Hi Dev, I found you online on your website. Can you develop a modern CBSE/ICSE school website for our institution?'
  );
  const waUrl = `https://wa.me/91${cleanPhone}?text=${waMessage}`;

  const isMoreTemplatesRequest = Boolean(
    (enquiry.template_name && enquiry.template_name.toLowerCase().includes('more')) ||
    (enquiry.template_name && enquiry.template_name.toLowerCase().includes('catalog')) ||
    (enquiry.notes && enquiry.notes.toLowerCase().includes('more template')) ||
    (enquiry.notes && enquiry.notes.toLowerCase().includes('catalog'))
  );

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isMoreTemplatesRequest ? 'Catalog Request' : 'School Website Lead'}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    .email-container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .field-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; word-break: break-word; overflow-wrap: anywhere; }
    .field-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .field-value { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.5; word-break: break-word; overflow-wrap: anywhere; }
    .btn-action { display: inline-block; padding: 12px 20px; border-radius: 8px; font-weight: 800; font-size: 14px; text-decoration: none; text-align: center; margin: 4px 0; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 10px !important; }
      .email-body { padding: 18px 14px !important; }
      .btn-action { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div class="email-wrapper" style="padding: 24px 12px; background-color: #f1f5f9;">
    <div class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1.5px solid #00AF90;">
      
      <!-- Top Banner -->
      <div style="background: linear-gradient(135deg, #00AF90 0%, #141E28 100%); padding: 24px 20px; text-align: left; color: #ffffff;">
        <span style="display: inline-block; background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 10px;">
          ${isMoreTemplatesRequest ? '📁 CATALOG INQUIRY' : '🏫 NEW SCHOOL LEAD'}
        </span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; line-height: 1.3; color: #ffffff;">
          ${isMoreTemplatesRequest ? '50+ School Templates Catalog Request' : 'Direct School Website Enquiry'}
        </h1>
        <p style="margin: 8px 0 0; font-size: 13px; color: #A7F3D0; line-height: 1.5;">
          Dev Sharma • School Website Specialist • New Delhi • <a href="https://design.cseel.org" style="color: #ffffff; text-decoration: underline;">design.cseel.org</a>
        </p>
      </div>

      <!-- Main Body -->
      <div class="email-body" style="padding: 24px 20px;">
        
        ${isMoreTemplatesRequest ? `
        <div style="background: #FEF3C7; border: 1.5px solid #F59E0B; padding: 14px 16px; border-radius: 10px; margin-bottom: 16px; color: #92400E; font-size: 14px; font-weight: 800; line-height: 1.5;">
          ⭐ <strong>PRIORITY ACTION:</strong> User requested 50+ templates catalog PDF and demo links. Send catalog instantly via WhatsApp or Email!
        </div>
        ` : ''}

        <!-- School Name -->
        <div class="field-card" style="background: #E6F7F4; border: 1.5px solid rgba(0, 175, 144, 0.4);">
          <div class="field-label" style="color: #008770;">School / Institution Name</div>
          <div class="field-value" style="font-size: 18px; color: #008770; font-weight: 900;">${enquiry.school_name}</div>
        </div>

        <!-- Contact Person -->
        <div class="field-card">
          <div class="field-label">Contact Person (Principal / Administrator)</div>
          <div class="field-value">${enquiry.person_name}</div>
        </div>

        <!-- Mobile & WhatsApp -->
        <div class="field-card">
          <div class="field-label">Mobile Number</div>
          <div class="field-value" style="font-size: 16px;">
            <a href="tel:${enquiry.contact_number}" style="color: #00AF90; text-decoration: none;">+91 ${cleanPhone}</a>
          </div>
        </div>

        <!-- Email Address -->
        <div class="field-card">
          <div class="field-label">Official Email Address</div>
          <div class="field-value">
            <a href="mailto:${enquiry.email}" style="color: #008770; text-decoration: underline;">${enquiry.email}</a>
          </div>
        </div>

        <!-- Template Selection (if any) -->
        ${enquiry.template_name ? `
        <div class="field-card" style="background: #F0FDF4; border: 1.5px solid #86EFAC;">
          <div class="field-label" style="color: #15803D;">Selected Template / Item</div>
          <div class="field-value" style="color: #15803D;">
            ${enquiry.template_name}
            ${enquiry.template_link ? `<div style="margin-top: 6px;"><a href="${enquiry.template_link}" target="_blank" style="color: #00AF90; font-size: 13px; text-decoration: underline;">Open Template Demo &rarr;</a></div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Requirements Notes -->
        <div class="field-card">
          <div class="field-label">Project Requirements & Notes</div>
          <div class="field-value" style="font-weight: 500; color: #334155; white-space: pre-wrap; line-height: 1.6;">${enquiry.notes}</div>
        </div>

        <!-- Direct Instant Action Buttons -->
        <div style="margin: 22px 0 16px; padding: 16px; background: #F8FAF9; border-radius: 12px; border: 1px dashed #00AF90; text-align: center;">
          <div style="font-size: 12px; font-weight: 800; color: #1B2732; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
            ⚡ Quick 1-Tap Reply Options
          </div>
          <a href="${waUrl}" target="_blank" class="btn-action" style="background: #25D366; color: #ffffff; box-shadow: 0 4px 12px rgba(37,211,102,0.35); margin-right: 6px;">
            📱 Chat on WhatsApp (+91 ${cleanPhone})
          </a>
          <a href="mailto:${enquiry.email}?subject=Dev%20Sharma%20-%20Website%20Proposal%20for%20${encodeURIComponent(enquiry.school_name)}" class="btn-action" style="background: #00AF90; color: #ffffff; box-shadow: 0 4px 12px rgba(0,175,144,0.35);">
            ✉️ Reply via Email
          </a>
        </div>

        <!-- Meta Information -->
        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
          <div><strong>Source:</strong> design.cseel.org (Dev Sharma Direct School Web Portfolio)</div>
          <div><strong>Received At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
        </div>

      </div>
    </div>
  </div>
</body>
</html>
  `;

  const emailSubject = isMoreTemplatesRequest
    ? `📁 [CATALOG REQUEST] ${enquiry.school_name} - ${enquiry.person_name} (${enquiry.contact_number}) requested 50+ School Templates`
    : `🚨 [School Website Lead] ${enquiry.school_name} - ${enquiry.person_name} (${enquiry.contact_number})${enquiry.template_name ? ' [' + enquiry.template_name + ']' : ''}`;

  // 1. Brevo Transactional Email
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Dev Sharma • School Web Specialist', email: SENDER_EMAIL },
          to: NOTIFICATION_EMAILS.map((email) => ({ email, name: 'Dev Sharma' })),
          replyTo: { email: enquiry.email, name: enquiry.person_name },
          subject: emailSubject,
          htmlContent: htmlContent,
        }),
      });

      if (brevoRes.ok) {
        console.log('[design-enquiry] Delivered via Brevo API');
        return true;
      }
    } catch (brevoErr) {
      console.warn('[design-enquiry] Brevo error, falling back to Gmail SMTP:', brevoErr);
    }
  }

  // 2. Gmail SMTP Fallback
  const gmailUser = process.env.GMAIL_USER || 'ptdevkaushik104@gmail.com';
  const gmailPass = process.env.GMAIL_PASS;

  if (gmailPass) {
    try {
      const gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await gmailTransporter.sendMail({
        from: `"Dev Sharma • School Web Specialist" <${SENDER_EMAIL}>`,
        to: NOTIFICATION_EMAILS,
        replyTo: enquiry.email,
        subject: emailSubject,
        html: htmlContent,
      });

      console.log('[design-enquiry] Delivered successfully via Gmail SMTP');
      return true;
    } catch (err) {
      console.error('[design-enquiry] Email delivery error:', err);
      return false;
    }
  }

  return false;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Dev Sharma School Website Design API',
      domain: 'design.cseel.org',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = {};
  try {
    body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (parseErr) {
    return res.status(400).json({ error: 'Invalid JSON request format.' });
  }
  if (!body || typeof body !== 'object') {
    body = {};
  }

  try {
    const {
      school_name,
      person_name,
      email,
      contact_number,
      notes,
      template_name,
      template_link,
      device_id,
      website_hp,
    } = body;

    // 1. Anti-bot honeypot check
    if (website_hp) {
      return res.status(400).json({ error: 'Spam submission detected.' });
    }

    // 2. Client IP & Rate Limiting
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket ? req.socket.remoteAddress : '127.0.0.1');
    const resolvedDeviceId = String(device_id || `fallback_${clientIp}`).trim();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const ipList = (ipRecords.get(clientIp) || []).filter((t) => t > oneDayAgo);
    if (ipList.length >= 15) {
      return res.status(429).json({
        error: 'Daily limit reached. Please contact Dev Sharma directly on WhatsApp: +91 9050778830.',
      });
    }
    ipList.push(now);
    ipRecords.set(clientIp, ipList);

    // 3. Required Fields Check
    if (!school_name || !person_name || !email || !contact_number || !notes) {
      return res.status(400).json({
        error: 'All fields are compulsory. Please provide School Name, Contact Person, Email, Contact Number, and Notes.',
      });
    }

    const cleanSchoolName = String(school_name).trim();
    const cleanPersonName = String(person_name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const rawContact = String(contact_number).trim();
    const cleanContact = rawContact.replace(/[^0-9]/g, '').slice(-10);
    const cleanNotes = String(notes).trim();

    // 4. Length & Format Validations
    if (cleanSchoolName.length < 2 || cleanSchoolName.length > 120) {
      return res.status(400).json({ error: 'School Name must be between 2 and 120 characters.' });
    }
    if (cleanPersonName.length < 2 || cleanPersonName.length > 60) {
      return res.status(400).json({ error: 'Contact Person Name must be between 2 and 60 characters.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. principal@school.edu.in).' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanContact)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian Mobile / WhatsApp number.' });
    }

    // 5. Notes Word Count Check
    const words = cleanNotes.split(/\s+/).filter(Boolean);
    if (words.length > 150) {
      return res.status(400).json({
        error: `Notes exceed maximum limit of 150 words (current: ${words.length}). Please summarize concisely.`,
      });
    }
    if (words.length < 2) {
      return res.status(400).json({ error: 'Please describe your requirements in at least 2-3 words.' });
    }

    // 6. Security Checks
    for (const field of [cleanSchoolName, cleanPersonName, cleanEmail, rawContact, cleanNotes]) {
      if (checkMaliciousPayload(field)) {
        return res.status(400).json({
          error: 'Suspicious character pattern detected. Please enter legitimate plain text only.',
        });
      }
    }

    const isMoreReq = Boolean(
      (template_name && template_name.toLowerCase().includes('more')) ||
      (template_name && template_name.toLowerCase().includes('catalog')) ||
      (cleanNotes && cleanNotes.toLowerCase().includes('more template')) ||
      (cleanNotes && cleanNotes.toLowerCase().includes('catalog'))
    );

    const enquiryData = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      school_name: cleanSchoolName,
      person_name: cleanPersonName,
      email: cleanEmail,
      contact_number: cleanContact,
      notes: cleanNotes,
      template_name: template_name ? String(template_name).trim() : undefined,
      template_link: template_link ? String(template_link).trim() : undefined,
      ip: clientIp,
      device_id: resolvedDeviceId,
      createdAt: new Date().toISOString(),
    };

    // Dispatch email
    sendEmailNotification(enquiryData).catch((e) => console.error('Email notification background error:', e));

    return res.status(200).json({
      success: true,
      message: isMoreReq
        ? 'Request for 50+ More School Templates received successfully! Dev Sharma will send the complete catalog and contact your WhatsApp/Phone (+91 ' + cleanContact + ') within 2 hours.'
        : 'Enquiry received successfully! Dev Sharma will contact your WhatsApp/Phone (+91 ' + cleanContact + ') within 2 hours.',
      id: enquiryData.id,
      selected_template: enquiryData.template_name || null,
      is_more_templates: isMoreReq,
    });
  } catch (err) {
    console.error('Server error handling enquiry:', err);
    return res.status(500).json({ error: 'Server error processing enquiry.' });
  }
};
