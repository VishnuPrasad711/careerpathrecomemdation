import os
import json
import google.generativeai as genai
from fastapi import HTTPException

# Configure Gemini AI using the API Key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Use the pro model for complex reasoning
model = genai.GenerativeModel('gemini-2.5-flash-lite')

def get_career_recommendations(skills: str, experience: str, education: str, position: str = "") -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured on the server.")

    prompt = f"""
    You are an expert AI Career Coach and Tech Recruiter.
    Analyze the following user profile:
    - Skills: {skills}
    - Experience: {experience}
    - Education: {education}
    - Target Position: {position}


    Based on this profile, provide career paths, gap analysis, course recommendations with future guidance, and potential recruiters who hire for these roles.
    
    You MUST return ONLY a valid JSON object with EXACTLY this structure, nothing else:
    {{
      "analysis": "A detailed but concise analysis of the user's current professional standing.",
      "matched_roles": [
        {{
          "role": "Role Title 1",
          "match_percentage": 85,
          "market_demand_score": 90
        }}
      ],
      "gap_analysis": "An analysis of what the user is missing to land these top matched roles.",
      "course_recommendations": [
        {{
          "course_name": "Specific Course Title",
          "platform": "Suggest platform (e.g., Coursera, Udemy, edX)",
          "reason": "Why they should take it and how it guides their future plan."
        }}
      ],
      "potential_recruiters": ["Company Name A", "Company Name B", "Company Name C"]
    }}
    
    Ensure the response is valid JSON that can be parsed directly.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Strip code fences if the model wraps the JSON
        if text_response.startswith('```json'):
            text_response = text_response[7:]
        if text_response.startswith('```'):
            text_response = text_response[3:]
        if text_response.endswith('```'):
            text_response = text_response[:-3]
        
        parsed_json = json.loads(text_response.strip())
        return parsed_json
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch AI recommendations.")

def extract_profile_from_resume(resume_text: str) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured on the server.")

    prompt = f"""
    You are an AI assistant that extracts professional profile details from resumes.
    Read the following resume text and parse the relevant details.
    
    Resume Text:
    {resume_text}
    
    You MUST return ONLY a valid JSON object with EXACTLY this structure, nothing else:
    {{
      "skills": "A comma-separated string of skills found in the resume.",
      "experience": "A concise summary of work experience, including job titles, companies, and key achievements.",
      "education": "A concise summary of educational background, degrees, and institutions.",
      "position": "The most recent or target job position/title mentioned in the resume."
    }}
    
    Ensure the response is valid JSON that can be parsed directly. Do not include markdown code block formatting.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Strip code fences if the model wraps the JSON
        if text_response.startswith('```json'):
            text_response = text_response[7:]
        if text_response.startswith('```'):
            text_response = text_response[3:]
        if text_response.endswith('```'):
            text_response = text_response[:-3]
        
        parsed_json = json.loads(text_response.strip())
        return parsed_json
    except Exception as e:
        print(f"Error parsing resume via Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract profile from the resume.")

def chat_with_coach(messages: list, profile_data: dict = None) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured on the server.")
    
    # Build system instruction with user profile data
    system_instruction = "You are an expert AI Career Coach. Help the user with job search, resume building, interview prep, and tech skills."
    
    if profile_data:
        system_instruction += f"""
        
        USER PROFILE INFORMATION:
        - Skills: {profile_data.get('skills', 'Not provided')}
        - Experience: {profile_data.get('experience', 'Not provided')}
        - Education: {profile_data.get('education', 'Not provided')}
        - Current/Target Position: {profile_data.get('position', 'Not provided')}
        - Location: {profile_data.get('location', 'Not provided')}
        
        IMPORTANT: Always reference and incorporate the user's actual skills, experience, and background from their profile when giving advice. Personalize your responses based on their specific situation."""
    
    system_instruction += """
    
    RESPONSE GUIDELINES:
    - NEVER use markdown formatting: no **bold text**, no *italic text*, no ```code blocks```, no # headers, no - bullet points, no * bullet points, no numbered lists
    - Use plain text only with regular line breaks for readability
    - Always reference the user's resume details and profile information in your responses
    - Personalize advice based on their specific skills, experience, and background from their profile
    - Be conversational and helpful like a career coach
    - Keep responses focused on career development and job search
    - If they have specific skills mentioned in their profile, reference them in your advice
    - Format responses with paragraphs and line breaks for easy reading"""
    
    formatted_history = []
    
    for msg in messages[:-1]:
        role = "model" if msg.role == "assistant" else "user"
        formatted_history.append({"role": role, "parts": [{"text": msg.content}]})

    try:
        # Configure the model to avoid markdown
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=2048,
        )
        
        chat_model = genai.GenerativeModel(
            'gemini-2.5-flash-lite',
            generation_config=generation_config,
            system_instruction=system_instruction
        )
        
        chat = chat_model.start_chat(history=formatted_history)
        last_message = messages[-1].content
        
        response = chat.send_message(last_message)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini Chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to chat with AI.")

def analyze_ats(resume_text: str, job_description: str) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured on the server.")

    prompt = f"""
    You are an expert AI Applicant Tracking System (ATS) and Senior Technical Recruiter.
    Scan the provided resume text and compare it against the target Job Description.
    
    Resume Text:
    {resume_text}
    
    Job Description:
    {job_description}
    
    Evaluate the match and return ONLY a valid JSON object with EXACTLY this structure:
    {{
      "match_score": 85,
      "found_keywords": ["Python", "React", "Agile"],
      "missing_keywords": ["Docker", "Kubernetes", "GraphQL"],
      "suggested_changes": "A detailed paragraph containing actionable suggestions to improve the resume for this specific role."
    }}
    
    Ensure `match_score` is an integer between 0 and 100.
    Ensure `found_keywords` and `missing_keywords` are arrays of strings.
    Ensure the response is raw JSON without markdown formatting.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Strip code fences if the model wraps the JSON
        if text_response.startswith('```json'):
            text_response = text_response[7:]
        if text_response.startswith('```'):
            text_response = text_response[3:]
        if text_response.endswith('```'):
            text_response = text_response[:-3]
        
        parsed_json = json.loads(text_response.strip())
        return parsed_json
    except Exception as e:
        print(f"Error calling Gemini for ATS Analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform ATS analysis.")
