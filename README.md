# INHA_TIMETABLE

> 인하대학교 수강신청 시간표 크롤러

[![npm](https://img.shields.io/npm/v/inha-timetable.svg?style=for-the-badge)](https://www.npmjs.com/package/inha-timetable) [![npm](https://img.shields.io/npm/dt/inha-timetable.svg?style=for-the-badge)](https://www.npmjs.com/package/inha-timetable)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## 설치
```
npm install --save inha-timetable
```

## 사용
```js
const fs = require('fs')
const { getTimeTable, getDeptCode } = require('inha-timetable')

getTimeTable(getDeptCode('정보통신공학과'), '교양필수')
.then(r=>{
  console.log(r)
  fs.writeFileSync('result.json', JSON.stringify(r, null, 4))
})
.catch(e=>{
  console.log(e)
})
```

## getTimeTable(dept, category) ⇒ <code>Array</code>
시간표를 [인하대학교 수강신청](http://sugang.inha.ac.kr)에서 가져옵니다.

**Returns**: <code>Array</code> - 시간표 배열을 반환합니다.

| Param | Type | Description |
| --- | --- | --- | --- |
| dept | <code>string</code> | 학과 코드 |
| category | <code>string</code> | 전공,영어,핵심교양,교양필수,일반교양 |
