#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from services.minutes_pdf_service import generate_minutes_pdf

# テスト用のサンプルデータ
meeting_info = {
    'title': 'テスト会議（社外秘ヘッダー確認）',
    'datetime': '2025-08-27 10:00',
    'location': 'オンライン',
    'department': '開発部',
    'participants': ['山田太郎', '田中花子'],
    'summary': 'PDFに社外秘ヘッダーが正しく表示されるかの確認'
}

minutes_html = '''
<h2>議事内容</h2>
<p>今回の会議では以下の項目について議論しました。</p>
<div class="action-item">
<h3>アクションアイテム</h3>
<p>PDFヘッダーに赤い枠と赤文字で「社外秘」を表示する機能を実装</p>
</div>
<h3>確認事項</h3>
<ul>
<li>各ページの右上に「社外秘」が表示されること</li>
<li>文字色が赤色であること</li>
<li>枠線が赤色であること</li>
</ul>
'''

# PDF生成テスト
try:
    pdf_data = generate_minutes_pdf(meeting_info, minutes_html)
    print(f'PDF生成成功: {len(pdf_data)} bytes')
    
    # テスト用ファイルに保存
    with open('test_confidential_header.pdf', 'wb') as f:
        f.write(pdf_data)
    print('test_confidential_header.pdf として保存されました')
    print('PDFファイルを開いて、右上に赤い枠で「社外秘」が表示されていることを確認してください。')
    
except Exception as e:
    print(f'PDF生成エラー: {e}')
    import traceback
    traceback.print_exc()
