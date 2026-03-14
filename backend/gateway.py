import argparse
import asyncio
import os
from aiohttp import web, ClientSession, WSMsgType

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_ROOT = os.path.abspath(os.path.join(ROOT_DIR, "..", "web"))

HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


async def proxy_http(request, target_base, session):
    tail = request.match_info.get("tail", "")
    path = f"/{tail}" if tail else ""
    url = f"{target_base}{path}"
    if request.query_string:
        url = f"{url}?{request.query_string}"

    data = await request.read()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_HEADERS}
    async with session.request(request.method, url, data=data, headers=headers) as resp:
        resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in HOP_HEADERS}
        body = await resp.read()
        return web.Response(status=resp.status, body=body, headers=resp_headers)


async def handle_static(request):
    rel = request.match_info.get("path", "")
    if rel == "":
        return web.FileResponse(os.path.join(WEB_ROOT, "index.html"))
    fs_path = os.path.join(WEB_ROOT, rel)
    if os.path.isfile(fs_path):
        return web.FileResponse(fs_path)
    return web.FileResponse(os.path.join(WEB_ROOT, "index.html"))


async def ws_proxy(request):
    ws_client = web.WebSocketResponse()
    await ws_client.prepare(request)

    ws_target = request.app["ws_target"]
    session = request.app["session"]

    try:
        ws_server = await session.ws_connect(ws_target)
    except Exception:
        await ws_client.close()
        return ws_client

    async def forward(src, dst):
        async for msg in src:
            if msg.type == WSMsgType.TEXT:
                await dst.send_str(msg.data)
            elif msg.type == WSMsgType.BINARY:
                await dst.send_bytes(msg.data)
            elif msg.type == WSMsgType.CLOSE:
                await dst.close()

    await asyncio.gather(forward(ws_client, ws_server), forward(ws_server, ws_client))
    return ws_client


async def init_app(api_target, ws_target):
    app = web.Application()
    session = ClientSession()
    app["session"] = session
    app["ws_target"] = ws_target

    async def close_session(app):
        await app["session"].close()

    app.on_cleanup.append(close_session)

    app.router.add_route("*", "/api/{tail:.*}", lambda r: proxy_http(r, api_target, session))
    app.router.add_route("*", "/admin/{tail:.*}", lambda r: proxy_http(r, api_target, session))
    app.router.add_route("*", "/ws", ws_proxy)
    app.router.add_route("GET", "/", handle_static)
    app.router.add_route("GET", "/{path:.*}", handle_static)

    return app


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8090)
    parser.add_argument("--api", default="http://localhost:8787")
    parser.add_argument("--ws", default="ws://localhost:8788")
    args = parser.parse_args()

    app = asyncio.get_event_loop().run_until_complete(init_app(args.api, args.ws))
    web.run_app(app, port=args.port)


if __name__ == "__main__":
    main()
