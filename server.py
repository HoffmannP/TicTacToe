#!/usr/bin/env python3.9

import asyncio
import json
import random
import secrets
import typing
import websockets
import websockets.server

GAME: typing.Dict[str, websockets.server.WebSocketServerProtocol] = {}

def broadcast(players, action, **data):
    websockets.broadcast(players, json.dumps({
            'action': action, **data}))

async def play(*players):
    broadcast(players, 'start')
    print('Game starts')
    current = random.randint(0, 1)
    bord = list(None for _ in range(9))
    while True:
        await players[current].send(json.dumps({ 'action': 'turn'}))
        print(f'Player {current} draws')
        message = await players[current].recv()
        try:
            data = json.loads(message)
        except ValueError:
            continue

        assert data['action'] == 'draw'
        assert 'index' in data

        if bord[data['index']] is not None:
            continue
        bord[data['index']] = current
        print(f'Player {current} sets on index {data["index"]}')
        broadcast(players, 'draw', index=data['index'], player=current)
        if checkWin(bord, current):
            broadcast(players, 'win', player=current)
            print(f'Player {current} hat gewonnen')
            players[0].close()
            players[1].close()
            return
        if all([c is not None for c in bord]):
            print('Neustart wegen unentschieden')
            broadcast(players, 'restart')
            bord = list(None for _ in range(9))
        current = current ^ 1

def checkWin(bord, player):
    print(bord, player)
    if bord[0] == bord[1] == bord[2] == player:
        return True
    if bord[3] == bord[4] == bord[5] == player:
        return True
    if bord[6] == bord[7] == bord[8] == player:
        return True
    if bord[0] == bord[3] == bord[6] == player:
        return True
    if bord[1] == bord[4] == bord[7] == player:
        return True
    if bord[2] == bord[5] == bord[8] == player:
        return True
    if bord[0] == bord[4] == bord[8] == player:
        return True
    if bord[2] == bord[4] == bord[6] == player:
        return True
    return False

async def handler(websocket):
    message = await websocket.recv()
    try:
        data = json.loads(message)
    except ValueError:
        return

    assert data['action'] == 'start'

    if 'key' in data and len(data['key']) > 3:
        key = data['key']
        if key in GAME:
            print(f'Player 1 joining {key}')
            await play(GAME[key], websocket)
            del GAME[key]
            print('Player 1 left the game')
            return
    else:
        key = secrets.token_urlsafe()

    GAME[key] = websocket
    print(f'Player 0 joining {key}')
    await websocket.send(json.dumps({
        'action': 'invite',
        'key': key}))
    await websocket.wait_closed()
    del GAME[key]
    print('Player 0 left the game')

async def main():
    async with websockets.serve(handler, '', 5432):
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
