// This is where it all goes :)
const parseSVG = function parseSVG(svg, width, height) {
	  let div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
	  div.innerHTML = '<svg width="'+width+'" height="'+height+'">'+svg+'</svg>'
	  return div.firstChild;
}
const searchAlgolia = function searchAlgolia(query, app) {
	var client = algoliasearch("YW7090F15U", 'ecc64ef6f9594c209c3ec27b1cbc2511')
	var index = client.initIndex('posts')
	index.search(query)
		.then(function searchSuccess(content) {
			app.ports.results.send(content)
		})
		.catch(function searchFailure(err) {
			console.error(err)
		});
}

document.addEventListener("DOMContentLoaded", function(event) {
		//Load the elm app here
		const elmNode = document.querySelectorAll("#elm-search-container")[0]
		const app = Elm.AlgoliaSearch.embed(elmNode)
		app.ports.search.subscribe(function(query) {
			const results = searchAlgolia(query, app)
		})

		//call serverless for triangle background
    const xhr = new XMLHttpRequest()
    const width = window.innerWidth
    const height = window.innerHeight/3
    const url = 'https://imt1ymyrng.execute-api.us-east-1.amazonaws.com/dev/triangles?height='+height+'&width='+width
    const handleResponse = function() {
      if (this.status === 200 && this.readyState === 4) {
        // Success!
        const json = JSON.parse(this.response)
        const raw_svg = json.svg
        const width = json.width
        const height = json.height
        let container = document.querySelectorAll(".triangle-canvas")[0]
        let svg = parseSVG(raw_svg, width, height)
        container.append(svg)
      } else {
        // We reached our target server,
        // but it returned an error or hasn't completed
      }
    }
    xhr.open('GET', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json  ');
    xhr.onreadystatechange = handleResponse
    xhr.send()
});
