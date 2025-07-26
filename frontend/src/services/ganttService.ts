import { CalendarEvent } from '../types';

interface GanttResponse {
  html_content: string;
  image_base64: string;
  success: boolean;
  message: string;
}

interface GanttImageResponse {
  image_path: string;
  success: boolean;
  message: string;
}

class GanttService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8002';

  /**
   * ガントチャートHTMLと画像を生成
   */
  async generateGanttChart(events: CalendarEvent[]): Promise<{ html: string; image: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/gantt/generate-gantt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GanttResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'ガントチャート生成に失敗しました');
      }

      // HTMLコンテンツからbodyタグ内のコンテンツのみを抽出
      const bodyContent = this.extractBodyContent(data.html_content);
      return {
        html: bodyContent,
        image: data.image_base64
      };
    } catch (error) {
      console.error('ガントチャート生成エラー:', error);
      throw new Error('ガントチャートの生成に失敗しました。サーバーが起動しているか確認してください。');
    }
  }

  /**
   * ガントチャートを画像として保存
   */
  async saveGanttImage(events: CalendarEvent[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/gantt/save-gantt-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GanttImageResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'ガントチャート画像保存に失敗しました');
      }

      return data.image_path;
    } catch (error) {
      console.error('ガントチャート画像保存エラー:', error);
      throw new Error('ガントチャート画像の保存に失敗しました。サーバーが起動しているか確認してください。');
    }
  }

  /**
   * HTMLコンテンツからbodyタグ内のコンテンツのみを抽出
   */
  private extractBodyContent(htmlContent: string): string {
    try {
      // bodyタグ内のコンテンツを抽出
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        const bodyContent = bodyMatch[1].trim();
        return bodyContent;
      }
      
      // bodyタグが見つからない場合は、scriptタグを含む部分を抽出
      const scriptMatch = htmlContent.match(/(<script[^>]*>[\s\S]*?<\/script>[\s\S]*?<div[^>]*>[\s\S]*?<\/div>)/i);
      if (scriptMatch && scriptMatch[1]) {
        const scriptContent = scriptMatch[1].trim();
        return scriptContent;
      }
      
      // それでも見つからない場合は、元のコンテンツをそのまま返す
      return htmlContent;
    } catch (error) {
      console.warn('HTMLコンテンツ抽出エラー:', error);
      return htmlContent;
    }
  }

  /**
   * Base64画像データをHTML imgタグに変換
   */
  generateImageHtml(imageBase64: string, alt: string = 'ガントチャート'): string {
    return `<img src="data:image/png;base64,${imageBase64}" alt="${alt}" style="max-width: 100%; height: auto;" />`;
  }
}

export const ganttService = new GanttService(); 