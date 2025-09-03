#!/usr/bin/env python3
"""
講評フィールドのXMLパース機能テスト
"""

import os
import sys

def test_xml_content():
    """XMLテストデータの確認"""
    xml_file = "c:/Users/user/Downloads/HTMLEditer/test-xml-with-review.xml"
    
    if os.path.exists(xml_file):
        with open(xml_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("=== XMLテストデータ内容 ===")
        print(content[:500] + "..." if len(content) > 500 else content)
        
        # 講評タグが含まれているかチェック
        if '<講評>' in content and '</講評>' in content:
            print("✅ XMLに講評フィールドが含まれています")
        else:
            print("❌ XMLに講評フィールドが見つかりません")
            
        return True
    else:
        print(f"❌ XMLファイルが見つかりません: {xml_file}")
        return False

if __name__ == "__main__":
    test_xml_content()
