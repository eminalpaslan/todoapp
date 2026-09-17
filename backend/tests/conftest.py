import pytest

from app.core.limiter import limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()
