"""
部門管理APIのテスト
"""

import requests
import json

BASE_URL = "http://localhost:8002"

def test_departments_api():
    """部門API のテスト"""
    try:
        # 1. 部門一覧取得テスト
        print("=== 部門一覧取得テスト ===")
        response = requests.get(f"{BASE_URL}/api/departments/")
        print(f"ステータス: {response.status_code}")
        print(f"レスポンス: {response.text}")
        
        if response.status_code == 200:
            departments = response.json()
            print(f"部門数: {len(departments)}")
            for dept in departments:
                print(f"  - {dept['bu_name']} {dept['ka_name']} (ID: {dept['id']})")
            
            # 2. 部門詳細取得テスト（最初の部門）
            if departments:
                dept_id = departments[0]['id']
                print(f"\n=== 部門詳細取得テスト (ID: {dept_id}) ===")
                response = requests.get(f"{BASE_URL}/api/departments/{dept_id}")
                print(f"ステータス: {response.status_code}")
                if response.status_code == 200:
                    dept_detail = response.json()
                    print(f"部門: {dept_detail['bu_name']} {dept_detail['ka_name']}")
                    print(f"誤字修正数: {len(dept_detail['corrections'])}")
                    for correction in dept_detail['corrections']:
                        print(f"  - {correction['correct_reading']} → {correction['correct_display']}")
                
                # 3. クリップボード用データ取得テスト
                print(f"\n=== クリップボード用データ取得テスト (ID: {dept_id}) ===")
                response = requests.get(f"{BASE_URL}/api/departments/{dept_id}/corrections/clipboard")
                print(f"ステータス: {response.status_code}")
                if response.status_code == 200:
                    clipboard_data = response.json()
                    print(f"部門: {clipboard_data['department_info']['bu_name']} {clipboard_data['department_info']['ka_name']}")
                    print("クリップボード用JSON:")
                    print(json.dumps(clipboard_data['corrections'], indent=2, ensure_ascii=False))
        
    except requests.exceptions.ConnectionError:
        print("エラー: サーバーに接続できません。バックエンドが起動しているか確認してください。")
    except Exception as e:
        print(f"エラー: {e}")

if __name__ == "__main__":
    test_departments_api()
