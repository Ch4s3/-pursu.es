export default function dropDown (dropButtonEl, dropDownEl) {
  if(dropButtonEl && dropDownEl) {
		dropDownEl.addEventListener('click', function(e){
			e.stopPropagation()
		})
		dropButtonEl.addEventListener('click', function(e) {
			e.stopPropagation()
			dropButtonEl.classList.toggle('show-bkg')
			dropDownEl.classList.toggle('open')
		})
		document.getElementsByTagName('body')[0].addEventListener('click', function() {
			dropButtonEl.classList.remove('show-bkg')
			dropDownEl.classList.remove('open')
		})
	}
}