// クリップボードサービス（スタブ）
// 将来: HTML / プレーンテキスト / リッチテキスト書き込みの統合

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

const clipboardService = { copyText };
export default clipboardService;
