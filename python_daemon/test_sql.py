"""
Tiện ích Kiểm tra Kết nối Trực tiếp SQL Server CoreBanking [NG-eFUND]
Quỹ Tín Dụng Nhân Dân Yên Thọ - CreditCores
"""

import sys
import json
import argparse
import pyodbc

def test_sql(server, database, username, password, use_windows_auth=False, driver="ODBC Driver 18 for SQL Server"):
    print("=" * 65)
    print("KIEM TRA KET NOI SQL SERVER COREBANKING")
    print("=" * 65)
    print(f"May chu (Server):   {server}")
    print(f"CSDL (Database):     {database}")
    print(f"Che do xac thuc:     {'Windows Authentication' if use_windows_auth else f'SQL Authentication (User: {username})'}")
    print(f"ODBC Driver:         {driver}")
    print("-" * 65)

    if use_windows_auth:
        conn_str = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;TrustServerCertificate=yes;"
    else:
        conn_str = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes;"

    print("Dang thu ket noi (timeout 10 giay)...")
    try:
        conn = pyodbc.connect(conn_str, timeout=10)
        cursor = conn.cursor()
        print("KET NOI THANH CONG TOI MAY CHU SQL SERVER!")
        
        # Kiểm tra phiên bản SQL Server
        cursor.execute("SELECT @@VERSION")
        ver = cursor.fetchone()[0]
        print(f"Phien ban: {ver.splitlines()[0]}")
        
        # Kiểm tra số lượng hợp đồng tín dụng
        try:
            cursor.execute("SELECT COUNT(1) FROM TD_HOP_DONG_TD")
            total_hd = cursor.fetchone()[0]
            print(f"Bang TD_HOP_DONG_TD: {total_hd:,} hop dong")
        except Exception as e:
            print(f"Khong doc duoc bang TD_HOP_DONG_TD: {e}")

        # Kiểm tra số lượng khách hàng
        try:
            cursor.execute("SELECT COUNT(1) FROM DC_KHACH_HANG")
            total_kh = cursor.fetchone()[0]
            print(f"Bang DC_KHACH_HANG: {total_kh:,} khach hang")
        except Exception as e:
            print(f"Khong doc duoc bang DC_KHACH_HANG: {e}")

        # Kiểm tra khế ước còn dư nợ
        try:
            cursor.execute("SELECT COUNT(1), SUM(A.SO_DU) FROM TD_KHE_UOC A INNER JOIN KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN WHERE C.SO_DU > 0")
            row = cursor.fetchone()
            count_active = row[0] or 0
            sum_duno = row[1] or 0
            print(f"Khe uoc dang vay (C.SO_DU > 0): {count_active:,} mon | Tong du no: {sum_duno:,.0f} VND")
        except Exception as e:
            print(f"Khong doc duoc khe uoc du no: {e}")

        conn.close()
        print("=" * 65)
        print("TAT CA KIEM TRA DEU THANH CONG! SAN SANG DONG BO LEN GOOGLE SHEETS.")
        return True
    except Exception as err:
        print("KET NOI THAT BAI:")
        print(f"   Chi tiet loi: {err}")
        print("-" * 65)
        print("HUONG DAN XU LY:")
        print("1. Neu SQL Server nam tren may khac trong mang LAN: Hay dien dung IP may chu (vd: 192.168.0.x hoac 192.168.1.x,1433).")
        print("2. Dam bao SQL Server da bat 'TCP/IP' trong SQL Server Configuration Manager.")
        print("3. Dam bao dich vu 'SQL Server Browser' dang chay neu dung Named Instance (nhu .\\SQLEXPRESS).")
        print("4. Kiem tra tuong lua Windows Firewall tren may chu co mo cong 1433 hay khong.")
        print("=" * 65)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kiem tra ket noi SQL Server CoreBanking NG-eFUND")
    parser.add_argument("--server", default=None, help="Dia chi may chu SQL Server (IP hoac Hostname, vd: 192.168.0.100 hoac 127.0.0.1,1433)")
    parser.add_argument("--database", default="NG-eFUND", help="Ten database (mac dinh: NG-eFUND)")
    parser.add_argument("--username", default=None, help="Tai khoan dang nhap SQL Server (vd: sa)")
    parser.add_argument("--password", default=None, help="Mat khau SQL Server")
    parser.add_argument("--windows-auth", action="store_true", help="Dung Windows Authentication thay vi SQL Auth")
    args = parser.parse_args()

    server = args.server
    database = args.database
    username = args.username
    password = args.password
    use_windows_auth = args.windows_auth

    if not server:
        try:
            with open("config.json", "r", encoding="utf-8") as f:
                cfg = json.load(f)
                sql_cfg = cfg.get("sql_server", {})
                server = sql_cfg.get("server", "localhost")
                database = sql_cfg.get("database", "NG-eFUND")
                username = sql_cfg.get("username", "sa")
                password = sql_cfg.get("password", "")
                use_windows_auth = sql_cfg.get("use_windows_auth", False)
        except Exception:
            server = "localhost"
            username = "sa"
            password = ""

    test_sql(
        server=server,
        database=database,
        username=username or "sa",
        password=password or "",
        use_windows_auth=use_windows_auth
    )
