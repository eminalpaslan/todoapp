from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.email import send_email
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_purpose_token,
    decode_purpose_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _send_verification_email(user: User) -> None:
    token = create_purpose_token(
        user.id, "email_verify", settings.email_verify_token_expire_minutes
    )
    try:
        await send_email(
            to=user.email,
            subject="E-posta adresini dogrula",
            body=(
                "Hesabini dogrulamak icin asagidaki token'i "
                "POST /auth/verify-email adresine gonder:\n\n"
                f"{token}\n\n"
                f"Bu token {settings.email_verify_token_expire_minutes} dakika gecerlidir."
            ),
        )
    except OSError:
        # Mailpit ayakta degilse dogrulama maili gitmez ama islem basarisiz sayilmaz
        pass


async def _send_password_reset_email(user: User) -> None:
    token = create_purpose_token(
        user.id, "password_reset", settings.password_reset_token_expire_minutes
    )
    try:
        await send_email(
            to=user.email,
            subject="Sifre sifirlama",
            body=(
                "Sifreni sifirlamak icin asagidaki token'i "
                "POST /auth/reset-password adresine gonder:\n\n"
                f"{token}\n\n"
                f"Bu token {settings.password_reset_token_expire_minutes} dakika gecerlidir."
            ),
        )
    except OSError:
        pass


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta ile kayitli bir kullanici zaten var",
        )

    user = User(email=user_in.email, hashed_password=hash_password(user_in.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await _send_verification_email(user)

    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya sifre hatali",
        )

    token = create_access_token(user_id=user.id, token_version=user.token_version)
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_in.new_password is not None:
        if not verify_password(user_in.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mevcut sifre hatali",
            )
        current_user.hashed_password = hash_password(user_in.new_password)
        # sifre degisince tum cihazlardaki eski token'lar gecersiz olur
        current_user.token_version += 1

    if user_in.email is not None and user_in.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu e-posta ile kayitli bir kullanici zaten var",
            )
        current_user.email = user_in.email
        current_user.is_verified = False
        await _send_verification_email(current_user)

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.token_version += 1
    await db.commit()
    return MessageResponse(message="Cikis yapildi, tum cihazlardaki oturumlar kapatildi")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(payload: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    user_id = decode_purpose_token(payload.token, "email_verify")
    user = await db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gecersiz veya suresi dolmus dogrulama token'i",
        )

    user.is_verified = True
    await db.commit()
    return MessageResponse(message="E-posta dogrulandi")


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("5/minute")
async def resend_verification(request: Request, current_user: User = Depends(get_current_user)):
    if current_user.is_verified:
        return MessageResponse(message="E-posta zaten dogrulanmis")

    await _send_verification_email(current_user)
    return MessageResponse(message="Dogrulama maili tekrar gonderildi")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None:
        await _send_password_reset_email(user)

    # Kullanicinin var olup olmadigini sizdirmamak icin her durumda ayni cevap
    return MessageResponse(
        message="Eger bu e-posta kayitliysa, sifre sifirlama talimatlari gonderildi"
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request, payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    user_id = decode_purpose_token(payload.token, "password_reset")
    user = await db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gecersiz veya suresi dolmus sifirlama token'i",
        )

    user.hashed_password = hash_password(payload.new_password)
    # sifre sifirlaninca tum eski token'lar (calinmis olabilecekler dahil) gecersiz olur
    user.token_version += 1
    await db.commit()
    return MessageResponse(message="Sifre sifirlandi")
