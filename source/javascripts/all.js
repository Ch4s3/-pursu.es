import ready from './ready'
import dropDown from './dropDown'

const searchAlgolia = function searchAlgolia(query, app) {
var client = algoliasearch("YW7090F15U", 'ecc64ef6f9594c209c3ec27b1cbc2511')
var index = client.initIndex('posts')
index.search(query)
	.then(function searchSuccess(content) {
		if (content.query === ''){
			app.ports.results.send({query: '',hits: []})
		} else {
			app.ports.results.send(content)
		}
	})
	.catch(function searchFailure(err) {
		console.error(err)
	})
}

ready( fn => {
	const elmNode = document.getElementById('elm-search-container')
	if (elmNode !== null) {
		const app = Elm.AlgoliaSearch.embed(elmNode)
		app.ports.search.subscribe(function(query) {
			const results = searchAlgolia(query, app)
		})
	}

	const dropButtonEl = 
		document.getElementById('nav')
						.getElementsByClassName('drop-down-button')[0]
	const dropDownEl = 
		document.getElementById('nav')
						.getElementsByClassName('drop-down')[0]
	dropDown(dropButtonEl, dropDownEl)
})