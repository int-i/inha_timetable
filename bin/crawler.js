const fs = require('fs')
const readline = require('readline')

const { getDeptCode, getTimeTable } = require('../lib')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Select your department name: ', (deptName) => {
  const deptCode = getDeptCode(deptName)
  if (deptCode) {
    rl.question('Select a course category which will be crawled: (전공, 교필, 영어, 핵교, 일교) ', async (category) => {
      getTimeTable(deptCode, category)
        .then(courses => fs.writeFileSync(`${category}.json`, JSON.stringify(courses, null, 4)))
        .catch(e => console.error('Error: Unexpected course category name'))
      rl.close()
    })
  } else {
    console.error('Error: Unexpected department name')
    rl.close()
  }
})
