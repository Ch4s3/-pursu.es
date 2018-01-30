import ready from './ready'
import getSvg from './svgHandler'

ready( fn => {
	//call serverless for triangle background
	const width = window.innerWidth
	const oneThird = window.innerHeight/3
	const height = oneThird + (oneThird/5)
	const url = 'https://imt1ymyrng.execute-api.us-east-1.amazonaws.com/dev/triangles?height='+height+'&width='+width

	getSvg(url, width, height)

	window.addEventListener('orientationchange', function() {
		getSvg(url, width, height)
  }, false)
})