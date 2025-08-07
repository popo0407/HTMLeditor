"""
PDFファイル出力用のAPIルート

開発憲章の「関心の分離」に従い、
PDFファイル出力を独立したルートで管理
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.pdfExportService import PdfExportService
import io

router = APIRouter(tags=["pdf"])


class PdfExportRequest(BaseModel):
    html_content: str
    filename: str = "document"
    title: str = "エクスポートされたドキュメント"


@router.post("/export")
async def export_to_pdf(request: PdfExportRequest):
    """
    HTMLコンテンツをPDFファイルに変換してダウンロード

    Args:
        request: PDF出力リクエスト

    Returns:
        PDFファイルのストリーミングレスポンス
    """
    try:
        # HTMLをPDFファイルに変換
        pdf_data = PdfExportService.html_to_pdf(
            request.html_content,
            request.title
        )

        # ストリーミングレスポンスを作成
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={request.filename}.pdf"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 