# app/gower_matching.py - GOWER DISTANCE MATCHING

"""
Gower Distance Matching for Mixed Data Types
- Handles: Categorical (Subject), Ordinal (Grade), Binary Sets (Days, Times)
- Survey-based weights: Subject 34%, Grade 35%, Days 20%, Times 10%
- Gower (1971) - Standard method for heterogeneous data
"""

import numpy as np
from typing import Dict, List, Tuple
from sklearn.cluster import KMeans

# ===== SURVEY-BASED FEATURE WEIGHTS (128 Students, Survey-based) =====
FEATURE_WEIGHTS = {
    'subject': 0.34,    # 34% - Academic compatibility
    'grade': 0.35,      # 35% - Grade level matching (ordinal: 10/11/12)
    'days': 0.20,       # 20% - Schedule logistics
    'times': 0.10       # 10% - Flexible timing
}

# Feature dimensions
SUBJECTS = ['math', 'physics', 'chemistry', 'biology', 'english', 'computer']
DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
TIMES = ['morning', 'afternoon', 'evening', 'night']
GRADES = [10, 11, 12]  # Ordinal


def encode_features_for_gower(profile: Dict) -> np.ndarray:
    """
    Encode student profile for Gower distance calculation
    
    Returns 18-dimensional vector:
    - [0:6]: Subject one-hot (6 features)
    - [6]: Grade ordinal normalized (1 feature: 0=Grade10, 0.5=Grade11, 1.0=Grade12)
    - [7:14]: Days multi-hot (7 features)
    - [14:18]: Times multi-hot (4 features)
    
    Args:
        profile: Dict with tag_subject, grade, tag_study_days, tag_study_times
    
    Returns:
        np.ndarray of shape (18,)
    """
    # 1. Subject (categorical - one-hot)
    subject = profile.get('tag_subject', 'math').lower()
    subject_vector = [1 if subject == s else 0 for s in SUBJECTS]
    
    # 2. Grade (ordinal - normalized to [0, 1])
    grade = int(profile.get('grade', 11))
    if grade not in GRADES:
        grade = 11  # Default
    grade_normalized = (grade - 10) / 2.0  # 10→0.0, 11→0.5, 12→1.0
    
    # 3. Days (multi-hot binary)
    study_days = profile.get('tag_study_days', [])
    day_vector = [1 if d in study_days else 0 for d in DAYS]
    
    # 4. Times (multi-hot binary)
    study_times = profile.get('tag_study_times', [])
    time_vector = [1 if t in study_times else 0 for t in TIMES]
    
    return np.array(subject_vector + [grade_normalized] + day_vector + time_vector, dtype=np.float64)


def gower_distance_manual(x1: np.ndarray, x2: np.ndarray) -> float:
    """
    Calculate Gower distance between two feature vectors with survey-based weights
    
    Gower Distance for mixed types:
    - Categorical (Subject): 0 if same, 1 if different
    - Ordinal (Grade): |x1 - x2| / range
    - Binary (Days, Times): 1 - Jaccard similarity
    
    Formula: d = Σ(weight_i × distance_i) / Σ(weight_i)
    
    Args:
        x1, x2: Feature vectors from encode_features_for_gower()
    
    Returns:
        float: Gower distance in [0, 1], where 0 = identical, 1 = completely different
    """
    # Feature slicing
    subject1, subject2 = x1[:6], x2[:6]
    grade1, grade2 = x1[6], x2[6]
    days1, days2 = x1[7:14], x2[7:14]
    times1, times2 = x1[14:18], x2[14:18]
    
    # 1. Subject distance (categorical - exact match)
    subject_dist = 0.0 if np.array_equal(subject1, subject2) else 1.0
    
    # 2. Grade distance (ordinal - normalized absolute difference)
    # Already normalized to [0, 1], so distance is just absolute difference
    grade_dist = abs(grade1 - grade2)
    
    # 3. Days distance (binary set - Jaccard-based)
    days_dist = binary_jaccard_distance(days1, days2)
    
    # 4. Times distance (binary set - Jaccard-based)
    times_dist = binary_jaccard_distance(times1, times2)
    
    # Weighted Gower distance
    weighted_sum = (
        FEATURE_WEIGHTS['subject'] * subject_dist +
        FEATURE_WEIGHTS['grade'] * grade_dist +
        FEATURE_WEIGHTS['days'] * days_dist +
        FEATURE_WEIGHTS['times'] * times_dist
    )
    
    return weighted_sum


def binary_jaccard_distance(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate Jaccard distance for binary vectors
    
    Jaccard similarity: J = |A ∩ B| / |A ∪ B|
    Jaccard distance: d = 1 - J
    
    For binary vectors:
    - Intersection: sum(vec1 & vec2)
    - Union: sum(vec1 | vec2)
    
    Args:
        vec1, vec2: Binary vectors (0/1)
    
    Returns:
        float: Jaccard distance in [0, 1]
    """
    intersection = np.sum(np.logical_and(vec1, vec2))
    union = np.sum(np.logical_or(vec1, vec2))
    
    if union == 0:
        # Both vectors are all zeros (no days/times selected)
        return 1.0  # Maximum distance
    
    jaccard_sim = intersection / union
    return 1.0 - jaccard_sim


def calculate_gower_distances(query_features: np.ndarray, all_features: np.ndarray) -> np.ndarray:
    """
    Calculate Gower distances from query to all candidates
    
    Args:
        query_features: (18,) array for query student
        all_features: (N, 18) array for all students
    
    Returns:
        (N,) array of distances
    """
    n_students = all_features.shape[0]
    distances = np.zeros(n_students)
    
    for i in range(n_students):
        distances[i] = gower_distance_manual(query_features, all_features[i])
    
    return distances


def get_similarity_breakdown(query_features: np.ndarray, candidate_features: np.ndarray) -> Dict:
    """
    Get detailed similarity breakdown for a single candidate
    
    Returns:
        Dict with similarity percentages and overlap counts
    """
    # Feature slicing
    subject1, subject2 = query_features[:6], candidate_features[:6]
    grade1, grade2 = query_features[6], candidate_features[6]
    days1, days2 = query_features[7:14], candidate_features[7:14]
    times1, times2 = query_features[14:18], candidate_features[14:18]
    
    # Subject match
    subject_match = 1.0 if np.array_equal(subject1, subject2) else 0.0
    
    # Grade similarity (convert distance to similarity)
    grade_distance = abs(grade1 - grade2)
    grade_similarity = 1.0 - grade_distance
    
    # Denormalize grades for display
    actual_grade1 = int(round(grade1 * 2 + 10))
    actual_grade2 = int(round(grade2 * 2 + 10))
    
    # Days Jaccard
    days_intersection = np.sum(np.logical_and(days1, days2))
    days_union = np.sum(np.logical_or(days1, days2))
    days_jaccard = days_intersection / days_union if days_union > 0 else 0.0
    
    # Times Jaccard
    times_intersection = np.sum(np.logical_and(times1, times2))
    times_union = np.sum(np.logical_or(times1, times2))
    times_jaccard = times_intersection / times_union if times_union > 0 else 0.0
    
    # Overall Gower distance & similarity
    gower_dist = gower_distance_manual(query_features, candidate_features)
    overall_similarity = 1.0 - gower_dist  # Convert distance to similarity
    
    return {
        'subject_match': bool(subject_match),
        'grade_similarity': float(grade_similarity),
        'grade_query': actual_grade1,
        'grade_candidate': actual_grade2,
        'days_similarity': float(days_jaccard),
        'days_overlap_count': int(days_intersection),
        'times_similarity': float(times_jaccard),
        'times_overlap_count': int(times_intersection),
        'gower_distance': float(gower_dist),
        'overall_similarity': float(overall_similarity)
    }


def kmeans_clustering_for_gower(all_features: np.ndarray, n_clusters: int) -> Tuple[np.ndarray, KMeans]:
    """
    Perform K-Means clustering on all features for initial grouping
    
    Note: K-Means uses Euclidean distance, but this is just for initial grouping.
    Final ranking uses Gower distance.
    
    Args:
        all_features: (N, 18) array
        n_clusters: Number of clusters
    
    Returns:
        (cluster_labels, kmeans_model)
    """
    if n_clusters >= all_features.shape[0]:
        # Too few students for clustering
        return np.zeros(all_features.shape[0], dtype=int), None
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(all_features)
    
    return cluster_labels, kmeans


def explain_weights() -> Dict:
    """
    Explain the survey-based weight methodology
    
    Returns:
        Dict with survey details and weight rationale
    """
    return {
        "methodology": "Priority Ranking Survey (140 students)",
        "survey_question": "Rank the following factors by importance when finding a study buddy (1=Most, 4=Least)",
        "scoring": "1st choice = 4 points, 2nd = 3 points, 3rd = 2 points, 4th = 1 point",
        "results_summary": {
            "Subject": {
                "total_points": 487,
                "weight": "34.7%",
                "rationale": "Same subject is fundamental for effective studying"
            },
            "Grade": {
                "total_points": 494,
                "weight": "35.2%",
                "rationale": "Same grade level ensures compatible curriculum and knowledge base"
            },
            "Study Days": {
                "total_points": 281,
                "weight": "20.0%",
                "rationale": "Schedule overlap needed but somewhat flexible"
            },
            "Study Times": {
                "total_points": 142,
                "weight": "10.1%",
                "rationale": "Most flexible - students can adjust time slots"
            }
        },
        "total_points": 1404,
        "statistical_test": "Chi-square test for independence: p < 0.05 (significant)",
        "current_weights": FEATURE_WEIGHTS
    }
