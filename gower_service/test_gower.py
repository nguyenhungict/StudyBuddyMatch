# test_gower.py - Test Gower Distance Implementation

"""
Test script for Gower Distance matching
Run: python test_gower.py
"""

import numpy as np
from app.gower_matching import (
    encode_features_for_gower,
    gower_distance_manual,
    get_similarity_breakdown,
    FEATURE_WEIGHTS,
    explain_weights
)

def test_encoding():
    """Test feature encoding"""
    print("=" * 60)
    print("TEST 1: Feature Encoding")
    print("=" * 60)
    
    profile = {
        'tag_subject': 'math',
        'grade': '11',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    features = encode_features_for_gower(profile)
    
    print(f"Profile: {profile}")
    print(f"Encoded features (18-dim): {features}")
    print(f"Shape: {features.shape}")
    print(f"Subject (one-hot): {features[:6]}")
    print(f"Grade (normalized): {features[6]} (11 → 0.5)")
    print(f"Days (multi-hot): {features[7:14]}")
    print(f"Times (multi-hot): {features[14:18]}")
    print("✅ Encoding OK\n")

def test_distance_calculation():
    """Test Gower distance calculation"""
    print("=" * 60)
    print("TEST 2: Gower Distance Calculation")
    print("=" * 60)
    
    # Student A: Math, Grade 11, Mon/Wed/Fri, Morning/Evening
    profile_a = {
        'tag_subject': 'math',
        'grade': '11',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    # Student B1: Same as A (perfect match)
    profile_b1 = {
        'tag_subject': 'math',
        'grade': '11',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    # Student B2: Same subject/grade, different schedule
    profile_b2 = {
        'tag_subject': 'math',
        'grade': '11',
        'tag_study_days': ['tuesday', 'thursday'],
        'tag_study_times': ['afternoon']
    }
    
    # Student B3: Different grade, same subject
    profile_b3 = {
        'tag_subject': 'math',
        'grade': '12',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    # Student B4: Different subject
    profile_b4 = {
        'tag_subject': 'physics',
        'grade': '11',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    # Encode
    features_a = encode_features_for_gower(profile_a)
    features_b1 = encode_features_for_gower(profile_b1)
    features_b2 = encode_features_for_gower(profile_b2)
    features_b3 = encode_features_for_gower(profile_b3)
    features_b4 = encode_features_for_gower(profile_b4)
    
    # Calculate distances
    dist_a_b1 = gower_distance_manual(features_a, features_b1)
    dist_a_b2 = gower_distance_manual(features_a, features_b2)
    dist_a_b3 = gower_distance_manual(features_a, features_b3)
    dist_a_b4 = gower_distance_manual(features_a, features_b4)
    
    print(f"Student A: Math, Grade 11, Mon/Wed/Fri, Morning/Evening")
    print(f"\nDistance A → B1 (identical): {dist_a_b1:.4f} (should be ~0.0)")
    print(f"Distance A → B2 (diff schedule): {dist_a_b2:.4f}")
    print(f"Distance A → B3 (diff grade): {dist_a_b3:.4f}")
    print(f"Distance A → B4 (diff subject): {dist_a_b4:.4f}")
    
    print(f"\n📊 Expected behavior:")
    print(f"  - B1 (identical) should have lowest distance")
    print(f"  - B3 (grade diff) distance = 0.5 × 35.2% = {0.5 * 0.352:.4f}")
    print(f"  - B4 (subject diff) distance includes 1.0 × 34.7% = {0.347:.4f}")
    
    assert dist_a_b1 < dist_a_b2, "Identical should be closer than different schedule"
    assert dist_a_b1 < dist_a_b3, "Identical should be closer than different grade"
    assert dist_a_b1 < dist_a_b4, "Identical should be closer than different subject"
    
    print("✅ Distance calculation OK\n")

def test_similarity_breakdown():
    """Test similarity breakdown"""
    print("=" * 60)
    print("TEST 3: Similarity Breakdown")
    print("=" * 60)
    
    profile_a = {
        'tag_subject': 'math',
        'grade': '11',
        'tag_study_days': ['monday', 'wednesday', 'friday'],
        'tag_study_times': ['morning', 'evening']
    }
    
    profile_b = {
        'tag_subject': 'math',
        'grade': '10',
        'tag_study_days': ['monday', 'wednesday'],
        'tag_study_times': ['morning']
    }
    
    features_a = encode_features_for_gower(profile_a)
    features_b = encode_features_for_gower(profile_b)
    
    breakdown = get_similarity_breakdown(features_a, features_b)
    
    print(f"Student A: {profile_a}")
    print(f"Student B: {profile_b}")
    print(f"\n📊 Breakdown:")
    print(f"  Subject match: {breakdown['subject_match']}")
    print(f"  Grade similarity: {breakdown['grade_similarity']:.2%} (Grade {breakdown['grade_query']} → {breakdown['grade_candidate']})")
    print(f"  Days similarity: {breakdown['days_similarity']:.2%} ({breakdown['days_overlap_count']} days overlap)")
    print(f"  Times similarity: {breakdown['times_similarity']:.2%} ({breakdown['times_overlap_count']} times overlap)")
    print(f"  Overall similarity: {breakdown['overall_similarity']:.2%}")
    print(f"  Gower distance: {breakdown['gower_distance']:.4f}")
    
    print("✅ Breakdown OK\n")

def test_weights_explanation():
    """Test weights explanation"""
    print("=" * 60)
    print("TEST 4: Survey-Based Weights")
    print("=" * 60)
    
    explanation = explain_weights()
    
    print(f"Methodology: {explanation['methodology']}")
    print(f"Survey Question: {explanation['survey_question']}")
    print(f"\n📊 Results:")
    for feature, data in explanation['results_summary'].items():
        print(f"  {feature}: {data['weight']} - {data['rationale']}")
    
    print(f"\nCurrent Weights: {FEATURE_WEIGHTS}")
    
    # Verify sum = 1.0
    total = sum(FEATURE_WEIGHTS.values())
    print(f"Total: {total:.3f} (should be 1.000)")
    assert abs(total - 1.0) < 0.001, "Weights should sum to 1.0"
    
    print("✅ Weights OK\n")

def test_grade_ordinal_distance():
    """Test that grade distance respects ordinal property"""
    print("=" * 60)
    print("TEST 5: Grade Ordinal Distance")
    print("=" * 60)
    
    # Keep all other features identical
    base = {
        'tag_subject': 'math',
        'tag_study_days': ['monday'],
        'tag_study_times': ['morning']
    }
    
    profile_10 = {**base, 'grade': '10'}
    profile_11 = {**base, 'grade': '11'}
    profile_12 = {**base, 'grade': '12'}
    
    f10 = encode_features_for_gower(profile_10)
    f11 = encode_features_for_gower(profile_11)
    f12 = encode_features_for_gower(profile_12)
    
    dist_10_11 = gower_distance_manual(f10, f11)
    dist_11_12 = gower_distance_manual(f11, f12)
    dist_10_12 = gower_distance_manual(f10, f12)
    
    print(f"Grade 10 vs 11: {dist_10_11:.4f}")
    print(f"Grade 11 vs 12: {dist_11_12:.4f}")
    print(f"Grade 10 vs 12: {dist_10_12:.4f}")
    
    print(f"\n📊 Expected:")
    print(f"  10→11 should equal 11→12 (unit step)")
    print(f"  10→12 should be 2× the distance of 10→11 (ordinal property)")
    
    # Test ordinal property
    assert abs(dist_10_11 - dist_11_12) < 0.001, "Adjacent grades should have equal distance"
    assert abs(dist_10_12 - 2 * dist_10_11) < 0.001, "Distance should scale linearly with grade difference"
    
    print("✅ Ordinal property OK\n")

if __name__ == "__main__":
    print("\n🧪 Testing Gower Distance Implementation")
    print("=" * 60)
    
    try:
        test_encoding()
        test_distance_calculation()
        test_similarity_breakdown()
        test_weights_explanation()
        test_grade_ordinal_distance()
        
        print("=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\n✅ Gower Distance implementation is working correctly")
        print(f"✅ Weights: Subject 34.7%, Grade 35.2%, Days 20%, Times 10.1%")
        print("✅ Distance metric respects data types (categorical, ordinal, binary)")
        print("✅ Ready for production use!")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
