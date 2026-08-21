from pydantic import BaseModel, Field

class AnalystNoteInput(BaseModel):
    quarter: str = Field(..., description="Quarter e.g. 2024-Q1")
    note: str = Field(..., min_length=10, description="Mandatory justification")

