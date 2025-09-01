#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
元データ添付機能のテストコード
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.routes.mail_routes import generate_source_data_filename, sanitize_filename
import base64

def test_source_data_filename_generation():
    """元データファイル名生成のテスト"""
    print("=== 元データファイル名生成テスト ===")
    
    # テストケース1: 完全な会議情報
    meeting_info_1 = {
        '会議タイトル': 'プロジェクト定例会議',
        '会議日時': '2025-01-15 14:00:00'
    }
    filename_1 = generate_source_data_filename(meeting_info_1, 'txt')
    print(f"テスト1 - 完全情報: {filename_1}")
    expected_1 = "【社外秘】_2025-01-15_プロジェクト定例会議_元データ"
    assert filename_1 == expected_1, f"期待値: {expected_1}, 実際: {filename_1}"
    
    # テストケース2: 日時なし
    meeting_info_2 = {
        '会議タイトル': '緊急ミーティング'
    }
    filename_2 = generate_source_data_filename(meeting_info_2, 'docx')
    print(f"テスト2 - 日時なし: {filename_2}")
    expected_2 = "【社外秘】_緊急ミーティング_元データ"
    assert filename_2 == expected_2, f"期待値: {expected_2}, 実際: {filename_2}"
    
    # テストケース3: 空の会議情報
    meeting_info_3 = {}
    filename_3 = generate_source_data_filename(meeting_info_3, 'pdf')
    print(f"テスト3 - 空情報: {filename_3}")
    expected_3 = "【社外秘】_議事録_元データ"
    assert filename_3 == expected_3, f"期待値: {expected_3}, 実際: {filename_3}"
    
    print("✅ 全てのテストが通過しました")

def test_file_processing():
    """ファイル処理ロジックのテスト"""
    print("\n=== ファイル処理テスト ===")
    
    # テストデータ（擬似的なファイル内容）
    test_text = "これは議事録の元データテストです。\nUTF-8 BOMの確認を行います。"
    
    # UTF-8 BOM付きエンコーディング
    bom_text = '\ufeff' + test_text
    encoded_content = bom_text.encode('utf-8')
    
    print(f"元テキスト: {test_text}")
    print(f"BOM付きエンコード後のバイト数: {len(encoded_content)}")
    
    # BOMチェック（f-stringでバックスラッシュを避ける）
    bom_bytes = b'\xef\xbb\xbf'
    has_bom = encoded_content.startswith(bom_bytes)
    print(f"BOMが先頭に付いているか: {has_bom}")
    
    # デコードテスト
    decoded_content = encoded_content.decode('utf-8')
    print(f"デコード後: {decoded_content}")
    has_bom_char = decoded_content.startswith('\ufeff')
    print(f"BOM文字が含まれているか: {has_bom_char}")
    
    print("✅ ファイル処理テストが完了しました")

def test_sanitize_filename():
    """ファイル名サニタイズテスト"""
    print("\n=== ファイル名サニタイズテスト ===")
    
    test_cases = [
        ("通常のタイトル", "通常のタイトル"),
        ("特殊文字<>:\"/\\|?*含む", "特殊文字_________含む"),
        ("   前後にスペース   ", "前後にスペース"),
        ("", "議事録"),
    ]
    
    for input_name, expected in test_cases:
        result = sanitize_filename(input_name)
        print(f"入力: '{input_name}' -> 出力: '{result}'")
        assert result == expected, f"期待値: {expected}, 実際: {result}"
    
    print("✅ ファイル名サニタイズテストが完了しました")

if __name__ == "__main__":
    try:
        test_source_data_filename_generation()
        test_file_processing()
        test_sanitize_filename()
        print("\n🎉 全てのテストが正常に完了しました！")
    except Exception as e:
        print(f"\n❌ テストエラー: {e}")
        sys.exit(1)