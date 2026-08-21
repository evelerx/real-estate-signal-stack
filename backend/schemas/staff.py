from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StaffUserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6, max_length=128)
    role: str


class StaffUserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    is_active: Optional[bool] = None


class StaffUserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
