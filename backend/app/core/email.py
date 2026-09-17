import smtplib
from email.message import EmailMessage

from starlette.concurrency import run_in_threadpool

from app.core.config import settings


def _send_sync(to: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.send_message(message)


async def send_email(to: str, subject: str, body: str) -> None:
    # smtplib senkron (bloklayici) - event loop'u kilitlememek icin
    # ayri bir thread'de calistiriyoruz
    await run_in_threadpool(_send_sync, to, subject, body)
