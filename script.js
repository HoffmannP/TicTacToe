document.addEventListener('DOMContentLoaded', main)

function main () {
  const DEV = true
  const state = {
    connection: 'offline',
    myturn: false,
    notify: true,
    bord: Array(9).fill(''),
    websocket: new window.WebSocket(DEV ? 'ws://localhost:5432' : 'wss://b-ranger.de/tictactoe_ws'),
    key: null,
    cells: [...document.querySelectorAll('.grid > div')]
  }

  state.websocket.addEventListener('error', e => { console.debug(e); connectionState.call(this, 'offline') })
  state.websocket.addEventListener('close', e => { console.debug(e); connectionState.call(this, 'offline') })
  state.websocket.addEventListener('open', () => {
    state.key = document.location.search.substr(1)
    send.call(state, 'start', { key: state.key })
  })
  state.websocket.addEventListener('message', receive.bind(state))

  document.querySelectorAll('.action-connection').forEach(b => b.addEventListener('click', connect.bind(state)))
  connectionState.call(this, 'offline')
  document.querySelector('.grid').addEventListener('click', play.bind(state))

  swichNotifyState.call(state)
  drawBord.call(state)
}

function send (action, data = {}) {
  this.websocket.send(JSON.stringify({ action, ...data }))
}

function swichNotifyState () {
  switch (!this.notify) {
    case true:
      if (window.Notification.permission !== 'granted') {
        window.Notification.requestPermission().then(result => {
          if (result === 'granted') {
            this.notify = true
            document.querySelectorAll('.action-notify img').forEach(setIcon('bell'))
          }
        })
      } else {
        this.notify = true
        document.querySelectorAll('.action-notify img').forEach(setIcon('bell'))
      }
      break
    case false:
      document.querySelectorAll('.action-notify img').forEach(setIcon('bell-off'))
      this.notify = false
  }
  document.querySelectorAll('.action-notify').forEach(c => c.addEventListener('click', swichNotifyState.bind(this)))
}

function connectionState (state) {
  this.connection = state
  switch (state) {
    case 'offline':
      document.querySelectorAll('.action-connection').forEach(setClass('uk-button-default', 'uk-button-primary'))
      document.querySelectorAll('.action-connection img').forEach(setIcon('cloud-off'))
      break
    case 'sharing':
      document.querySelectorAll('.action-connection').forEach(setClass('uk-button-primary', 'uk-button-default'))
      document.querySelectorAll('.action-connection img').forEach(setIcon('share-2'))
      break
    case 'connected':
      document.querySelectorAll('.action-connection').forEach(setClass('uk-button-default', 'uk-button-primary'))
      document.querySelectorAll('.action-connection img').forEach(setIcon('cloud-lightning'))
      break
    case 'done':
      document.querySelectorAll('.action-connection').forEach(setClass('uk-button-primary', 'uk-button-default'))
      document.querySelectorAll('.action-connection img').forEach(setIcon('refresh-ccw'))
      break
  }
}

function setClass (add, remove) {
  return function (element) {
    element.classList.add(add)
    element.classList.remove(remove)
    return element
  }
}

function connect () {
  switch (this.connection) {
    case 'sharing':
      share.call(this)
      break
    case 'done':
      restart.call(this)
      break
  }
}

function share () {
  if (!navigator.share) {
    return
  }
  navigator.share({
    title: 'Play with me',
    text: 'Play TicTacToe with me',
    url: document.location
  })
}

function restart () {
  send.call(this, 'restart')
}

function myturnState (state) {
  this.myturn = state
  switch (state) {
    case true:
      if (document.visibilityState !== 'visible' && this.notify) {
        // eslint-disable-next-line no-new
        new window.Notification("It's your turn", { tag: this.key })
      }
      document.querySelectorAll('.state-turn').forEach(setClass('uk-text-primary', 'uk-text-muted'))
      document.querySelectorAll('.state-turn').forEach(setIcon('crosshair'))
      break
    case false:
      document.querySelectorAll('.state-turn').forEach(setClass('uk-text-muted', 'uk-text-primary'))
      document.querySelectorAll('.state-turn').forEach(setIcon('clock'))
      break
  }
}

function play (clickEvent) {
  if (!this.myturn) {
    return
  }
  const cellIndex = this.cells.indexOf(clickEvent.target)
  if (this.bord[cellIndex] !== '') {
    return
  }
  send.call(this, 'draw', { index: cellIndex }) ||
  myturnState.call(this, false)
}

function setIcon (icon) {
  return image => image.setAttribute('src', `images/feather-icons/${icon}.svg`)
}

function drawBord () {
  document.querySelectorAll('.grid > div').forEach(
    (cell, index) => (cell.dataset.player = this.bord[index])
  )
}

function receive (MessageEvent) {
  const data = JSON.parse(MessageEvent.data)
  switch (data.action) {
    case 'draw':
      this.bord[data.index] = data.player
      drawBord.call(this)
      break
    case 'restart':
      this.bord = Array(9).fill('')
      drawBord.call(this)
      connectionState.call(this, 'connected')
      myturnState.call(this, false)
      break
    case 'win':
      this.bord = Array(9).fill(data.player)
      drawBord.call(this)
      connectionState.call(this, 'done')
      break
    case 'turn':
      myturnState.call(this, true)
      break
    case 'invite':
      window.history.replaceState(null, '', `?${data.key}`)
      connectionState.call(this, 'sharing')
      break
    case 'start':
      document.querySelector('.whoami').dataset.player = data.player
      connectionState.call(this, 'connected')
      break
  }
}
