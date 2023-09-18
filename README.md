# Yudarlinn Recorder
유달린 방송 자동녹화 시스템 (open-stream-recorder 개발을 위한 playground 겸 테스트)

이 레포는 코드 퀄리티 신경쓰지 않고 빠르게 기술검증하고 구현하는 용도로 편하게 활용

## 구성 계획
- 일단 NestJS 기반으로 작성
- Twitch EventSub을 통해 생방송 알림 수신
- 일단 하나의 코드에서 모든 작업 수행
- 중간에 Redis를 두고 BullMQ로 큐 처리
- DB는 Supabase에서 제공하는 PostgreSQL를 이용
- 저장은 R2에서

## 대충 흐름
1. Twitch EventSub으로 알림이 들어온다
2. 들어온 알림을 `stream` 테이블에 기록한다 (스트림이 시작됨)
3. m3u8 주소를 불러와서 역시 `stream` 테이블에 함께 기록한다
4. m3u8 주소를 파싱해서 하위 job을 실행시키는 메인 Job을 실행한다
5. 메인 Job에서 ts 파일 파싱을 시작한다.
6. 추출된 ts 파일은 `segment` 테이블에 기록하고, 파일을 다운받아 r2에 저장하는 하위 Job을 실행시킨다
7. 하위 Job에서는 ts 파일을 저장하고, r2에 업로드하고, db에 완료된 링크를 기록까지 한다
8. Job이 실패하면 다시 실행되니까 최소 n회 정상 동작 보장은 될 것이다

## 보여주는 쪽
프론트와 백엔드에서는 `stream` 테이블과 `segment` 테이블을 이용해서 ts segment file을 이용한 스트리밍을 보여준다.
