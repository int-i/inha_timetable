# INHA_TIMETABLE
## 설치
```
npm install --save inha-timetable
```

## 사용
```js
const { getTimeTable, getDeptCode } = require('inha-timetable')

getTimeTable(getDeptCode('정보통신공학과'), '교양필수', true, 'result.json')
.then(r=>{
  console.log(r)
})
.catch(e=>{
  console.log(e)
})
```

## getTimeTable(dept, type, isDebug, outputFile) ⇒ <code>Array</code>
시간표를 [인하대학교 수강신청](http://sugang.inha.ac.kr)에서 가져옵니다.

**Returns**: <code>Array</code> - 시간표 배열을 반환합니다.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| dept | <code>string</code> |  | 학과 코드 |
| type | <code>string</code> | <code>&quot;전공&quot;</code> | 전공,영어,핵심교양,교양필수,일반교양 |
| isDebug | <code>boolean</code> | <code>true</code> | 중간 과정 로그를 출력여부 |
| outputFile | <code>string</code> |  | 파일에 저장할 시 파일 이름 |