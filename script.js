document.addEventListener('DOMContentLoaded', main)

function main () {
  const state = {
    game: 'waiting',
    bord: Array(9).fill(''),
    websocket: new window.WebSocket('ws://localhost:5432'),
    key: null,
    cells: [...document.querySelectorAll('.grid > div')]
  }

  state.websocket.addEventListener('error', e => { console.log(e) })
  state.websocket.addEventListener('close', e => { console.log(e) })
  state.websocket.addEventListener('open', () => {
    state.key = document.location.search.substr(1)
    state.websocket.send(JSON.stringify({ action: 'start', key: state.key }))
  })
  state.websocket.addEventListener('message', receive.bind(state))
  document.querySelectorAll('.grid > div').forEach(
    (cell, index) => (cell.dataset.player = ''))
}

function share () {
  navigator.share ? navigator.share({
    title: 'Play with me',
    text: 'Play TicTacToe with me',
    url: document.location
  }) : window.alert('Share this page')
}

function receive (MessageEvent) {
  const data = JSON.parse(MessageEvent.data)
  console.log(data.action)
  switch (data.action) {
    case 'draw':
      document.body.removeEventListener('click', share)
      this.bord[data.index] = data.player
      document.querySelectorAll('.grid > div').forEach(
        (cell, index) => (cell.dataset.player = this.bord[index]))
      break
    case 'win':
      this.bord = Array(9).fill(data.player)
      document.querySelectorAll('.grid > div').forEach(
        (cell, index) => (cell.dataset.player = this.bord[index]))
      break
    case 'restart':
      this.bord = Array(9).fill('')
      document.querySelectorAll('.grid > div').forEach(
        (cell, index) => (cell.dataset.player = this.bord[index]))
      break
    case 'turn':
      document.body.removeEventListener('click', share)
      document.querySelector('.grid').addEventListener(
        'click',
        clickEvent => this.websocket.send(JSON.stringify(
          { action: 'draw', index: this.cells.indexOf(clickEvent.target) })),
        { once: true })
      break
    case 'invite':
      window.history.replaceState(null, '', `?${data.key}`)
      document.body.addEventListener('click', share)
      break
  }
}
