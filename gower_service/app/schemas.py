# app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# ===== INPUT SCHEMA =====
class StudentProfile(BaseModel):
    """Thông tin hồ sơ học sinh để tìm kiếm bạn học (match với Prisma database)"""
    
    # Thông tin cơ bản
    user_id: Optional[str] = Field(None, description="UUID thực từ database") 
    name: str = Field(..., example="Nguyễn Văn An", description="Họ tên học sinh")
    email: str = Field(..., example="student001@edu.vn", description="Email")
    phone: Optional[str] = Field(None, example="0912345678", description="Số điện thoại")
    school: Optional[str] = Field(None, example="THPT Lê Hồng Phong", description="Trường học")
    grade: str = Field(..., example="11", description="Khối lớp")
    bio: Optional[str] = Field(None, description="Giới thiệu bản thân")
    
    # Tags chính (matching Prisma structure)
    tag_subject: str = Field(..., example="Mathematics", description="Môn học (Mathematics, Physics, Chemistry, Biology, English, Computer Science)")
    tag_study_days: List[str] = Field(..., example=["Monday", "Wednesday"], description="Các ngày rảnh học")
    tag_study_times: List[str] = Field(..., example=["Morning (6am-12pm)", "Evening (6pm-9pm)"], description="Các buổi rảnh học")
    
    # Tags phụ (optional)
    tag_study_style: Optional[str] = Field(None, example="visual", description="Phong cách học")
    tag_learning_goal: Optional[str] = Field(None, example="exam", description="Mục tiêu học tập")


# ===== OUTPUT SCHEMA =====
class MatchedPartner(BaseModel):
    """Thông tin một bạn học được tìm thấy"""
    rank: int = Field(..., example=1, description="Thứ hạng (1 = match tốt nhất)")
    student_id: str = Field(..., example="HS00001", description="Mã học sinh")
    name: str = Field(..., example="Trần Thị Bình", description="Họ tên")
    school: Optional[str] = Field(None, example="THPT Trần Phú", description="Trường")
    grade: str = Field(..., example="11", description="Khối")
    subject_selected: str = Field(..., example="math", description="Môn học ưu tiên")
    
    # THAY ĐỔI: Jaccard score (0.0-1.0, càng cao càng match tốt)
    similarity_score: float = Field(..., example=0.75, description="Jaccard Similarity (0.0-1.0, càng cao càng giống)")
    
    # THÊM MỚI: Chi tiết overlap
    days_match_score: Optional[float] = Field(0.0, example=0.67, description="Jaccard score cho ngày (0.0-1.0)")
    times_match_score: Optional[float] = Field(0.0, example=0.50, description="Jaccard score cho giờ (0.0-1.0)")
    days_overlap_count: Optional[int] = Field(0, example=2, description="Số ngày trùng")
    times_overlap_count: Optional[int] = Field(0, example=1, description="Số khung giờ trùng")
    
    is_subject_match: bool = Field(..., example=True, description="Có cùng môn học không")
    available_days: List[str] = Field(..., example=["Monday", "Saturday"], description="Ngày rảnh")
    available_times: List[str] = Field(..., example=["Morning", "Evening"], description="Buổi rảnh")
    email: str = Field(..., example="student002@edu.vn", description="Email liên hệ")
    phone: Optional[str] = Field(None, example="0987654321", description="Số điện thoại")


class MatchingResponse(BaseModel):
    """Kết quả tìm kiếm bạn học"""
    query_student: Dict[str, Any] = Field(..., description="Thông tin học sinh đang tìm kiếm")
    cluster_id: int = Field(..., example=3, description="Cluster ID mà query student được gán vào")
    total_candidates: int = Field(..., example=15, description="Số học sinh trong cùng cluster")
    matched_partners: List[MatchedPartner] = Field(..., description="Danh sách bạn học phù hợp")
    message: str = Field(..., example="Tìm thấy 5 bạn học phù hợp trong cluster 3!", description="Thông báo")
