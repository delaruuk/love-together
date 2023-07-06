const res = []
const arr = [1,2,3,4,5]
 
function t(num) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(()=>{
      console.log('定时器', num)
      resolve()
    }, 1000)
  })
}
 
function t2(item){
  console.log('进入res')
  res.push(item)
}
arr.forEach(async (item, index) =>{
    await t(item)
    t2(item)
  })
  