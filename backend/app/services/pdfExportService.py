"""
PDFファイル出力サービス

開発憲章の「関心の分離」に従い、
PDFファイル出力を独立したサービスで管理
"""

import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from bs4 import BeautifulSoup
import re


class PdfExportService:
    """
    HTMLコンテンツをPDFファイルに変換するサービス
    """

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
                    fontName=default_font,
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

        # テーブルをテキストとして処理
        table_text = []
        for row in rows:
            cells = row.find_all(['td', 'th'])
            row_text = " | ".join([cell.get_text().strip() for cell in cells])
            if row_text:
                table_text.append(row_text)

        if table_text:
            story.append(Paragraph("<br/>".join(table_text), styles['JapaneseNormal']))
            story.append(Spacer(1, 6)) 