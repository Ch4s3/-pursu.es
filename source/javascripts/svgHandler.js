const parseSVG = function parseSVG(svg, width, height) {
	let div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
	div.innerHTML = '<svg width="'+width+'" height="'+height+'">'+svg+'</svg>'
	return div.firstChild
}

const responseHandler = function responseHandler() {
  if (this.status === 200 && this.readyState === 4) {
    // Success!
    const json = JSON.parse(this.response)
    const raw_svg = json.svg
    const width = json.width
    const height = json.height
    let container = document.querySelector('.triangle-canvas')
      let svg = parseSVG(raw_svg, width, height)
    if (container.children.length > 0){
      container.replaceChild(svg, container.children[0])
    } else {
      container.appendChild(svg)
    }
  }
}

export default function getSvg(url) {
  const xhr = new XMLHttpRequest()
	xhr.open('GET', url, true)
	xhr.setRequestHeader('Content-Type', 'application/json')
	xhr.onreadystatechange = responseHandler
	xhr.send()
}
