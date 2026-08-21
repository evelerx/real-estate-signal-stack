from pydantic import BaseModel, Field


class ConsultationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=160)
    role: str | None = Field(default=None, max_length=120)
    interest: str = Field(min_length=3, max_length=200)
    preferred_date: str | None = Field(default=None, max_length=20)
    preferred_time: str | None = Field(default=None, max_length=80)
    message: str | None = Field(default=None, max_length=2000)


class ConsultationCreateResponse(BaseModel):
    id: int
    status: str
