from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=1, max_length=72)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str


class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    current_password: str | None = Field(default=None, max_length=72)
    new_password: str | None = Field(default=None, min_length=8, max_length=72)

    @model_validator(mode="after")
    def new_password_requires_current(self) -> "UserUpdate":
        if self.new_password is not None and self.current_password is None:
            raise ValueError("Sifre degistirmek icin mevcut sifre gerekli")
        return self


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(max_length=255)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=72)


class VerifyEmailRequest(BaseModel):
    token: str
