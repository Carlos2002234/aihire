interface EmailContent {
  subject: string;
  html: string;
}

function renderEmail(
  preheader: string,
  heading: string,
  bodyHtml: string,
  cta: { label: string; url: string }
): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#fafafa;">
    <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <tr>
        <td>
          <p style="font-size:14px;letter-spacing:0.05em;text-transform:uppercase;color:#a1a1aa;margin:0 0 24px;">HireFlow</p>
          <h1 style="font-size:20px;margin:0 0 16px;">${heading}</h1>
          <div style="font-size:14px;line-height:1.6;color:#d4d4d8;">${bodyHtml}</div>
          <a href="${cta.url}" style="display:inline-block;margin-top:24px;padding:10px 20px;background:#fafafa;color:#0a0a0a;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">${cta.label}</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildStatusChangeEmail(jobTitle: string, appUrl: string): EmailContent {
  return {
    subject: `Tu aplicación a ${jobTitle} cambió de estado`,
    html: renderEmail(
      `Actualización sobre tu aplicación a ${jobTitle}`,
      "Tu aplicación cambió de estado",
      `<p>Tu aplicación a <strong>${jobTitle}</strong> avanzó a una nueva etapa del proceso.</p>`,
      { label: "Ver mi aplicación", url: appUrl }
    ),
  };
}

export function buildInterviewInvitationEmail(jobTitle: string, appUrl: string): EmailContent {
  return {
    subject: `Te invitaron a una entrevista — ${jobTitle}`,
    html: renderEmail(
      `Te invitaron a una entrevista para ${jobTitle}`,
      "Te invitaron a una entrevista",
      `<p>¡Buenas noticias! Sos parte del proceso de entrevistas para <strong>${jobTitle}</strong>.</p>`,
      { label: "Ver detalles", url: appUrl }
    ),
  };
}

export function buildOfferEmail(jobTitle: string, appUrl: string): EmailContent {
  return {
    subject: `Tenés una oferta — ${jobTitle}`,
    html: renderEmail(
      `Recibiste una oferta para ${jobTitle}`,
      "¡Tenés una oferta! 🎉",
      `<p>Recibiste una oferta para <strong>${jobTitle}</strong>. Entrá a HireFlow para ver el detalle.</p>`,
      { label: "Ver oferta", url: appUrl }
    ),
  };
}

export function buildFeedbackAvailableEmail(jobTitle: string, appUrl: string): EmailContent {
  return {
    subject: `Tu feedback y roadmap ya están listos — ${jobTitle}`,
    html: renderEmail(
      `Feedback y roadmap disponibles para ${jobTitle}`,
      "Tu feedback ya está listo",
      `<p>Preparamos un feedback detallado y un roadmap personalizado a partir de tu aplicación a <strong>${jobTitle}</strong>, para que puedas mejorar y volver a aplicar.</p>`,
      { label: "Ver mi feedback y roadmap", url: appUrl }
    ),
  };
}
