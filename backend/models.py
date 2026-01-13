from pydantic import BaseModel
from typing import List, Optional


class FacetExtractionRequest(BaseModel):
    corpus_ids: Optional[List[str]] = None
    text: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "corpus_ids": ["CorpusId:276903484"],
                "text": None
            }
        }


class FacetResponse(BaseModel):
    purpose: str
    purpose_definition: str
    mechanism: str
    mechanism_definition: str
    evaluation: str
    evaluation_definition: str


class FacetExtractionResponse(BaseModel):
    facets: List[FacetResponse]


class HealthResponse(BaseModel):
    status: str
    message: str


class PaperSummaryRequest(BaseModel):
    corpus_id: Optional[str] = None
    text: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "corpus_id": "CorpusId:276903484",
                "text": None
            }
        }


class PaperSummaryResponse(BaseModel):
    summary: str
