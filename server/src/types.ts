export type Category = '미국' | '한국' | '글로벌' | '기술' | '원자재';
export type Period = 'daily' | 'weekly' | 'monthly';
export type BriefingBlock = { type: 'heading' | 'paragraph'; text: string } | { type: 'table'; rows: string[][] };
export type Briefing = { period: Period; date: string; regions: string[]; sectors: string[]; notionUrl: string; importedAt: string; blocks: BriefingBlock[] };
export type Article = { id: string; title: string; category: Category; summary: string; source: string; publishedAt: string; url?: string; content?: string; briefing?: Briefing };
export type Report = { period: Period; generatedAt: string; summary: string; categories: { name: string; count: number }[]; highlights: Article[]; source?: string; reportDate?: string; importedAt?: string };
