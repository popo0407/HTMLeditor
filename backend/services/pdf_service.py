import subprocess
import tempfile
import os
from pathlib import Path
from typing import Optional

WKHTMLTOPDF_PATH = os.getenv('WKHTMLTOPDF_PATH', str(Path(__file__).resolve().parents[2] / 'wkhtmltopdf.exe'))


def generate_pdf_from_html(html: str, timeout: int = 30, use_header: bool = True, confidential_level: str = '社外秘', meeting_info: Optional[dict] = None) -> bytes:
    """Generate PDF bytes from HTML using wkhtmltopdf.

    Raises RuntimeError on failure.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"PDF generation - confidential_level: {confidential_level}")
    
    # write html to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as h:
        h.write(html)
        html_path = h.name

    pdf_fd, pdf_path = tempfile.mkstemp(suffix='.pdf')
    os.close(pdf_fd)

    # Header template path
    header_path = None
    if use_header:
        backend_dir = Path(__file__).resolve().parents[1]  # backend/
        header_template_path = backend_dir / 'templates' / 'header.html'
        if header_template_path.exists():
            # 動的ヘッダーファイルを作成
            header_path = create_dynamic_header(confidential_level, meeting_info)
            logger.info(f"PDF generation - created dynamic header: {header_path}")

    try:
        cmd = [
            WKHTMLTOPDF_PATH,
            '--disable-javascript',
            '--enable-local-file-access',
            '--load-error-handling', 'ignore',
            '--load-media-error-handling', 'ignore',
            '--margin-top', '25mm',
            '--margin-bottom', '15mm',
            '--margin-left', '15mm',
            '--margin-right', '15mm'
        ]
        
        # Add header if available
        if header_path:
            cmd.extend(['--header-html', header_path])
            cmd.extend(['--header-spacing', '5'])
        
        cmd.extend([html_path, pdf_path])
        
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        if proc.returncode != 0:
            raise RuntimeError(f"wkhtmltopdf failed: {proc.stderr.decode(errors='ignore')}")

        with open(pdf_path, 'rb') as f:
            data = f.read()

        if not data:
            raise RuntimeError('Generated PDF is empty')

        return data
    finally:
        try:
            os.unlink(html_path)
        except Exception:
            pass
        try:
            os.unlink(pdf_path)
        except Exception:
            pass
        # 動的ヘッダーファイルも削除
        if header_path:
            try:
                os.unlink(header_path)
            except Exception:
                pass


def create_dynamic_header(confidential_level: str, meeting_info: Optional[dict] = None) -> str:
    """機密レベルに応じた動的ヘッダーファイルを作成し、パスを返す"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Creating dynamic header with confidential_level: {confidential_level}")
    
    # 会議情報から必要な値を取得
    minutes_no = ""
    creation_date = ""
    ka_name = ""
    issuer = ""
    
    if meeting_info:
        # 議事録No.を取得（フロントエンドは '議事録No' キーを使用）
        minutes_no = meeting_info.get('議事録No', '')
        logger.info(f"Minutes No received: '{minutes_no}' (type: {type(minutes_no)})")
        logger.info(f"Full meeting_info keys: {list(meeting_info.keys())}")
        logger.info(f"議事録No value check: '{meeting_info.get('議事録No')}'")
        
        # 作成情報の自動生成
        from datetime import datetime
        now = datetime.now()
        creation_date = f"{now.year % 100}/{now.month}/{now.day}"
        
        # 課名の抽出（正規化後は '課' キーで保存される）
        ka_raw = meeting_info.get('課', '')
        logger.info(f"Ka raw value: '{ka_raw}' (type: {type(ka_raw)})")
        if ka_raw:
            import re
            match = re.search(r'[（(]([^）)]+)[）)]', ka_raw)
            ka_name = match.group(1).strip() if match else ka_raw.strip()
        logger.info(f"Final ka_name: '{ka_name}'")
        
        # 発行者の取得（フロントエンドから '発行者' キーで送信される）
        issuer = meeting_info.get('発行者', '')
    
    header_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
        }}
        .header-container {{
            width: 100%;
            height: 60px;
            position: relative;
            padding: 10px 20px;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .minutes-no {{
            position: absolute;
            left: 20px;
            top: 10px;
            font-size: 12px;
            border: 1px solid #333;
            padding: 4px 8px;
            background-color: white;
        }}
        .creation-info {{
            position: absolute;
            right: 100px;
            top: 0px;
            font-size: 9px;
            border: 1px solid #333;
            background-color: white;
            width: 150px;
        }}
        .creation-info table {{
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }}
        .creation-info th, .creation-info td {{
            border: 1px solid #333;
            padding: 2px 4px;
            text-align: center;
            font-size: 10px;
            height: 16px;
        }}
        .creation-info th {{
            background-color: #f0f0f0;
            font-weight: bold;
            width: 40px;
        }}
        .creation-info td {{
            width: 55px;
        }}
        .confidential {{
            position: absolute;
            right: 20px;
            top: 10px;
            color: red;
            border: 2px solid red;
            padding: 5px 10px;
            font-weight: bold;
            font-size: 14px;
            background-color: white;
        }}
    </style>
</head>
<body>
    <div class="header-container">
        <div class="minutes-no">議事録No.{minutes_no}</div>
        <div class="creation-info">
            <table>
                <tr>
                    <th>作成</th>
                    <th>検認</th>
                </tr>
                <tr>
                    <td style="border-bottom: none;">{creation_date}</td>
                    <td rowspan="3"></td>
                </tr>
                <tr>
                    <td style="border-top: none; border-bottom: none;">{ka_name}</td>
                </tr>
                <tr>
                    <td style="border-top: none;">{issuer}</td>
                </tr>
            </table>
        </div>
        <div class="confidential">{confidential_level}</div>
    </div>
</body>
</html>"""
    
    # 一時ファイルとして保存
    header_fd, header_path = tempfile.mkstemp(suffix='.html')
    try:
        with os.fdopen(header_fd, 'w', encoding='utf-8') as f:
            f.write(header_content)
        logger.info(f"Dynamic header content written to: {header_path}")
        logger.info(f"Header content preview: {header_content[:200]}...")
    except Exception:
        os.close(header_fd)
        raise
    
    return header_path
