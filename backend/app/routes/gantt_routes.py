import re
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

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

def get_weekend_shapes(start_date: datetime, end_date: datetime):
    """土日の背景を赤色にするためのshapesを生成"""
    shapes = []
    current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    while current_date <= end_date:
        # 土曜日（5）または日曜日（6）の場合
        if current_date.weekday() in [5, 6]:  # 5=土曜日, 6=日曜日
            # その日の開始と終了時刻を設定
            day_start = current_date
            day_end = current_date + timedelta(days=1)
            
            shapes.append({
                'type': 'rect',
                'xref': 'x',
                'yref': 'paper',
                'x0': day_start,
                'x1': day_end,
                'y0': 0,
                'y1': 1,
                'fillcolor': 'rgba(255, 0, 0, 0.2)',  # 赤色の半透明
                'line': {'width': 0},
                'layer': 'below'
            })
        
        current_date += timedelta(days=1)
    
    return shapes

@router.post("/generate-gantt", response_model=GanttResponse)
async def generate_gantt(request: GanttRequest):
    """ガントチャートを生成する"""
    try:
        # イベントデータを処理
        events = []
        min_date = None
        max_date = None
        
        for event in request.events:
            start_date = normalize_date(event.start)
            end_date = normalize_date(event.end)
            
            # 日付範囲を追跡
            start_dt = pd.to_datetime(start_date)
            end_dt = pd.to_datetime(end_date)
            
            if min_date is None or start_dt < min_date:
                min_date = start_dt
            if max_date is None or end_dt > max_date:
                max_date = end_dt
            
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
        
        # 土日の背景を赤色にする
        if min_date is not None and max_date is not None:
            weekend_shapes = get_weekend_shapes(min_date.to_pydatetime(), max_date.to_pydatetime())
            fig.update_layout(shapes=weekend_shapes)
        
        # HTMLコンテンツを生成
        html_content = fig.to_html(include_plotlyjs=True, full_html=True)
        
        return GanttResponse(html_content=html_content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ガントチャート生成エラー: {str(e)}") 