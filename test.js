const { getTimeTable, getDeptCode } = require('./index')

getTimeTable(getDeptCode('정보통신공학과'), '전공', true, '핵심교양.json')