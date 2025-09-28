import os
import httpx

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
CONTACT_TO = os.getenv("CONTACT_TO")       # where messages arrive (you)
CONTACT_FROM = os.getenv("CONTACT_FROM")   # verified sender in SendGrid

class EmailConfigError(RuntimeError):
    pass

async def send_contact_email(name: str, email: str, message: str) -> None:
    """
    Sends a simple plaintext email via SendGrid.
    Raises EmailConfigError if env vars are missing or SendGrid returns an error.
    """
    if not (SENDGRID_API_KEY and CONTACT_TO and CONTACT_FROM):
        raise EmailConfigError("Missing SENDGRID_API_KEY, CONTACT_TO, or CONTACT_FROM")

    payload = {
        "personalizations": [{"to": [{"email": CONTACT_TO}], "subject": f"Portfolio contact from {name}"}],
        "from": {"email": CONTACT_FROM, "name": "Portfolio Site"},
        "reply_to": {"email": email, "name": name},
        "content": [{"type": "text/plain", "value": f"From: {name} <{email}>\n\n{message}"}],
    }

    headers = {
        "Authorization": f"Bearer {SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=payload)
        # SendGrid returns 202 on success
        if r.status_code != 202:
            raise RuntimeError(f"SendGrid error {r.status_code}: {r.text}")
