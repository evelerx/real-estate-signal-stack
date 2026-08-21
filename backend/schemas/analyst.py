from pydantic import BaseModel, Field
from typing import Optional


class AnalystFlagInput(BaseModel):
    inventory_stress: Optional[str] = Field(
        None, description="LOW | MEDIUM | HIGH"
    )
    credit_exposure: Optional[str] = Field(
        None, description="YES | NO"
    )
    construction_delay_months: Optional[int] = Field(
        None, ge=0
    )
