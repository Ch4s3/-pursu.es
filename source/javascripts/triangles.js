import ready from './ready'
import getSvg from './svgHandler'
const debounce = (func, wait, immediate) => {
  let timeout
  return () => {
    const context = this, args = arguments
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}
const getWindowAndMakeCall = () => {
  const width = window.innerWidth
	const oneThird = window.innerHeight/3
	const height = oneThird + (oneThird/5)
	const url = 'https://imt1ymyrng.execute-api.us-east-1.amazonaws.com/dev/triangles?height='+height+'&width='+width
  getSvg(url)
}

ready( fn => {
	//call serverless for triangle background
	getWindowAndMakeCall()

  window.addEventListener('resize', debounce(() => {
    getWindowAndMakeCall()
  }, 500, false), false)

	window.addEventListener('orientationchange', function() {
		getWindowAndMakeCall()
  }, false)
})