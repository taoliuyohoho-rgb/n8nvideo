// 轻量地理归一化工具：将地点/别名归一化到国家名称

export function normalizeCountry(inputRaw: string): string | null {
	const input = (inputRaw || '').trim().toLowerCase();
	if (!input) return null;

	// 采用中文国家名作为规范名
	const countrySynonyms: Record<string, string[]> = {
		'中国': [
			'中国', 'china', 'prc', 'cn', '大陆', '中国大陆', '内地',
			'北京', '上海', '广州', '深圳', '杭州', '苏州', '南京', '天津', '成都', '重庆', '武汉', '西安',
			'长沙', '郑州', '宁波', '厦门', '福州', '青岛', '大连', '昆明', '合肥', '济南', '石家庄',
			'无锡', '温州', '绍兴', '嘉兴', '珠海', '佛山', '东莞', '汕头', '泉州', '南昌', '南宁',
			'贵阳', '哈尔滨', '沈阳', '长春', '乌鲁木齐', '西宁', '兰州', '银川', '呼和浩特', '拉萨',
			'浙江', '江苏', '广东', '山东', '河南', '河北', '湖北', '湖南', '福建', '四川', '陕西',
			'云南', '贵州', '辽宁', '吉林', '黑龙江', '广西', '海南', '山西', '内蒙古', '甘肃', '青海', '宁夏', '新疆', '西藏'
		],
		'马来西亚': [
			'马来西亚', 'malaysia', 'my', '大马', '吉隆坡', '槟城', '柔佛', '雪兰莪', '马六甲', '沙巴', '砂拉越', '霹雳', '彭亨', '吉打', '登嘉楼', '玻璃市', '布城', '纳闽'
		],
		'泰国': ['泰国', 'thailand', 'th', '曼谷', '清迈', '芭提雅'],
		'越南': ['越南', 'vietnam', 'vn', '河内', '胡志明'],
		'印度尼西亚': ['印度尼西亚', '印尼', 'indonesia', 'id', '雅加达', '巴厘岛'],
		'菲律宾': ['菲律宾', 'philippines', 'ph', '马尼拉', '宿务'],
		'新加坡': ['新加坡', 'singapore', 'sg'],
		'美国': ['美国', 'united states', 'usa', 'us', 'nyc', 'new york', 'los angeles', 'san francisco', 'chicago', 'houston']
	};

	for (const [country, aliases] of Object.entries(countrySynonyms)) {
		for (const alias of aliases) {
			if (input.includes(alias.toLowerCase())) return country;
		}
	}

	return null;
}

export function inferCountryFromLocation(locationRaw: string | undefined | null): string | null {
	if (!locationRaw) return null;
	const normalized = normalizeCountry(locationRaw);
	return normalized;
}

export function isCountryMatch(aRaw: string, bRaw: string): boolean {
	const a = normalizeCountry(aRaw) || aRaw?.trim().toLowerCase();
	const b = normalizeCountry(bRaw) || bRaw?.trim().toLowerCase();
	if (!a || !b) return false;
	return a === b;
}

export function coerceProductTargetCountry(
	product: Partial<{ targetCountries?: unknown; country?: unknown; targetMarkets?: unknown }>
): string | null {
	const tryArray = (v: unknown): string[] => {
		if (Array.isArray(v)) return v.filter(Boolean) as string[];
		if (typeof v === 'string') {
			try {
				const parsed = JSON.parse(v);
				return Array.isArray(parsed) ? (parsed.filter(Boolean) as string[]) : [v];
			} catch {
				return [v];
			}
		}
		return [];
	};

	const candidates: string[] = [
		...tryArray(product.targetCountries),
		...tryArray(product.country),
		...tryArray(product.targetMarkets)
	].filter(Boolean);

	if (candidates.length === 0) return null;
	// 取第一个，并做归一化
	return normalizeCountry(candidates[0]) || candidates[0];
}


