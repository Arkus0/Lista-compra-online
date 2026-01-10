import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, email } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }

    // Log feedback for now - can be enhanced with email service later
    console.log('=== NUEVA SUGERENCIA ===')
    console.log('Fecha:', new Date().toISOString())
    console.log('Email:', email || 'No proporcionado')
    console.log('Mensaje:', message)
    console.log('========================')

    // Try to send via email service if configured
    const emailTo = 'juanjosemova@outlook.es'

    // Option 1: If using Resend (add RESEND_API_KEY to env)
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Lista de Compras <noreply@resend.dev>',
            to: emailTo,
            subject: 'Nueva sugerencia - Lista de Compras',
            html: `
              <h2>Nueva sugerencia recibida</h2>
              <p><strong>Email de contacto:</strong> ${email || 'No proporcionado'}</p>
              <p><strong>Mensaje:</strong></p>
              <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${message.replace(/\n/g, '<br>')}</p>
              <p style="color: #666; font-size: 12px;">Enviado el ${new Date().toLocaleString('es-ES')}</p>
            `
          })
        })

        if (response.ok) {
          return NextResponse.json({ success: true, method: 'resend' })
        }
      } catch (e) {
        console.error('Error sending via Resend:', e)
      }
    }

    // Option 2: If using SendGrid (add SENDGRID_API_KEY to env)
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: emailTo }] }],
            from: { email: 'noreply@listacompras.app' },
            subject: 'Nueva sugerencia - Lista de Compras',
            content: [{
              type: 'text/html',
              value: `
                <h2>Nueva sugerencia recibida</h2>
                <p><strong>Email de contacto:</strong> ${email || 'No proporcionado'}</p>
                <p><strong>Mensaje:</strong></p>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${message.replace(/\n/g, '<br>')}</p>
              `
            }]
          })
        })

        if (response.ok) {
          return NextResponse.json({ success: true, method: 'sendgrid' })
        }
      } catch (e) {
        console.error('Error sending via SendGrid:', e)
      }
    }

    // If no email service configured, still return success
    // (the feedback was logged, and client can fallback to mailto)
    return NextResponse.json({
      success: true,
      method: 'logged',
      note: 'Configure RESEND_API_KEY or SENDGRID_API_KEY for email delivery'
    })

  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Error al procesar la sugerencia' },
      { status: 500 }
    )
  }
}
