# app/main.py - GOWER DISTANCE MATCHING

"""
Gower Distance Matching API (Survey-based Weights)
- Algorithm: Gower Distance (1971) for mixed data types
- Features: Subject (categorical), Grade (ordinal 10/11/12), Days + Times (binary sets)
- Weights: Subject 34.7%, Grade 35.2%, Days 20%, Times 10.1%
- Data source: Real-time from Backend API
- Clustering: Optional K-Means for initial grouping, Gower for final ranking
"""

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from . import schemas
from .gower_matching import (
    encode_features_for_gower,
    calculate_gower_distances,
    get_similarity_breakdown,
    kmeans_clustering_for_gower,
    FEATURE_WEIGHTS,
    SUBJECTS,
    DAYS,
    TIMES,
    explain_weights
)

API_DESCRIPTION = """
API Tìm kiếm Bạn học - Gower Distance Matching 🎯

**Đặc điểm:**
- Gower Distance: Standard method cho mixed data types (categorical + ordinal + binary)
- Survey-based weights từ 128 học sinh
- Weights: Subject 34%, Grade 35%, Days 20%, Times 10%
- Real-time clustering + distance-based ranking
- Workflow: FETCH → ENCODE → CLUSTER (optional) → GOWER DISTANCE → SORT
"""

app = FastAPI(
    title="Study Buddy Matching API - Gower Distance",
    description=API_DESCRIPTION,
    version="9.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== DATABASE INTEGRATION =====
import httpx
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:8888")

async def fetch_users_from_backend():
    """Fetch all active users from Backend API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BACKEND_URL}/users/for-matching")
            response.raise_for_status()
            users = response.json()
            print(f"✅ [Backend] Fetched {len(users)} users")
            return users
    except Exception as e:
        print(f"❌ [Backend] Error: {e}")
        return []

def map_backend_to_ml_format(backend_user: Dict) -> Dict:
    """Map backend user format to ML format"""
    # Subject mapping
    subject_map = {
        'Mathematics': 'math',
        'Physics': 'physics',
        'Chemistry': 'chemistry',
        'Biology': 'biology',
        'English': 'english',
        'Computer Science': 'computer',
        'math': 'math',
        'physics': 'physics',
        'chemistry': 'chemistry',
        'biology': 'biology',
        'english': 'english',
        'computer': 'computer'
    }
    
    # Days mapping
    day_map = {
        'Monday': 'monday',
        'Tuesday': 'tuesday',
        'Wednesday': 'wednesday',
        'Thursday': 'thursday',
        'Friday': 'friday',
        'Saturday': 'saturday',
        'Sunday': 'sunday',
    }
    
    # Times mapping
    time_map = {
        'Morning (6am-12pm)': 'morning',
        'Afternoon (12pm-6pm)': 'afternoon',
        'Evening (6pm-9pm)': 'evening',
        'Night (9pm-6am)': 'night',
        'Morning': 'morning',
        'Afternoon': 'afternoon',
        'Evening': 'evening',
        'Night': 'night',
    }
    
    # Transform
    subject_input = backend_user.get('tag_subject', 'math')
    subject_code = subject_map.get(str(subject_input), 'math')
    
    days_display = backend_user.get('tag_study_days', [])
    days_codes = [day_map.get(d, d.lower()) for d in days_display if d]
    if not days_codes:
        days_codes = ['monday', 'wednesday', 'friday']
    
    times_display = backend_user.get('tag_study_times', [])
    times_codes = [time_map.get(t, t.lower()) for t in times_display if t]
    if not times_codes:
        times_codes = ['morning', 'evening']
    
    # Grade normalization
    grade_raw = backend_user.get('grade', '11')
    try:
        grade = int(grade_raw)
    except:
        grade = 11
    
    return {
        'student_id': backend_user.get('user_id', ''),
        'name': backend_user.get('name', 'Student'),
        'email': backend_user.get('email', ''),
        'school': backend_user.get('school', ''),
        'grade': str(grade),
        'bio': backend_user.get('bio', ''),
        'tag_subject': subject_code,
        'tag_study_days': days_codes,
        'tag_study_times': times_codes,
    }

def calculate_optimal_clusters(n_users: int) -> int:
    """Calculate optimal number of clusters based on user count"""
    if n_users < 200:
        multiplier = 2.0
    elif n_users <= 500:
        multiplier = 2.5
    else:
        multiplier = 3.0
    
    optimal_k = int(6 * multiplier)  # 6 subjects × multiplier
    return max(6, min(optimal_k, 20))

async def find_similar_with_gower(profile: Dict, top_n: int = 5, use_clustering: bool = True) -> tuple:
    """
    Find matches using Gower Distance
    
    Workflow:
    1. FETCH: Get users from Backend
    2. MAP: Convert to ML format
    3. ENCODE: Convert to Gower-friendly features (18-dim)
    4. CLUSTER (optional): K-Means for initial grouping
    5. FILTER: Same subject (required)
    6. GOWER DISTANCE: Calculate weighted Gower distance
    7. SORT: Return top N by distance (ascending)
    
    Args:
        profile: Query student profile
        top_n: Number of matches to return
        use_clustering: Whether to use K-Means pre-filtering
    
    Returns:
        (result_list, cluster_id)
    """
    # === 1. FETCH ===
    backend_users = await fetch_users_from_backend()
    
    if len(backend_users) == 0:
        raise HTTPException(status_code=404, detail="Chưa có học sinh trong hệ thống")
    
    print(f"📊 [ML] Processing {len(backend_users)} users")
    
    # === 2. MAP ===
    students_data = []
    for backend_user in backend_users:
        ml_user = map_backend_to_ml_format(backend_user)
        ml_user['features'] = encode_features_for_gower(ml_user)
        students_data.append(ml_user)
    
    students_df = pd.DataFrame(students_data)
    print(f"✅ [ML] Converted {len(students_df)} users to ML format")
    
    # Map query profile
    ml_profile = map_backend_to_ml_format(profile)
    query_features = encode_features_for_gower(ml_profile)
    
    # === 3. GET ALL FEATURES ===
    all_features = np.vstack(students_df['features'].values)
    
    # === 4. OPTIONAL CLUSTERING ===
    query_cluster = 0
    candidate_indices = list(range(len(students_df)))
    
    if use_clustering and len(students_df) >= 10:
        optimal_clusters = calculate_optimal_clusters(len(students_df))
        effective_clusters = min(optimal_clusters, len(students_df))
        
        print(f"🎯 [ML] Using {effective_clusters} clusters")
        
        cluster_labels, kmeans = kmeans_clustering_for_gower(all_features, effective_clusters)
        
        if kmeans is not None:
            query_cluster = kmeans.predict(query_features.reshape(1, -1))[0]
            candidate_indices = np.where(cluster_labels == query_cluster)[0].tolist()
            print(f"🎯 [ML] Query assigned to cluster {query_cluster} ({len(candidate_indices)} candidates)")
        else:
            print(f"⚠️ [ML] Clustering skipped (too few users)")
    else:
        print(f"📊 [ML] Direct matching (no clustering)")
    
    # === 5. SUBJECT FILTER ===
    query_subject = ml_profile.get('tag_subject', '').lower()
    same_subject_indices = [
        idx for idx in candidate_indices
        if students_df.iloc[idx]['tag_subject'].lower() == query_subject
    ]
    
    if len(same_subject_indices) == 0:
        # Fallback: search entire database
        print(f"⚠️ [ML] No subject match in cluster, searching database")
        same_subject_indices = [
            idx for idx in range(len(students_df))
            if students_df.iloc[idx]['tag_subject'].lower() == query_subject
        ]
        
        if len(same_subject_indices) == 0:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy ai học {query_subject}")
    
    print(f"✅ [ML] Found {len(same_subject_indices)} candidates with subject: {query_subject}")
    
    # === 6. GOWER DISTANCE CALCULATION ===
    candidate_features = all_features[same_subject_indices]
    distances = calculate_gower_distances(query_features, candidate_features)
    
    # === 7. SORT AND RANK ===
    # Sort ALL candidates by distance (no limit here - let backend decide)
    sorted_idx = np.argsort(distances)  # Remove [:top_n] to return all
    
    # But to avoid overwhelming response, cap at reasonable max (e.g., 100)
    max_results = min(len(sorted_idx), 100)  # Max 100 results
    sorted_idx = sorted_idx[:max_results]
    
    matched_indices = [same_subject_indices[i] for i in sorted_idx]
    matched_distances = distances[sorted_idx]
    
    print(f"📊 [ML] Returning {len(matched_indices)} Gower-ranked results (capped at 100)")
    
    # === 8. BUILD RESULT ===
    result_df = students_df.iloc[matched_indices].copy()
    result_df['gower_distance'] = matched_distances
    result_df['cluster'] = query_cluster
    
    # Add detailed breakdown
    for i, idx in enumerate(matched_indices):
        breakdown = get_similarity_breakdown(
            query_features,
            students_df.iloc[idx]['features']
        )
        
        result_df.at[result_df.index[i], 'subject_match'] = breakdown['subject_match']
        result_df.at[result_df.index[i], 'grade_similarity'] = breakdown['grade_similarity']
        result_df.at[result_df.index[i], 'days_similarity'] = breakdown['days_similarity']
        result_df.at[result_df.index[i], 'days_overlap_count'] = breakdown['days_overlap_count']
        result_df.at[result_df.index[i], 'times_similarity'] = breakdown['times_similarity']
        result_df.at[result_df.index[i], 'times_overlap_count'] = breakdown['times_overlap_count']
        result_df.at[result_df.index[i], 'overall_similarity'] = breakdown['overall_similarity']
    
    print(f"✅ [ML] Returning top {len(result_df)} Gower matches")
    
    return result_df.to_dict('records'), int(query_cluster)

# ===== HELPER FUNCTIONS =====
def get_display_list(items: List[str]) -> List[str]:
    """Capitalize for display"""
    seen = set()
    unique_items = []
    for item in items:
        if item not in seen:
            seen.add(item)
            unique_items.append(item)
    return [item.capitalize() for item in unique_items]

# ===== ENDPOINTS =====

@app.get("/")
async def root():
    """API status"""
    users = await fetch_users_from_backend()
    optimal_k = calculate_optimal_clusters(len(users))
    
    return {
        "status": "OK",
        "mode": "Gower Distance Matching (Survey-based)",
        "total_students": len(users),
        "backend_url": BACKEND_URL,
        "algorithm": "Gower Distance (mixed data types)",
        "weights": FEATURE_WEIGHTS,
        "n_clusters": {
            "current": optimal_k,
            "strategy": "Dynamic K-Means pre-filtering (optional)"
        },
        "description": "Survey-based: Subject 34%, Grade 35%, Days 20%, Times 10%"
    }

@app.post("/match", response_model=schemas.MatchingResponse, tags=["Matching"])
async def match(profile: schemas.StudentProfile, top_n: int = 5):
    """
    Tìm bạn học với Gower Distance
    
    **Weights (Survey-based from 128 students):**
    - Subject: 34% (Categorical match)
    - Grade: 35% (Ordinal: 10/11/12)
    - Days: 20% (Binary set overlap)
    - Times: 10% (Binary set overlap)
    """
    try:
        matched_results, query_cluster = await find_similar_with_gower(
            profile.dict(), 
            top_n,
            use_clustering=False  # Disable clustering for pure Gower distance testing
        )
        
        if len(matched_results) == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy ai phù hợp")
        
        matched_partners = []
        for idx, partner in enumerate(matched_results, start=1):
            # Gower distance → similarity percentage
            # Distance: 0 (perfect) to 1 (completely different)
            # Similarity: 1 (perfect) to 0 (no match)
            similarity = partner.get('overall_similarity', 0.0)
            
            matched_partners.append(schemas.MatchedPartner(
                rank=idx,
                student_id=partner.get('student_id', ''),
                name=partner.get('name', 'Student'),
                school=partner.get('school'),
                grade=partner.get('grade', '11'),
                subject_selected=partner.get('tag_subject', 'math'),
                
                # Overall similarity (0-1, higher = better)
                similarity_score=float(similarity),
                
                # Detailed breakdown
                days_match_score=float(partner.get('days_similarity', 0.0)),
                times_match_score=float(partner.get('times_similarity', 0.0)),
                days_overlap_count=int(partner.get('days_overlap_count', 0)),
                times_overlap_count=int(partner.get('times_overlap_count', 0)),
                
                is_subject_match=bool(partner.get('subject_match', True)),
                available_days=get_display_list(partner.get('tag_study_days', [])),
                available_times=get_display_list(partner.get('tag_study_times', [])),
                email=partner.get('email', ''),
                phone=partner.get('phone')
            ))
        
        return schemas.MatchingResponse(
            query_student={
                "name": profile.name,
                "subject": profile.tag_subject,
                "grade": profile.grade,
                "available_days": get_display_list(profile.tag_study_days),
                "available_times": get_display_list(profile.tag_study_times)
            },
            cluster_id=query_cluster,
            total_candidates=len(matched_results),
            matched_partners=matched_partners,
            message=f"✅ {len(matched_partners)} matches (Gower: 34% Subject, 35% Grade, 20% Days, 10% Times)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [ML] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/features", tags=["Info"])
def get_feature_info():
    """Feature information and weights explanation"""
    return {
        "algorithm": "Gower Distance",
        "learning_type": "Distance-based (Unsupervised clustering optional)",
        "encoding": "Mixed: Categorical + Ordinal + Binary",
        "matching_metric": "Weighted Gower Distance",
        "weights": explain_weights(),
        "total_features": 18,
        "breakdown": {
            "subjects": {
                "count": 6,
                "type": "Categorical",
                "encoding": "One-Hot",
                "weight": f"{FEATURE_WEIGHTS['subject']*100:.1f}%",
                "options": SUBJECTS,
                "distance": "0 if same, 1 if different"
            },
            "grade": {
                "count": 1,
                "type": "Ordinal",
                "encoding": "Normalized [0, 1]",
                "weight": f"{FEATURE_WEIGHTS['grade']*100:.1f}%",
                "options": ["10", "11", "12"],
                "distance": "|grade1 - grade2| / range"
            },
            "days": {
                "count": 7,
                "type": "Binary Set",
                "encoding": "Multi-Hot",
                "weight": f"{FEATURE_WEIGHTS['days']*100:.1f}%",
                "options": DAYS,
                "distance": "1 - Jaccard Similarity"
            },
            "times": {
                "count": 4,
                "type": "Binary Set",
                "encoding": "Multi-Hot",
                "weight": f"{FEATURE_WEIGHTS['times']*100:.1f}%",
                "options": TIMES,
                "distance": "1 - Jaccard Similarity"
            }
        },
        "reference": "Gower, J. C. (1971). A general coefficient of similarity and some of its properties. Biometrics, 27(4), 857-871."
    }

@app.get("/stats", tags=["Info"])
async def get_stats():
    """Statistics about users and distribution"""
    users = await fetch_users_from_backend()
    
    if len(users) == 0:
        return {"error": "No users in database"}
    
    # Convert to ML format
    students_data = []
    for user in users:
        ml_user = map_backend_to_ml_format(user)
        students_data.append(ml_user)
    
    students_df = pd.DataFrame(students_data)
    
    # Distributions
    subject_counts = students_df['tag_subject'].value_counts().to_dict()
    grade_counts = students_df['grade'].value_counts().to_dict()
    optimal_k = calculate_optimal_clusters(len(students_df))
    
    return {
        "total_users": len(students_df),
        "subject_distribution": subject_counts,
        "grade_distribution": grade_counts,
        "clustering": {
            "optimal_clusters": optimal_k,
            "avg_users_per_cluster": len(students_df) / optimal_k,
            "strategy": "Dynamic K-Means (optional pre-filtering)"
        },
        "weights": FEATURE_WEIGHTS,
        "algorithm": "Gower Distance"
    }

@app.get("/weights", tags=["Info"])
def get_weight_explanation():
    """Get detailed explanation of survey-based weights"""
    return explain_weights()
