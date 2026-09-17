from slowapi import Limiter
from slowapi.util import get_remote_address

# IP adresine gore sayar, bellek-ici (in-memory) tutar - ek bir servise
# (Redis vb.) ihtiyac yok. default_limits: ozel bir limit tanimlanmamis
# her endpoint'e uygulanan genel taban.
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
