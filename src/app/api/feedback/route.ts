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

    // Log para depuración
    console.log('=== NUEVA SUGERENCIA ===')
    console.log('Fecha:', new Date().toISOString())
    console.log('Email usuario:', email || 'No proporcionado')
    console.log('Mensaje:', message)
    
    // Verificar configuración de API Key
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey.startsWith('re_your_resend')) {
      console.warn('RESEND_API_KEY no configurada o es la de ejemplo. Usando fallback.')
      return NextResponse.json(
        { error: 'Servicio de email no configurado', code: 'NO_API_KEY' },
        { status: 503 }
      )
    }

    const emailTo = 'nildest@gmail.com'
    const resend = new Resend(apiKey)

    // Intento de envío
    const { data, error } = await resend.emails.send({
      from: 'Lista de Compras <onboarding@resend.dev>',
      to: emailTo,
      subject: 'Nueva sugerencia - Lista de Compras',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nueva sugerencia recibida</h2>
          <p><strong>De:</strong> ${email || 'Anónimo'}</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap; margin: 0;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="color: #666; font-size: 12px;">Enviado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      `
    })

    if (error) {
      console.error('Error Resend:', error)
      return NextResponse.json(
        { error: error.message, code: 'RESEND_ERROR' },
        { status: 500 }
      )
    }

    console.log('Email enviado exitosamente ID:', data?.id)
    return NextResponse.json({ success: true, id: data?.id })

  } catch (error) {
    console.error('Error servidor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
