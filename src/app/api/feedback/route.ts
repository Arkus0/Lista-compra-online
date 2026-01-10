import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { message, email } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }

    // Log feedback for tracking
    console.log('=== NUEVA SUGERENCIA ===')
    console.log('Fecha:', new Date().toISOString())
    console.log('Email:', email || 'No proporcionado')
    console.log('Mensaje:', message)
    console.log('========================')

    const emailTo = 'juanjosemova@outlook.es'

    // Try to send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)

        const { data, error } = await resend.emails.send({
          from: 'Lista de Compras <onboarding@resend.dev>',
          to: emailTo,
          subject: 'Nueva sugerencia - Lista de Compras',
          html: `
            <h2>Nueva sugerencia recibida</h2>
            <p><strong>Email de contacto:</strong> ${email || 'No proporcionado'}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Enviado el ${new Date().toLocaleString('es-ES')}</p>
          `
        })

        if (error) {
          console.error('Error sending via Resend:', error)
          // Return error so client triggers mailto fallback
          return NextResponse.json(
            { error: 'Error al enviar el email' },
            { status: 500 }
          )
        }

        console.log('Email enviado correctamente via Resend:', data?.id)
        return NextResponse.json({ success: true, method: 'resend' })

      } catch (e) {
        console.error('Error sending via Resend:', e)
        // Return error so client triggers mailto fallback
        return NextResponse.json(
          { error: 'Error al enviar el email' },
          { status: 500 }
        )
      }
    }

    // If no email service configured, return error to trigger mailto fallback
    console.warn('No email service configured - client will use mailto fallback')
    return NextResponse.json(
      { error: 'Servicio de email no configurado' },
      { status: 503 }
    )

  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Error al procesar la sugerencia' },
      { status: 500 }
    )
  }
}
