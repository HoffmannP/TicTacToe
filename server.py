#!/usr/bin/env python3.9

import asyncio
import json
import random
import secrets
import typing
import websockets # type: ignore
import websockets.server  # type: ignore

GAME: typing.Dict[str, websockets.server.WebSocketServerProtocol] = {}

def broadcast(players, action, **data):
    websockets.broadcast(players, json.dumps({
            'action': action, **data}))

async def play(*players):
    await players[0].send(json.dumps({'action': 'start', 'player': 0}))
    await players[1].send(json.dumps({'action': 'start', 'player': 1}))
    print('Game starts')
    current = random.randint(0, 1)
    bord = list(None for _ in range(9))
    while True:
        while True:
            await players[current].send(json.dumps({ 'action': 'turn'}))
            print(f'Player {current}\'s turn')
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
                print(f'Player {current} wins')
                broadcast(players, 'win', player=current)
                break
            if all([c is not None for c in bord]):
                print('Nobody wins, Tie')
                broadcast(players, 'win', player='')
                break
            current = current ^ 1

        print('Waiting for restart')
        while True:
            done, pending = await asyncio.wait([p.recv() for p in players], return_when=asyncio.FIRST_COMPLETED)
            [p.cancel() for p in pending]
            await asyncio.wait(pending)
            message = await done.pop()
            try:
                data = json.loads(message)
            except ValueError:
                continue
            if data['action'] == 'restart':
                break
        print('Restarting')
        bord = list(None for _ in range(9))

        broadcast(players, 'restart')
        current = current ^ 1


def checkWin(bord, player):
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
