export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request?.json?.();
    const name = (data?.name ?? '')?.trim?.() ?? '';
    const email = (data?.email ?? '')?.trim?.() ?? '';
    const phone = (data?.phone ?? '')?.trim?.() ?? '';
    const dotLink = (data?.dotLink ?? '')?.trim?.() ?? '';
    const message = (data?.message ?? '')?.trim?.() ?? '';

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    // Save to database
    await prisma.contactSubmission.create({
      data: { name, email, phone, dotLink, message },
    });

    // Send email notification
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #94a348; border-bottom: 2px solid #94a348; padding-bottom: 10px;">New Contact Form Submission</h2>
        <div style="background: #1a2e38; padding: 20px; border-radius: 8px; margin: 20px 0; color: #f3f7e4;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #94a348;">${email}</a></p>
          ${phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
          ${dotLink ? `<p style="margin: 10px 0;"><strong>Dot Link:</strong> <a href="${dotLink}" style="color: #94a348;">${dotLink}</a></p>` : ''}
          ${message ? `<p style="margin: 10px 0;"><strong>Message:</strong></p><div style="background: #0a0c04; padding: 15px; border-radius: 4px; border-left: 4px solid #94a348; color: #c8d4a8;">${message}</div>` : ''}
        </div>
        <p style="color: #8a9a70; font-size: 12px;">Submitted at: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const appUrl = process.env.NEXTAUTH_URL ?? '';
    let appName = 'Adine Portfolio';
    try { appName = new URL(appUrl).hostname?.split?.('.')?.[0] ?? 'Adine Portfolio'; } catch(e: any) {}

    try {
      let senderEmail = 'noreply@mail.abacusai.app';
      try { senderEmail = `noreply@${new URL(appUrl).hostname}`; } catch(e: any) {}

      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_CONTACT_FORM_SUBMISSION,
          subject: `New Contact Form Submission from ${name}`,
          body: htmlBody,
          is_html: true,
          recipient_email: 'aadinewj3@gmail.com',
          reply_to: email,
          sender_email: senderEmail,
          sender_alias: appName,
        }),
      });
    } catch (emailErr: any) {
      console.error('Email notification error:', emailErr?.message);
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('Contact API error:', error?.message);
    return NextResponse.json({ success: false, message: 'Failed to process submission' }, { status: 500 });
  }
}
