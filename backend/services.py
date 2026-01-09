import os
import httpx
from google import genai
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

SEMANTIC_SCHOLAR_URL = 'https://api.semanticscholar.org/graph/v1/'
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


async def get_paper_data(corpus_ids: List[str]) -> Dict[str, Dict]:
    """Fetch paper data from Semantic Scholar API."""
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(
            f"{SEMANTIC_SCHOLAR_URL}paper/batch",
            params={'fields': 'title,abstract'},
            json={'ids': corpus_ids},
            timeout=30.0
        )
        response.raise_for_status()
        paper_list = response.json()
        
        # Create dictionary mapping corpus_ids to paper data
        papers = {}
        for corpus_id, paper_data in zip(corpus_ids, paper_list):
            papers[corpus_id] = paper_data
        
        return papers


def prompt_text_to_purpose_mechanism(papers: Dict[str, Dict], corpus_ids: List[str], text: Optional[str] = None) -> str:
    """Generate prompt for facet extraction from papers or text."""
    if text:
        prompt = f"""
        {text}"""
    else:
        prompt = f"""
    TEXTS:"""
        for id in range(0, len(corpus_ids)):
            paper = papers.get(corpus_ids[id], {})
            prompt += f"""
    Text {id + 1}
    Title: {paper.get("title", "N/A")}
    Abstract: {paper.get("abstract", "N/A")}"""
            if "introduction" in paper:
                prompt += f"""
    Background: {paper["introduction"]}"""
    
    prompt += f"""
    
    INSTRUCTIONS:
    You are ScientistGPT, an intelligent assistant that helps researchers come up with understandable, relevant, specific, feasible, and novel
    research ideas.
    Present the purpose, mechanism, and evaluation of each text above.
    The purpose is the problem being addressed (e.g., to assist with writing scientific tweetorials, to answer questions over the scientific literature).
    The mechanism is the proposed method to solve the problem (e.g., LLM chain-of-thought reasoning, AI-supported reverse outlining).
    The evaluation is the method used to determine how well the proposed solution solved the problem (e.g., lab user study, science QA benchmarks).
    
    Follow the rules below for generating each facet (purpose, mechanism, and evaluation):
    1. Specific enough to be helpful in coming up with research ideas.
    2. Substantially different from the facets you generate for other texts.
    3. Single short phrases only (no more than 7 words). If you cannot write the facet in a short phrase, it is too specific.
    4. No numbers unless they are part of a name (e.g., GPT-4, big 5 personality traits).
    5. No acronyms or abbreviations.
    6. If the text has more than one of the same type of facet, combine them into one.
    7. No referencing the purpose in the evaluation facet.
    
    Examples of bad vs good purposes:
    - bad (too specific): to generate creative writing activities for third-grade English lessons --> good: to support elementary creative writing
    - bad (too broad): to support healthcare --> good: to provide clinical decision support
    - bad (more than one purpose that are uncombined): to improve engagement between content creators and audience, to decrease negative effects of social media --> good: to improve social media creator-audience interaction
    
    Examples of bad vs good mechanisms:
    - bad (too specific, numbers that aren't part of a name, acronym): LLM chain-of-thought from gpt-3.5-turbo trained up to 11/06 with temperature=0.7 --> good: LLM chain-of-thought reasoning
    - bad (too broad): recommendation system --> good: collaborative filtering
    - bad (too broad): human-AI collaboration --> good: human-generative AI co-planning
    - bad (too broad): deep learning algorithm --> good: topic modeling
    - bad (more than one mechanism that are uncombined): content-based AI explanations, social-based AI explanations --> good: content-based and social-based AI explanations
    
    Examples of bad vs good evaluations:
    - bad (too specific, references the purpose): between-subjects 4x4 user study with 32 teachers --> good: Wizard of Oz user study
    - bad (too broad): questionnaire --> good: NASA-TLX Index
    - bad (too broad): qualitative evaluation --> good: semi-structured interviews
    
    Follow the rules below for generating definitions of each facet.
    1. Should be up to 2 sentences.
    2. Replace proper nouns with their definitions.
    3. Replace jargon with their definitions.
    4. Write out acronyms.
    5. Should be self-contained. Do NOT include information that is beyond the definition of the facet.
    6. Do NOT reuse the words already in the facet.
    
    Examples of bad vs good definitions:
    - facet: longitudinal study.
    bad: a study that evaluates the tool Toolio over the course of a year --> good: a study that takes place over a long period of time extending at least multiple days
    - facet: Toolio for creative writing.
    bad: Toolio implements SLM for generating creative writing --> good: a mixed-initiative tool that uses large language models to scaffold the process of writing creative short stories by implementing the Standard Learning Method
    - facet: to help users better understand black-box models.
    bad: to help users better understand AI-Bot-360 --> good: to help users better understand how AI models work when their algorithm cannot be fully known
    
    Make sure all information is faithful to the associated text.
    It is very important that you follow the answer format provided below!

    FORMAT FOR ANSWER:
    Text <number>
    Purpose: To <verb> <rest of purpose here>
    Purpose Definition: <purpose definition here>
    Mechanism: <noun phrase mechanism here>
    Mechanism Definition: <mechanism definition here>
    Evaluation: <noun phrase evaluation here>
    Evaluation Definition: <evaluation definition here>
    
    ANSWER:
    """

    return prompt


async def extract_facets(corpus_ids: Optional[List[str]] = None, text: Optional[str] = None) -> List[Dict]:
    """Extract facets from papers or text using Gemini AI."""
    if not corpus_ids and not text:
        raise ValueError("Either corpus_ids or text must be provided")
    
    # Get paper data if corpus_ids provided
    papers = {}
    if corpus_ids:
        papers = await get_paper_data(corpus_ids)
    
    # Generate prompt
    prompt = prompt_text_to_purpose_mechanism(papers, corpus_ids or [], text)
    
    # Call Gemini API
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    
    # Parse response (simple parsing - can be enhanced)
    response_text = response.text
    facets = parse_facet_response(response_text)
    
    return facets


def parse_facet_response(response_text: str) -> List[Dict]:
    """Parse Gemini response into structured facets."""
    facets = []
    lines = response_text.strip().split('\n')
    
    current_facet = {}
    for line in lines:
        line = line.strip()
        if line.startswith('Text'):
            if current_facet:
                facets.append(current_facet)
            current_facet = {}
        elif line.startswith('Purpose:'):
            current_facet['purpose'] = line.replace('Purpose:', '').strip()
        elif line.startswith('Purpose Definition:'):
            current_facet['purpose_definition'] = line.replace('Purpose Definition:', '').strip()
        elif line.startswith('Mechanism:'):
            current_facet['mechanism'] = line.replace('Mechanism:', '').strip()
        elif line.startswith('Mechanism Definition:'):
            current_facet['mechanism_definition'] = line.replace('Mechanism Definition:', '').strip()
        elif line.startswith('Evaluation:'):
            current_facet['evaluation'] = line.replace('Evaluation:', '').strip()
        elif line.startswith('Evaluation Definition:'):
            current_facet['evaluation_definition'] = line.replace('Evaluation Definition:', '').strip()
    
    # Add last facet
    if current_facet and len(current_facet) == 6:
        facets.append(current_facet)
    
    return facets
