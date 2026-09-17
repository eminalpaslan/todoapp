import pytest

from app.core.limiter import limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()


@pytest.fixture(autouse=True)
def disable_email_sending(monkeypatch):
    # Testler gercek SMTP'ye (Mailpit) baglanmasin diye send_email'i
    # hicbir sey yapmayan bir fonksiyonla degistiriyoruz. Boylece testler
    # hem hizli kalir hem Mailpit'in ayakta olmasina bagimli olmaz.
    async def _noop_send_email(*args, **kwargs) -> None:
        return None

    monkeypatch.setattr("app.routers.auth.send_email", _noop_send_email)
