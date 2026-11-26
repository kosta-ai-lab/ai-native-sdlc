"""0단계: 실습 환경이 준비됐는지 확인합니다.

1) API 키 환경 변수(TYPESAFE_API_KEY)가 있는지
2) typesafe-sdk 패키지가 설치됐는지
3) Jev 서버에 접속해서 사용할 수 있는 모델 목록을 받아 오는지
"""
import os
import sys

# 1) API 키 확인 ----------------------------------------------------------
key = os.environ.get("TYPESAFE_API_KEY")
if not key:
    print("[X] TYPESAFE_API_KEY 환경 변수가 없습니다.")
    print("    PowerShell:  $env:TYPESAFE_API_KEY = \"발급받은_키\"")
    print("    macOS/Linux: export TYPESAFE_API_KEY=\"발급받은_키\"")
    sys.exit(1)
print(f"[O] API 키를 찾았습니다. (앞 4글자: {key[:4]}...)")

# 2) SDK 설치 확인 ---------------------------------------------------------
try:
    from typesafe_sdk import TypeSafeClient
except ImportError:
    print("[X] typesafe-sdk가 설치되지 않았습니다.")
    print("    가상환경을 켠 뒤:  pip install -r requirements.txt")
    sys.exit(1)
print("[O] typesafe-sdk를 불러왔습니다.")

# 3) 서버 접속 확인 --------------------------------------------------------
try:
    with TypeSafeClient(model="jev-latest") as client:
        models = client.models.list()
except Exception as e:  # 키가 틀리거나 네트워크 문제일 때
    print(f"[X] 서버 접속에 실패했습니다: {type(e).__name__}: {e}")
    print("    키가 맞는지, 얼리 액세스 승인이 났는지, 인터넷 연결을 확인하세요.")
    sys.exit(1)

print("[O] 서버에 접속했습니다. 사용할 수 있는 모델:")
print(models)
print("\n준비 완료! 다음은 01_hello_choice.py 입니다.")
