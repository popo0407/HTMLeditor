"""
Wordファイル出力用のAPIルート

開発憲章の「関心の分離」に従い、
Wordファイル出力を独立したルートで管理
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.wordExportService import WordExportService
import io

router = APIRouter(prefix="/api/word", tags=["word"])


class WordExportRequest(BaseModel):
    html_content: str
    filename: str = "document"
    title: str = "エクスポートされたドキュメント"


@router.post("/export")
async def export_to_word(request: WordExportRequest):
    """
    HTMLコンテンツをWordファイルに変換してダウンロード
    
    Args:
        request: Word出力リクエスト
        
    Returns:
        Wordファイルのストリーミングレスポンス
    """
    try:
        # HTMLをWordファイルに変換
        word_data = WordExportService.html_to_word(
            request.html_content,
            request.title
        )
        
        # ストリーミングレスポンスを作成
        return StreamingResponse(
            io.BytesIO(word_data),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={request.filename}.docx"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 