import { notFound } from "next/navigation";

async function getCampaignHTML(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/public-campaign?id=${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PublicLandingPage({
  params,
}: {
  params: { id: string };
}) {
  const campaign = await getCampaignHTML(params.id);
  if (!campaign) notFound();

  const { html, ownerId } = campaign;

  // Inject a form handler + chat widget into the landing page HTML
  const injectedHTML = html.replace(
    "</body>",
    `
    <script>
      // Lead form submission
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          await fetch('/api/widget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'lead',
              ownerId: '${ownerId}',
              name: fd.get('name'),
              email: fd.get('email'),
              phone: fd.get('phone'),
            }),
          });
          form.innerHTML = '<p style="color:green;text-align:center;font-weight:bold">Thanks! We\'ll be in touch.</p>';
        });
      });
      
      // Simple chat widget
      const chat = document.createElement('div');
      chat.id = 'omni-chat-widget';
      chat.innerHTML = \`
        <style>
          #omni-chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: system-ui; }
          .chat-bubble { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(90deg, #6366f1, #a855f7); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          .chat-bubble svg { width: 28px; height: 28px; color: white; }
          .chat-window { display: none; position: absolute; bottom: 80px; right: 0; width: 320px; height: 400px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); flex-direction: column; }
          .chat-window.open { display: flex; }
          .chat-header { background: linear-gradient(90deg, #6366f1, #a855f7); color: white; padding: 16px; border-radius: 12px 12px 0 0; font-weight: bold; }
          .chat-messages { flex: 1; overflow-y: auto; padding: 12px; }
          .chat-input-area { padding: 12px; border-top: 1px solid #eee; }
          .chat-input-area input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; }
        </style>
        <div class="chat-bubble" onclick="document.querySelector('.chat-window').classList.toggle('open')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="chat-window">
          <div class="chat-header">Chat with us</div>
          <div class="chat-messages">
            <p style="font-size: 12px; color: #666;">Hi! How can we help?</p>
          </div>
          <div class="chat-input-area">
            <input type="text" placeholder="Your message..." id="chat-msg" />
          </div>
        </div>
      \`;
      document.body.appendChild(chat);
      
      document.getElementById('chat-msg').addEventListener('keypress', async (e) => {
        if (e.key !== 'Enter') return;
        const msg = e.target.value;
        if (!msg.trim()) return;
        await fetch('/api/widget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            ownerId: '${ownerId}',
            name: 'Website Visitor',
            message: msg,
          }),
        });
        e.target.value = '';
        const msgDiv = document.createElement('p');
        msgDiv.style.cssText = 'font-size: 12px; color: #666; margin: 4px 0;';
        msgDiv.textContent = 'Message sent! We\'ll reply soon.';
        document.querySelector('.chat-messages').appendChild(msgDiv);
      });
    </script>
    </body>
    `
  );

  return (
    <html>
      <head>
        <title>Campaign Landing Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body dangerouslySetInnerHTML={{ __html: injectedHTML }} />
    </html>
  );
}
