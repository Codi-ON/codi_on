# ml_api/dependencies.py

# from fastapi import Header, HTTPException
#
# # 백엔드와 공유할 비밀번호 (나중엔 .env로 빼야 함)
# API_SECRET_KEY = "codion-team-secret-1234"
#
# async def verify_api_key(x_api_key: str = Header(...)):
#     """
#     헤더에 'x-ml_api-key'가 있는지, 그리고 비밀번호가 맞는지 검사하는 문지기
#     """
#     if x_api_key != API_SECRET_KEY:
#         raise HTTPException(status_code=403, detail="⛔ 접근 권한이 없습니다. (API Key 불일치)")
#     return x_api_key