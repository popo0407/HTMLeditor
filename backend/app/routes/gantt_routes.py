import re
import pandas as pd
import plotly.express as px
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class GanttEvent(BaseModel):
    id: str
    title: str
    start: str
    end: str
    color: str

class GanttRequest(BaseModel):
    events: List[GanttEvent]

class GanttResponse(BaseModel):
    html_content: str

def normalize_date(date_str: str) -> str:
    """日付文字列を正規化する"""
    if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return date_str
    digits = re.findall(r'\d', date_str)
    if len(digits) >= 8:
        year = ''.join(digits[:4])
        month = ''.join(digits[4:6])
        day = ''.join(digits[6:8])
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return date_str

@router.post("/generate-gantt", response_model=GanttResponse)
async def generate_gantt(request: GanttRequest):
    """ガントチャートを生成する"""
    try:
        # イベントデータを処理
        events = []
        for event in request.events:
            start_date = normalize_date(event.start)
            end_date = normalize_date(event.end)
            
            events.append({
                'title': event.title,
                'Start': start_date,
                'Finish': end_date,
                'color': event.color
            })
        
        # DataFrame作成
        df = pd.DataFrame(events)
        
        # 日付列をdatetime型に変換
        df['Start'] = pd.to_datetime(df['Start'])
        df['Finish'] = pd.to_datetime(df['Finish'])
        
        # 1日だけのイベントは終了日を開始日の翌日に設定
        df.loc[df['Start'] == df['Finish'], 'Finish'] = df.loc[df['Start'] == df['Finish'], 'Start'] + pd.Timedelta(days=1)
        
        # ガントチャート作成
        fig = px.timeline(df, x_start="Start", x_end="Finish", y="title", color="color", color_discrete_map="identity")
        fig.update_yaxes(autorange="reversed")
        fig.update_xaxes(dtick="D1", tickformat="%m/%d")
        fig.update_layout(
            title="",
            xaxis_title="",
            yaxis_title="",
            height=400,
            width=800,
            font=dict(size=14),
            title_font_size=20,
            xaxis=dict(title_font_size=16, tickfont_size=12),
            yaxis=dict(title_font_size=16, tickfont_size=12),
            margin=dict(l=50, r=50, t=30, b=50)
        )
        
        # HTMLコンテンツを生成
        html_content = fig.to_html(include_plotlyjs=True, full_html=True)
        
        return GanttResponse(html_content=html_content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ガントチャート生成エラー: {str(e)}") 