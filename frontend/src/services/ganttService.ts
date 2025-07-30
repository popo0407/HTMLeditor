

export interface GanttRequest {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    color: string;
  }>;
}

export interface GanttResponse {
  html_content: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8002/api';

export class GanttService {
  /**
   * ガントチャートを生成する
   */
  async generateGanttChart(events: GanttRequest['events']): Promise<string> {
    try {
      console.log('ガントチャートAPI呼び出し:', events);
      const response = await fetch(`${API_BASE_URL}/gantt/generate-gantt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ガントチャートAPIエラー:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: GanttResponse = await response.json();
      console.log('ガントチャートAPI成功:', data.html_content.length, '文字');
      return data.html_content;
    } catch (error) {
      console.error('ガントチャート生成エラー:', error);
      throw new Error(`ガントチャートの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
}

export const ganttService = new GanttService(); 