# dev로 이동
git switch dev

# 원격 dev 가져오기
git pull origin dev

# (필요하면) main 내용도 dev에 섞기
git merge main --allow-unrelated-histories
# 충돌 나면 해결 → add → commit

# 정리된 dev를 원격에 반영
git push origin dev

#!/bin/bash

cd "$(dirname "$0")"

echo "🔎 8080 포트 사용하는 프로세스 찾는 중..."
PID=$(lsof -t -i:8080)

if [ -n "$PID" ]; then
echo "⚠️ 8080 포트 사용하는 PID: $PID → 종료할게요."
kill -9 $PID
else
echo "✅ 8080 포트를 사용하는 프로세스가 없습니다."
fi

echo "🚀 Spring Boot (bootRun) 다시 실행합니다..."
./gradlew bootRun