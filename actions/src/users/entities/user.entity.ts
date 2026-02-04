import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  // --- THÔNG TIN PROFILE MỚI (STEP 1-6) ---
  @Column({ nullable: true })
  school: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  gradeLevel: string;

  @Column({ nullable: true, type: 'text' }) // Bio có thể dài nên dùng text
  bio: string;

  @Column('simple-array', { nullable: true }) // Lưu mảng các môn học: "Math,Physics"
  subjects: string[];

  // Lưu object JSON cho lịch học (VD: { days: ["Mon"], times: ["Morning"] })
  @Column('jsonb', { nullable: true }) 
  studySchedule: any; 

  @Column({ nullable: true })
  studyStyle: string; // Pomodoro, Deep Work...

  @Column('simple-array', { nullable: true }) // Mảng mục tiêu
  learningGoals: string[];

  @Column({ nullable: true })
  recentAchievement: string;
  
// type: 'text' -> Cho phép lưu chuỗi Base64 siêu dài
  @Column({ nullable: true, type: 'text' }) 
  avatar: string;
  // ----------------------------------------

  // Các trường cũ giữ nguyên
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}