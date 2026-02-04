import { ApiProperty } from '@nestjs/swagger';

export interface TrendItem {
  name: string;
  count: number;
  percentage: number;
}

export interface UserGrowthDataItem {
  date: string;
  activeUsers: number;
  newUsers: number;
}

export class AdminStatsDto {
  @ApiProperty({ description: 'Total pending reports' })
  pendingReports: number;

  @ApiProperty({ description: 'Total resolved reports' })
  resolvedReports: number;

  @ApiProperty({ description: 'Total violations detected today' })
  violationsToday: number;

  @ApiProperty({ description: 'Total active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Reports by type' })
  reportsByType: Record<string, number>;

  @ApiProperty({ description: 'Reports by status' })
  reportsByStatus: Record<string, number>;

  @ApiProperty({ description: 'Popular subjects (all subjects sorted by usage)' })
  popularSubjects: TrendItem[];

  @ApiProperty({ description: 'Popular levels (all levels sorted by usage)' })
  popularLevels: TrendItem[];

  @ApiProperty({ description: 'Popular learning goals (all goals sorted by usage)' })
  popularLearningGoals: TrendItem[];

  @ApiProperty({ description: 'Popular study styles (all styles sorted by usage)' })
  popularStudyStyles: TrendItem[];

  @ApiProperty({ description: 'User growth data (daily breakdown)' })
  userGrowthData: UserGrowthDataItem[];
}


