import sqlite3

conn = sqlite3.connect('data/departments.db')
cursor = conn.cursor()

# テーブル構造を確認
cursor.execute('PRAGMA table_info(departments)')
columns = cursor.fetchall()
print('departments table columns:')
for col in columns:
    print(f'  {col[1]} {col[2]}')

# サンプルデータを確認
cursor.execute('SELECT * FROM departments WHERE id = 22')
dept = cursor.fetchone()
print(f'\nDepartment ID 22 data:')
print(dept)

conn.close()
