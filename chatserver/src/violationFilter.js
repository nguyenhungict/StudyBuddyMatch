class ViolationFilter {
    constructor() {
        this.keywords = [];
        this.lastFetch = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.API_URL = process.env.API_URL || 'http://localhost:8888';
    }

    async loadKeywords() {
        try {
            const response = await fetch(`${this.API_URL}/admin/violation-keywords`);
            if (!response.ok) {
                console.error('❌ Failed to fetch violation keywords');
                return;
            }

            const data = await response.json();
            console.log('🔍 API Response:', JSON.stringify(data).substring(0, 200));

            // API returns grouped by type: { SPAM: [{text: "..."}, ...], HARASSMENT: [...], ... }
            const keywordsData = data.data || {};

            // Flatten all keyword arrays and extract text
            const allKeywords = [];
            for (const type in keywordsData) {
                const typeKeywords = keywordsData[type];
                if (Array.isArray(typeKeywords)) {
                    typeKeywords.forEach(k => {
                        if (k.text) {
                            allKeywords.push(k.text.toLowerCase());
                        }
                    });
                }
            }

            this.keywords = allKeywords;
            this.lastFetch = Date.now();
            console.log(`✅ Loaded ${this.keywords.length} violation keywords:`, this.keywords);
        } catch (error) {
            console.error('❌ Error loading violation keywords:', error);
        }
    }

    async ensureKeywords() {
        // Refresh if cache expired or not loaded
        if (!this.lastFetch || (Date.now() - this.lastFetch > this.CACHE_DURATION)) {
            await this.loadKeywords();
        }
    }

    filterContent(content) {
        if (!content || typeof content !== 'string') return content;

        console.log('🔍 Filtering content:', content);
        console.log('🔍 Keywords:', this.keywords);

        let filtered = content;

        for (const keyword of this.keywords) {
            // Case-insensitive replacement with asterisks
            const regex = new RegExp(keyword, 'gi');
            filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
        }

        if (filtered !== content) {
            console.log('✅ Content filtered:', content, '→', filtered);
        }

        return filtered;
    }
}

// Singleton instance
export const violationFilter = new ViolationFilter();
