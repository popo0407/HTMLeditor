"""
PDFファイル出力サービス

開発憲章の「関心の分離」に従い、
PDFファイル出力を独立したサービスで管理
"""

import io
import subprocess
import shutil
import tempfile
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from bs4 import BeautifulSoup
import re
from reportlab.lib import colors
from pathlib import Path


class PdfExportService:
    """
    HTMLコンテンツをPDFファイルに変換するサービス
    """

    # クラス変数: フォント名を格納して他メソッドから参照できるようにする
    _default_font = 'Helvetica'

    @staticmethod
    def create_pdf_from_html(html_content: str, title: str = "エクスポートされたドキュメント") -> bytes:
        """
        HTMLコンテンツからPDFファイルを生成
        
        Args:
            html_content: HTMLコンテンツ
            title: ドキュメントタイトル
            
        Returns:
            PDFファイルのバイトデータ
        """
        return PdfExportService.html_to_pdf(html_content, title)

    @staticmethod
    def html_to_pdf(html_content: str, title: str = "エクスポートされたドキュメント") -> bytes:
        """
        HTMLコンテンツをPDFファイルに変換

        Args:
            html_content: HTMLコンテンツ
            title: ドキュメントタイトル

        Returns:
            PDFファイルのバイトデータ
        """
        try:
            # まずリポジトリ直下に置かれた wkhtmltopdf 実行ファイル（ユーザー提供）を使って変換を試みる
            try:
                repo_root = Path(__file__).resolve().parents[3]
            except Exception:
                repo_root = Path.cwd()

            # check for wkhtmltopdf in repo root (either '#file:wkhtmltopdf.exe' or 'wkhtmltopdf.exe') and system PATH
            candidates = [repo_root / '#file:wkhtmltopdf.exe', repo_root / 'wkhtmltopdf.exe']
            wk_path = None
            for c in candidates:
                try:
                    if c.exists() and c.is_file():
                        wk_path = str(c)
                        break
                except Exception:
                    continue

            if wk_path is None:
                # try system PATH
                wk_path = shutil.which('wkhtmltopdf') or shutil.which('wkhtmltopdf.exe')

            if wk_path:
                print(f"PdfExportService: attempting wkhtmltopdf at {wk_path}")
                try:
                    # inject print-friendly CSS to help wkhtmltopdf handle table headers, page breaks and borders
                    print_css = '''
<style>
@media print {
  html, body { -webkit-print-color-adjust: exact; }
  table { border-collapse: collapse; width: 100%; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th, td { border: 1px solid #ddd; padding: 12px; }
  th { background-color: #f8f9fa; font-weight: bold; }
}
</style>
'''

                    # ensure print CSS and UTF-8 meta are present in the HTML head
                    modified_html = html_content
                    lower_html = modified_html.lower()
                    head_close_idx = lower_html.find('</head>')
                    if head_close_idx != -1:
                        head_before = modified_html[:head_close_idx]
                        head_after = modified_html[head_close_idx:]
                        # insert meta charset if not present
                        if 'charset' not in head_before.lower():
                            head_before = head_before + '<meta charset="utf-8">'
                        modified_html = head_before + print_css + head_after
                    else:
                        # prepend meta + CSS if no head tag
                        modified_html = '<meta charset="utf-8">' + print_css + modified_html

                    with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w', encoding='utf-8') as hf:
                        hf.write(modified_html)
                        tmp_html = hf.name

                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as pf:
                        tmp_pdf = pf.name

                    file_url = f"file:///{Path(tmp_html).resolve().as_posix()}"
                    cmd = [
                        wk_path,
                        '--print-media-type',
                        '--encoding', 'utf-8',
                        '--enable-local-file-access',
                        '--disable-smart-shrinking',
                        '--page-size', 'A4',
                        '--margin-top', '10mm',
                        '--margin-bottom', '10mm',
                        '--margin-left', '10mm',
                        '--margin-right', '10mm',
                        '--javascript-delay', '200',
                        file_url,
                        tmp_pdf,
                    ]

                    proc = subprocess.run(cmd, capture_output=True)
                    if proc.returncode != 0:
                        print(f"wkhtmltopdf failed: returncode={proc.returncode}, stderr={proc.stderr.decode('utf-8', errors='replace')}")
                        # fallthrough to reportlab implementation
                    else:
                        with open(tmp_pdf, 'rb') as f:
                            pdf_bytes = f.read()

                        # cleanup
                        try:
                            Path(tmp_html).unlink()
                        except Exception:
                            pass
                        try:
                            Path(tmp_pdf).unlink()
                        except Exception:
                            pass

                        return pdf_bytes
                except Exception as e:
                    print(f"PdfExportService: wkhtmltopdf execution error: {e}")
                    # fallthrough to reportlab implementation
                    pass
            # Windows日本語フォントを登録
            default_font = 'Helvetica'  # デフォルト
            
            # Windows日本語フォントの優先順位
            windows_fonts = [
                ('C:/Windows/Fonts/msgothic.ttc', 'MS Gothic'),
                ('C:/Windows/Fonts/yugothic.ttc', 'Yu Gothic'),
                ('C:/Windows/Fonts/meiryo.ttc', 'Meiryo'),
                ('C:/Windows/Fonts/msmincho.ttc', 'MS Mincho'),
                ('C:/Windows/Fonts/msgothic.ttf', 'MS Gothic'),
                ('C:/Windows/Fonts/yugothic.ttf', 'Yu Gothic'),
                ('C:/Windows/Fonts/meiryo.ttf', 'Meiryo'),
            ]
            
            for font_path, font_name in windows_fonts:
                try:
                    pdfmetrics.registerFont(TTFont(font_name, font_path))
                    default_font = font_name
                    print(f"日本語フォント '{font_name}' を登録しました")
                    break
                except Exception as e:
                    print(f"フォント '{font_name}' の登録に失敗: {e}")
                    continue

            # クラス変数に保存して他の staticmethod から参照できるようにする
            PdfExportService._default_font = default_font

            # PDFドキュメントを作成
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []

            # スタイルシートを取得
            styles = getSampleStyleSheet()
            
            # カスタムスタイルを追加（日本語フォント対応）
            styles.add(ParagraphStyle(
                name='CustomHeading1',
                parent=styles['Heading1'],
                fontName=default_font,
                fontSize=16,
                spaceAfter=12
            ))
            styles.add(ParagraphStyle(
                name='CustomHeading2',
                parent=styles['Heading2'],
                fontName=default_font,
                fontSize=14,
                spaceAfter=10
            ))
            styles.add(ParagraphStyle(
                name='CustomHeading3',
                parent=styles['Heading3'],
                fontName=default_font,
                fontSize=12,
                spaceAfter=8
            ))
            
            # 通常テキスト用のスタイルも日本語フォントに設定
            styles.add(ParagraphStyle(
                name='JapaneseNormal',
                parent=styles['Normal'],
                fontName=default_font,
                fontSize=10,
                spaceAfter=6
            ))

            # HTMLをパース
            soup = BeautifulSoup(html_content, 'html.parser')

            # スタイルタグを除去
            for style in soup.find_all('style'):
                style.decompose()

            # スクリプトタグを除去
            for script in soup.find_all('script'):
                script.decompose()

            # 各要素を処理
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote']):
                PdfExportService._process_element(story, element, styles)

            # PDFを生成
            doc.build(story)
            buffer.seek(0)
            return buffer.getvalue()

        except Exception as e:
            raise Exception(f"PDFファイルの作成に失敗しました: {str(e)}")

    @staticmethod
    def _process_element(story, element, styles):
        """
        個別のHTML要素をPDFストーリーに追加

        Args:
            story: PDFストーリー
            element: HTML要素
            styles: スタイルシート
        """
        tag_name = element.name

        if tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            # 見出し
            level = int(tag_name[1])
            style_name = f'CustomHeading{level}' if level <= 3 else f'Heading{level}'
            story.append(Paragraph(element.get_text(), styles[style_name]))
            story.append(Spacer(1, 6))

        elif tag_name == 'p':
            # 段落
            text = element.get_text().strip()
            if text:
                story.append(Paragraph(text, styles['JapaneseNormal']))
                story.append(Spacer(1, 6))

        elif tag_name in ['ul', 'ol']:
            # リスト
            for li in element.find_all('li', recursive=False):
                text = li.get_text().strip()
                if text:
                    bullet = "• " if tag_name == 'ul' else f"{len(story) + 1}. "
                    story.append(Paragraph(bullet + text, styles['JapaneseNormal']))
            story.append(Spacer(1, 6))

        elif tag_name == 'table':
            # テーブル（簡易実装）
            PdfExportService._process_table(story, element, styles)

        elif tag_name == 'blockquote':
            # 引用
            text = element.get_text().strip()
            if text:
                # 引用用のスタイルを作成
                quote_style = ParagraphStyle(
                    name='JapaneseQuote',
                    parent=styles['Italic'],
                    fontName=PdfExportService._default_font,
                    fontSize=10,
                    leftIndent=20,
                    spaceAfter=6
                )
                story.append(Paragraph(f'"{text}"', quote_style))
                story.append(Spacer(1, 6))

    @staticmethod
    def _process_table(story, table_element, styles):
        """
        テーブルを処理（簡易実装）

        Args:
            story: PDFストーリー
            table_element: テーブル要素
            styles: スタイルシート
        """
        rows = table_element.find_all('tr')
        if not rows:
            return

        # テーブルデータを作成（セルは Paragraph でラップして日本語フォントを使用）
        data = []
        for row in rows:
            cells = row.find_all(['td', 'th'])
            row_cells = []
            for cell in cells:
                text = cell.get_text().strip()
                # Paragraph を使うことで改行や基本的なフォーマットを保つ
                row_cells.append(Paragraph(text, styles['JapaneseNormal']))
            if row_cells:
                data.append(row_cells)

        if data:
            # Table を作成し罫線スタイルを適用
            tbl = Table(data, hAlign='LEFT')
            tbl_style = TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), PdfExportService._default_font),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
                ('LEFTPADDING', (0,0), (-1,-1), 4),
                ('RIGHTPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ])
            tbl.setStyle(tbl_style)
            story.append(tbl)
            story.append(Spacer(1, 6))