const iconv = require('iconv-lite')
const JSSoup = require('jssoup').default
const request = require('request-promise')

const deptData = require('../data/depts')
const params = require('../data/params')

/**
 * request 양식 데이터를 생성합니다.
 * @param {string} deptCode 학과코드
 * @param {string} category 과목구분
 * @returns {Object} request 양식 데이터
 * @throws Unexpected category name
 */
const createRequestForm = (deptCode, category) => {
  let categoryParams
  switch (category) {
    case '전공':
      categoryParams = { 'hhdSrchGubun': 'search1' }
      break
    case '교필':
    case '교양필수':
      categoryParams = { 'hhdSrchGubun': 'search1' }
      break
    case '영어':
      categoryParams = {
        'ddlKita': 1,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 1
      }
      break
    case '핵교':
    case '핵심교양':
      categoryParams = {
        'ddlKita': 7,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 7
      }
      break
    case '일교':
    case '일반교양':
      categoryParams = {
        'ddlKita': 9,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 9
      }
      break
    default:
      throw new Error('Unexpected category name')
  }
  return {
    url: 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx',
    method: 'POST',
    encoding: null,
    form: {
      ...params,
      ...categoryParams,
      'ddlDept': deptCode
    }
  }
}

/**
 * data에서 강의시간 정보를 추출합니다.
 * @param {string} data 시간 및 장소
 * @returns {Array.<string>} 강의시간
 */
const extractTime = data => data.split('/').map(element => splitTime(element.replace(/\(.+$/, ''))).flat()

/**
 * data에서 강의실 정보를 추출합니다.
 * @param {string} data 시간 및 장소
 * @returns {Array.<string>} 강의실
 */
const extractClassroom = data => data.split('/').map(element => element.match(/\((.+)\)/)[1])

/**
 * 학과코드를 반환합니다.
 * @param {string} deptName 학과이름
 * @returns {?string} 학과코드
 */
const getDeptCode = deptName => deptData[deptName] || null

/**
 * 학과이름를 반환합니다.
 * @param {string} deptCode 학과코드
 * @returns {?string} 학과이름
 */
const getDeptName = deptCode => (Object.entries(deptData).find(([, value]) => value === deptCode) || [null])[0]

/**
 * {@link http://sugang.inha.ac.kr 인하대학교 수강신청}에서 강의목록을 가져옵니다.
 * @param {string} deptCode 학과코드
 * @param {string} category 과목구분
 * @returns {Array.<Object>} 강의목록
 * @throws The network is unavailable or an invalid department code found.
 */
const getTimeTable = async (deptCode, category) => {
  const form = createRequestForm(deptCode, category)
  const html = await request(form)
  if (html) {
    const deptName = getDeptName(deptCode)
    const soup = new JSSoup(iconv.decode(Buffer.from(html), 'EUC-KR').toString())
    const table = soup.find('tbody')
    const rows = table.findAll('tr')
    const courses = rows.map(row => ({
      dept: deptCode,
      deptName: deptName,
      ...parseTableRow(row.findAll('td', 'Center'))
    }))
    if (category === '전공') {
      return courses.filter(value => value.category !== '교양필수')
    } else if (category === '교필' || category === '교양필수') {
      return courses.filter(value => !value.category.includes('전공'))
    }
    return courses
  } else {
    throw new Error('The network is unavailable or an invalid department code found.')
  }
}

/**
 * 수강신청 테이블 행에서 강의정보를 반환합니다.
 * @param {Array.<SoupTag>} tableRow 테이블 행
 * @returns {Object} 강의정보
 */
const parseTableRow = ([id, , name, grade, credit, category, place, prof, rate, note]) => ({
  id: id.getText(),
  name: name.getText(),
  grade: grade.getText(),
  credit: credit.getText(),
  category: category.getText(),
  time: extractTime(place.getText()).join(','),
  classroom: extractClassroom(place.getText()).join(','),
  rawPlace: place.getText(),
  professor: prof.getText(),
  rate: rate.getText(),
  note: note.getText().replace(/&nbsp;|,$/g, '')
})

/**
 * '월1,2,3,금1,2,3'을 '월1,월2,월3,금1,금2,금3'으로 변환합니다.
 * @param {string} time 강의시간
 * @returns {Array.<string>} 강의시간 배열
 */
const splitTime = (time) => {
  let day = '월'
  return time.split(',').map(x => {
    if (isNaN(x)) {
      day = x.match(/(.)(\d+)/)[1]
      return x
    } else {
      return day + x
    }
  })
}

module.exports = {
  getDeptCode,
  getDeptName,
  getTimeTable
}
