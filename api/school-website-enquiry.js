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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 2px solid #00AF90; border-radius: 16px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #00AF90 0%, #141E28 100%); padding: 22px 26px; border-radius: 12px; margin-bottom: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 21px; font-weight: 800;">
          ${isMoreTemplatesRequest ? '📁 User Requested 50+ More Templates Catalog!' : '🏫 New School Website Enquiry Received!'}
        </h2>
        <p style="margin: 6px 0 0; font-size: 13.5px; color: #A7F3D0;">Dev Sharma • School Website Specialist • New Delhi (+91 9050778830) • design.cseel.org</p>
      </div>

      ${
        isMoreTemplatesRequest
          ? `<div style="background: #FEF3C7; border: 2px solid #F59E0B; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; color: #92400E; font-size: 15px; font-weight: 800;">
              ⭐ USER DEMAND: The user has requested more school website templates / full 50+ templates catalog! Please send the catalog PDF & demo links immediately.
            </div>`
          : ''
      }

      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #1B2732; font-weight: 700;">
          ${isMoreTemplatesRequest ? 'A school representative has requested additional website design templates:' : 'A school administrator has submitted an official project enquiry via design.cseel.org:'}
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14.5px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 35%;">School Name:</td>
            <td style="padding: 10px 0; color: #00AF90; font-weight: 900; font-size: 16px;">${enquiry.school_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Contact Person:</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: 800;">${enquiry.person_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Email Address:</td>
            <td style="padding: 10px 0; color: #008770; font-weight: 700;">
              <a href="mailto:${enquiry.email}" style="color: #008770; text-decoration: underline;">${enquiry.email}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Mobile / WhatsApp:</td>
            <td style="padding: 10px 0; color: #00AF90; font-weight: 800; font-size: 16px;">
              <a href="tel:${enquiry.contact_number}" style="color: #00AF90; text-decoration: none;">${enquiry.contact_number}</a>
              &nbsp;|&nbsp;
              <a href="${waUrl}" style="color: #25D366; text-decoration: none; font-weight: 800;">WhatsApp Lead &rarr;</a>
            </td>
          </tr>
          ${
            enquiry.template_name
              ? `
          <tr style="border-bottom: 1px solid #f1f5f9; background: #E6F7F4;">
            <td style="padding: 10px 8px; color: #008770; font-weight: 800;">Requested Item / Template:</td>
            <td style="padding: 10px 8px; color: #008770; font-weight: 800;">
              ${enquiry.template_name}
              ${enquiry.template_link ? `<br><a href="${enquiry.template_link}" target="_blank" style="color: #00AF90; font-size: 13px;">View Template Demo &rarr;</a>` : ''}
            </td>
          </tr>`
              : ''
          }
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600; vertical-align: top;">Notes / Requirements:</td>
            <td style="padding: 10px 0; color: #334155; line-height: 1.6;">${enquiry.notes}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">Source:</td>
            <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">design.cseel.org (Dev Sharma School Portfolio)</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">Submitted At:</td>
            <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>
      </div>

      <div style="background: #E6F7F4; padding: 14px 18px; border-radius: 10px; font-size: 13px; color: #008770; font-weight: 700;">
        💡 Direct Reply: You can reply directly to this email to reach the school at ${enquiry.email} (or contact via WhatsApp at +91 ${cleanPhone})
      </div>
    </div>
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

  try {
    const body = req.body || {};
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
