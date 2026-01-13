import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import FacetExtractionRequest, FacetExtractionResponse, FacetResponse, HealthResponse, PaperSummaryRequest, PaperSummaryResponse
from services import extract_facets, generate_paper_summary

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ReadFlect Backend API",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", message="Backend is running")


@app.post("/facets/extract", response_model=FacetExtractionResponse)
async def extract_paper_facets(request: FacetExtractionRequest):
    """
    Extract facets (purpose, mechanism, evaluation) from papers or text.
    
    - **corpus_ids**: List of Semantic Scholar corpus IDs (e.g., ["CorpusId:276903484"])
    - **text**: Raw text to extract facets from
    
    Either corpus_ids or text must be provided.
    """
    try:
        # Validate request
        if not request.corpus_ids and not request.text:
            raise HTTPException(
                status_code=400,
                detail="Either corpus_ids or text must be provided"
            )
        
        # Extract facets
        facets_data = await extract_facets(
            corpus_ids=request.corpus_ids,
            text=request.text
        )
        
        # Convert to response models
        facets = [
            FacetResponse(
                purpose=facet.get("purpose", ""),
                purpose_definition=facet.get("purpose_definition", ""),
                mechanism=facet.get("mechanism", ""),
                mechanism_definition=facet.get("mechanism_definition", ""),
                evaluation=facet.get("evaluation", ""),
                evaluation_definition=facet.get("evaluation_definition", "")
            )
            for facet in facets_data
        ]
        
        return FacetExtractionResponse(facets=facets)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/paper/summary", response_model=PaperSummaryResponse)
async def get_paper_summary(request: PaperSummaryRequest):
    """
    Generate an overall summary of a paper using Gemini AI.
    
    - **corpus_id**: Semantic Scholar corpus ID (e.g., "CorpusId:276903484")
    - **text**: Raw text of the paper to summarize
    
    Either corpus_id or text must be provided.
    """
    try:
        # Validate request
        if not request.corpus_id and not request.text:
            raise HTTPException(
                status_code=400,
                detail="Either corpus_id or text must be provided"
            )
        
        # Generate summary
        summary = await generate_paper_summary(
            corpus_id=request.corpus_id,
            text=request.text
        )
        
        return PaperSummaryResponse(summary=summary)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
