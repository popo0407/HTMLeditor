from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import base64
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from io import BytesIO
import re
from datetime import datetime
import asyncio
import subprocess
import tempfile

router = APIRouter()

class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str
    end: str
    color: str

class GanttRequest(BaseModel):
    events: List[CalendarEvent]

class GanttResponse(BaseModel):
    html_content: str
    image_base64: str
    success: bool
    message: str

class GanttImageResponse(BaseModel):
    image_path: str
    success: bool
    message: str

@router.post("/generate-gantt", response_model=GanttResponse)
async def generate_gantt(request: GanttRequest):
    try:
        # DataFrame化
        df = pd.DataFrame([event.dict() for event in request.events])

        # 日付正規化関数
        def normalize_date(date_str):
            if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                return date_str
            digits = re.findall(r'\d', date_str)
            if len(digits) >= 8:
                year = ''.join(digits[:4])
                month = ''.join(digits[4:6])
                day = ''.join(digits[6:8])
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            return date_str

        df["start_normalized"] = df["start"].apply(normalize_date)
        df["end_normalized"] = df["end"].apply(normalize_date)
        df["Start"] = pd.to_datetime(df["start_normalized"])
        df["Finish"] = pd.to_datetime(df["end_normalized"])
        
        # 1日だけのイベントは終了日を開始日の翌日に設定
        df.loc[df["Start"] == df["Finish"], "Finish"] = df.loc[df["Start"] == df["Finish"], "Start"] + pd.Timedelta(days=1)

        # ガントチャート作成
        fig = px.timeline(df, x_start="Start", x_end="Finish", y="title", color="color", color_discrete_map="identity")
        fig.update_yaxes(autorange="reversed")
        fig.update_xaxes(dtick="D1", tickformat="%m/%d")
        fig.update_layout(
            title="",
            xaxis_title="",
            yaxis_title="",
            height=600,
            width=1200,
            font=dict(size=18),
            title_font_size=24,
            xaxis=dict(title_font_size=20, tickfont_size=16),
            yaxis=dict(title_font_size=20, tickfont_size=16)
        )

        # HTMLとして出力
        html_content = fig.to_html(include_plotlyjs=True, full_html=True)

        # HTMLを画像に変換
        image_base64 = await html_to_image(html_content)

        return GanttResponse(
            html_content=html_content,
            image_base64=image_base64,
            success=True,
            message="ガントチャートが正常に生成されました"
        )

    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"ガントチャート生成に失敗しました: {str(e)}")

async def html_to_image(html_content: str) -> str:
    """HTMLを画像に変換する"""
    try:
        # 一時HTMLファイルを作成
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            html_file = f.name
        
        # 一時画像ファイルを作成
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            image_file = f.name
        
        # Playwrightを使用してHTMLを画像に変換
        try:
            # HTMLを画像に変換（設定を最適化）
            cmd = [
                'playwright', 'screenshot',
                html_file,
                '--output', image_file,
                '--viewport-size', '1200x800',
                '--wait-for-timeout', '3000',  # 3秒に短縮
                '--timeout', '30000',  # 30秒に設定
                '--headed', 'false'  # ヘッドレスモードを明示的に指定
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0 and os.path.exists(image_file):
                # 画像をBase64に変換
                with open(image_file, 'rb') as f:
                    image_data = f.read()
                    image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                # 一時ファイルを削除
                os.unlink(html_file)
                os.unlink(image_file)
                
                return image_base64
            else:
                print(f"Playwrightエラー: {result.stderr}")
                return ""
                
        except subprocess.TimeoutExpired:
            print("Playwrightタイムアウト: 60秒でタイムアウトしました")
            return ""
        except Exception as e:
            print(f"Playwright実行エラー: {e}")
            return ""
            
    except Exception as e:
        print(f"HTML to image エラー: {e}")
        return ""

@router.post("/save-gantt-image", response_model=GanttImageResponse)
async def save_gantt_image(request: GanttRequest):
    try:
        # DataFrame化
        df = pd.DataFrame([event.dict() for event in request.events])
        
        # 日付正規化関数
        def normalize_date(date_str):
            if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                return date_str
            digits = re.findall(r'\d', date_str)
            if len(digits) >= 8:
                year = ''.join(digits[:4])
                month = ''.join(digits[4:6])
                day = ''.join(digits[6:8])
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            return date_str

        df["start_normalized"] = df["start"].apply(normalize_date)
        df["end_normalized"] = df["end"].apply(normalize_date)
        df["Start"] = pd.to_datetime(df["start_normalized"])
        df["Finish"] = pd.to_datetime(df["end_normalized"])
        
        # 1日だけのイベントは終了日を開始日の翌日に設定
        df.loc[df["Start"] == df["Finish"], "Finish"] = df.loc[df["Start"] == df["Finish"], "Start"] + pd.Timedelta(days=1)

        # ガントチャート作成
        fig = px.timeline(df, x_start="Start", x_end="Finish", y="title", color="color", color_discrete_map="identity")
        fig.update_yaxes(autorange="reversed")
        fig.update_xaxes(dtick="D1", tickformat="%m/%d")
        fig.update_layout(
            title="",
            xaxis_title="",
            yaxis_title="",
            height=400,  # 高さを削減
            width=800,   # 幅を削減
            font=dict(size=14),  # フォントサイズを削減
            title_font_size=20,
            xaxis=dict(title_font_size=16, tickfont_size=12),
            yaxis=dict(title_font_size=16, tickfont_size=12),
            margin=dict(l=50, r=50, t=30, b=50)  # マージンを最適化
        )

        # 画像として保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_path = f"gantt_chart_{timestamp}.png"
        
        # staticディレクトリが存在しない場合は作成
        static_dir = "static"
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
        
        full_image_path = os.path.join(static_dir, image_path)
        fig.write_image(full_image_path, format="png", width=1200, height=600)

        return GanttImageResponse(
            image_path=image_path,
            success=True,
            message=f"ガントチャート画像が保存されました: {image_path}"
        )

    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"ガントチャート画像保存に失敗しました: {str(e)}")

@router.get("/test-image-generation")
async def test_image_generation():
    try:
        # テスト用のデータを作成
        test_data = {
            'title': ['タスク1', 'タスク2', 'タスク3'],
            'start': ['2025-01-01', '2025-01-05', '2025-01-10'],
            'end': ['2025-01-03', '2025-01-07', '2025-01-12'],
            'color': ['#0078d4', '#28a745', '#ffc107']
        }
        
        df = pd.DataFrame(test_data)
        df['Start'] = pd.to_datetime(df['start'])
        df['Finish'] = pd.to_datetime(df['end'])
        
        # ガントチャート作成
        fig = px.timeline(df, x_start="Start", x_end="Finish", y="title", color="color", color_discrete_map="identity")
        fig.update_yaxes(autorange="reversed")
        fig.update_xaxes(dtick="D1", tickformat="%m/%d")
        fig.update_layout(
            title="テストガントチャート",
            xaxis_title="日付",
            yaxis_title="タスク",
            height=400,
            width=800
        )
        
        # HTMLとして出力
        html_content = fig.to_html(include_plotlyjs=True, full_html=True)
        
        # HTMLを画像に変換
        image_base64 = await html_to_image(html_content)
        
        return {
            "success": True,
            "message": "画像生成テスト成功",
            "image_base64_length": len(image_base64),
            "data_shape": df.shape.tolist()
        }
            
    except Exception as e:
        import traceback
        return {
            "success": False,
            "message": f"テスト失敗: {str(e)}",
            "error_details": traceback.format_exc()
        } 