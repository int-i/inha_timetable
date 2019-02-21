const request = require('request-promise')
const fs = require('fs-extra')
const iconv = require('iconv-lite')
const JSSoup = require('jssoup').default

const deptData = require('./data/deptData.json')
const values = require('./data/values')
/** 
 * 과코드를 가져옵니다.
 * 학과 이름이 유효하지 않는 경우 undefined를 return합니다.
 * @param {string} deptName 학과 이름
 * @return {string} 학과 코드를 반환합니다.
 */

/**
 * td가 담긴 JSSoup 객체를 json으로 바꿔줍니다.
 * @param {object} tds 
 */
const td2json = function (tds, category){
  const str = tds[6].getText()
  return {
    sno: tds[0].getText(),
    subject: tds[2].getText(),
    grade: tds[3].getText(),
    credit: tds[4].getText(),
    category: category?'핵심교양':tds[5].getText(),
    time: getTime(str),
    place: getPlace(str),
    detail_place: str,
    name_pf: tds[7].getText(),
    rate: tds[8].getText(),
    isWeb: str.indexOf('웹')!=-1?true:false, // 웹강을 포함한 강의일 때 true
    bigo: tds[9].getText().replace('&nbsp;', '')
  }
 }
 const getTime = function (str){
  if(str.indexOf('/') != -1){ // 시간, 장소가 여러개일때
    return str.split('/').map(x=>getTime(x)).join(',') // 웹강 제외
  }
  return getFullTime((str.match(/.*(?=\()/)||[''])[0])
}
/**
 * '월1,2,3,금1,2,3'을 '월1,월2,월3,금1,금2,금3'으로 바꾸어줍니다.
 * @param {string} str 
 */
const getFullTime = function (str){
  let day = '월'
  return str.split(',').map(x=>{
    if(isNaN(x)){
      day = x.match(/(.)(\d+)/)[1]
      return x
    }
    else {
      return day+x
    }
  }).join(',')
}
const getPlace = (str) => {
  if(str.indexOf('/') != -1){ // 시간, 장소가 여러개일때
    return str.split('/').map(x=>getPlace(x)).join(',') // 웹강 제외
  }
  if(str.indexOf('(') == -1) return '' // 장소가 없을때
  else return (str.match(/\((.*)\)/)||[''])[1];
}

const getDeptCode = (deptName) =>{
  if(!(deptName in deptData)){
    console.log('* 올바른 과/학부 이름이 아닙니다.')
    console.log(`* 목록: [${Object.keys(deptData).join(' ')}]`)
    return undefined
  }
  else return deptData[deptName]
}
const getDeptName = (deptCode) => {
  for(let i in deptData){
    if(deptData[i] == deptCode) return i
  }
  return undefined
}
/**
 * 시간표를 {@link http://sugang.inha.ac.kr 인하대학교 수강신청}에서 가져옵니다.
 * @param {string} dept 학과 코드
 * @param {string} type 전공,교양필수,영어,핵심교양,일반교양
 * @param {boolean} isDebug 중간 과정 로그를 출력여부
 * @param {string} outputFile 파일에 저장할 시 파일 이름
 * @return {Array} 시간표 배열을 반환합니다.
 */
const getTimeTable = async (dept = undefined, type = '전공', isDebug = true, outputFile) => {
  if(dept === undefined) throw new Error("올바르지않은 학과코드입니다.")

  const log = (msg) => {
    if(isDebug) console.log('* '+msg)
  }
  try {
    if(isDebug) console.time('parse')
    const types = {
      "전공": { 
        'hhdSrchGubun': 'search1',
      },
      "교양필수": { 
        'hhdSrchGubun': 'search1',
      },
      "영어": {
        'ddlKita': 1,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 1,
      },
      "핵심교양": {
        'ddlKita': 7,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 7,
      },
      "일반교양": {
        'ddlKita': 9,
        'hhdSrchGubun': 'search2',
        'ibtnSearch2': 9,
      }
    }
    if(!(type in types)){
      throw new Error("type을 제대로 입력해주세요. [ "+Object.keys(types).join(' ')+' ]')
    }
    if(outputFile){
      if(outputFile.indexOf('.') == -1 || outputFile.indexOf('.')==outputFile.length-1){
        throw new Error("파일이름에 확장자가 필요합니다.'")
      }  
    }
    const options = {
      url: 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx',
      method:'POST',
      encoding: null,
      form: {
          '__VIEWSTATE': values.__VIEWSTATE,
          '__VIEWSTATEGENERATOR': values.__VIEWSTATEGENERATOR,
          '__EVENTVALIDATION': values.__EVENTVALIDATION,
          'ddlDept': dept
      }
    }
    Object.assign(options.form, types[type])    
    var datas = [];
    const html = await request(options)
    if(!html){
      throw new Error("네트워크가 연결되어있지 않거나 올바르지 않은 학과번호입니다. 사이트가 닫혀있을 수도 있습니다.")
    }
    const soup = new JSSoup(iconv.decode(new Buffer(html), 'EUC-KR').toString())
    const tbody = soup.find('tbody')

    log('HTML 다운로드 완료')

    const trs = tbody.findAll('tr')
    for(const tr of trs){
      const tds = tr.findAll('td', 'Center')
      const json = td2json(tds, type)
      const deptName = getDeptName(dept)

      // ddlKita:1 에는 전공과 교양필수가 둘 다 포함되어있다.
      if(type == '전공' && json.category=='교양필수') continue
      if(type == '교양필수' && json.category.indexOf('전공')!=-1) continue

      if(type == '전공' || type == '교양필수'){
        datas.push(Object.assign({dept, deptName}, json))
      }
      else datas.push(json)
    }
    log(`파싱 완료!`)
    if(outputFile){
      await fs.writeFile(outputFile, JSON.stringify(datas, null, 2))
      log(`파일 쓰기 완료!`)
    } 
    if(isDebug) console.timeEnd('parse')
    return datas
  }
  catch(e){
    console.log(e)
    if(isDebug) console.timeEnd('parse')
  }
}

module.exports = {
  getTimeTable, getDeptCode
}