"""Pilote Playwright réutilisable (agent Gameplay) : démarre une zone, injecte
des touches à des instants précis (horloge de la scène), enregistre l'état du
joueur à chaque image rendue et capture des images du canvas."""
import base64
import io
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playtest2 import serve  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.environ.get('TEMP', SCRATCH), 'niveaux2')
os.makedirs(OUT, exist_ok=True)

DRIVER_JS = r"""
(() => {
  const KC = {ArrowRight:39, ArrowLeft:37, ArrowUp:38, ArrowDown:40, Space:32, KeyZ:90, KeyQ:81,
    KeyD:68, KeyS:83, KeyK:75, ShiftLeft:16, KeyE:69, KeyA:65, KeyF:70, KeyR:82, KeyI:73, KeyM:77, Enter:13};
  function key(type, code, mods = {}) {
    const kc = KC[code];
    const ev = new KeyboardEvent(type, { code, key: ({Space: " ", Enter: "Enter", KeyE: "e", KeyZ: "z", KeyS: "s", KeyQ: "q", KeyD: "d", KeyK: "k", KeyA: "a", KeyF: "f", KeyR: "r", KeyI: "i", KeyM: "m", ShiftLeft: "Shift"})[code] || code, bubbles: true, cancelable: true,
      ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift || code === 'ShiftLeft' });
    Object.defineProperty(ev, 'keyCode', { get: () => kc });
    Object.defineProperty(ev, 'which', { get: () => kc });
    window.dispatchEvent(ev);
  }
  function levelScene() {
    const g = window.__game;
    return (typeof currentLevelScene !== 'undefined' && currentLevelScene && currentLevelScene.sys.isActive())
      ? currentLevelScene
      : g.scene.getScenes(true).find((s) => s.player);
  }
  function fistWorld(p) {
    if (typeof textureAlphaInfo !== 'function') return null;
    const info = textureAlphaInfo(p.scene, p.texture.key);
    if (!info) return null;
    const W = p.frame.realWidth, H = p.frame.realHeight;
    const dox = p.originX * W, doy = p.originY * H;
    const sx = p.scaleX, sy = p.scaleY;
    let lx = p.flipX ? (W - dox - info.fistX) : (info.fistX - dox);
    let ly = info.fistY - doy;
    lx *= sx; ly *= sy;
    const c = Math.cos(p.rotation), s = Math.sin(p.rotation);
    return { x: p.x + lx * c - ly * s, y: p.y + lx * s + ly * c };
  }
  const drv = window.__drv = { rec: [], frames: [], key, levelScene, fistWorld };
  drv.snap = (extra) => {
    const sc = levelScene();
    const p = sc && sc.player;
    if (!p) return null;
    const cam = sc.cameras.main;
    const o = {
      t: Math.round(sc.time.now - (drv.t0 || 0)), x: +p.x.toFixed(1), y: +p.y.toFixed(1),
      vx: Math.round(p.body.velocity.x), vy: Math.round(p.body.velocity.y), form: p.form,
      tex: p.texture.key, ox: +p.originX.toFixed(3), oy: +p.originY.toFixed(3), flip: p.flipX,
      rot: +p.rotation.toFixed(3), sc: +p.scaleX.toFixed(3), og: !!p.onGround, ju: p.jumpsUsed,
      vis: p.visible, alpha: p.alpha, depth: p.depth, camX: cam.scrollX, camY: cam.scrollY,
      vine: !!p.vine,
    };
    const art = p.vineArt && p.vineArt.visible ? p.vineArt : null;
    const shown = art || p;
    if (art) { o.artTex = art.texture.key; o.artX = +art.x.toFixed(1); o.artY = +art.y.toFixed(1); o.artRot = +art.rotation.toFixed(3); o.artFlip = art.flipX; }
    const f = fistWorld(shown);
    if (f) { o.fx = +f.x.toFixed(1); o.fy = +f.y.toFixed(1); }
    if (p.vine) {
      const v = p.vine;
      const hand = v.pointAt(v.swingR, v.displayAngle);
      o.hx = +hand.x.toFixed(1); o.hy = +hand.y.toFixed(1); o.th = +v.theta.toFixed(3); o.om = +v.omega.toFixed(2);
      o.imgRot = v.image ? +v.image.rotation.toFixed(3) : null;
    }
    if (extra) Object.assign(o, extra(sc, p));
    return o;
  };
  // steps : [{t, down|up: code, mods}] (ms depuis le départ, horloge scène).
  drv.run = (steps, durationMs, opts = {}) => new Promise((resolve) => {
    const sc = levelScene();
    const g = window.__game;
    drv.rec = []; drv.frames = [];
    drv.t0 = sc.time.now;
    const todo = steps.slice().sort((a, b) => a.t - b.t);
    const onUpdate = () => {
      const t = sc.time.now - drv.t0;
      while (todo.length && todo[0].t <= t) {
        const s = todo.shift();
        if (s.down) key('keydown', s.down, s.mods);
        if (s.up) key('keyup', s.up, s.mods);
        if (s.call) s.call(sc, sc.player);
      }
      if (ctrl && sc.player) ctrl(sc, sc.player, t, key, cst);
    };
    const extra = opts.extra ? new Function('sc', 'p', opts.extra) : null;
    const ctrl = opts.ctrl ? new Function('sc', 'p', 't', 'key', 'st', opts.ctrl) : null;
    const cst = drv.ctrlState = {};
    if (ctrl) sc.events.on('update', () => {}, null);
    const onPre = () => { const o = drv.snap(extra); if (o) drv.rec.push(o); };
    const capFrom = opts.captureFrom ?? -1, capN = opts.captureN || 0;
    let capCount = 0;
    const onPost = () => {
      const t = sc.time.now - drv.t0;
      if (capN && t >= capFrom && capCount < capN) {
        drv.frames.push({ t: Math.round(t), url: g.canvas.toDataURL('image/png'), snap: drv.rec[drv.rec.length - 1] });
        capCount++;
      }
    };
    sc.events.on('update', onUpdate);
    g.events.on('prerender', onPre);
    g.events.on('postrender', onPost);
    const end = () => {
      sc.events.off('update', onUpdate);
      g.events.off('prerender', onPre);
      g.events.off('postrender', onPost);
      resolve(drv.rec.length);
    };
    let done = false;
    const end2 = () => { if (done) return; done = true; end(); };
    sc.time.delayedCall(durationMs, end2);
    // Garde-fou temps réel (changement de scène, monde gelé...).
    setTimeout(end2, durationMs * 2 + 3000);
  });
})();
"""


class Game:
    def __init__(self, port=8901, headed=False):
        self.port = port
        self.httpd = serve(port)
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(channel='msedge', headless=not headed)
        self.page = self.browser.new_page(viewport={'width': 960, 'height': 540})
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(f'pageerror: {e} | {getattr(e, "stack", "")}'))

        def on_console(msg):
            if msg.type == 'error' and 'Failed to load resource' not in msg.text and 'Failed to process file' not in msg.text:
                self.errors.append(f'console.error: {msg.text}')
        self.page.on('console', on_console)
        self.page.goto(f'http://127.0.0.1:{port}/index.html')
        try:
            self.page.wait_for_function(
                "window.__game && window.__game.scene && window.__game.scene.getScenes(true).length > 0", timeout=240000)
        except Exception:
            print('DEMARRAGE IMPOSSIBLE, erreurs :', self.errors[:5], flush=True)
            raise
        self.page.wait_for_function(
            "(() => { const b = window.__game.scene.getScene('BootScene'); return b && b.sys.settings.status >= Phaser.Scenes.RUNNING && !b.load.isLoading(); })() || window.__game.scene.getScenes(true).some(s => s.scene.key !== 'BootScene')",
            timeout=180000)
        time.sleep(0.5)

    def start(self, scene, flags=None, data=None, wait=2.0):
        self.page.evaluate("""() => { try { localStorage.clear(); } catch (e) {} }""")
        if flags:
            self.page.evaluate("(flags) => { for (const [k, v] of Object.entries(flags)) window.__game.registry.set(k, v); }", flags)
        self.page.evaluate("""([key, data]) => {
            const g = window.__game;
            for (const s of g.scene.getScenes(true)) { if (s.scene.key !== key) g.scene.stop(s.scene.key); }
            g.scene.start(key, data);
        }""", [scene, data or {}])
        time.sleep(wait)
        self.page.evaluate(DRIVER_JS)

    def quiet(self):
        """Coupe les déclencheurs d'histoire et ferme un dialogue en cours (tests de mouvement)."""
        self.page.evaluate("""() => {
            const g = window.__game;
            const sc = window.__drv.levelScene();
            if (sc.__story) sc.__story.triggers = [];
            sc.__exits = [];
            for (const k of ['DialogueScene']) if (g.scene.isActive(k)) g.scene.stop(k);
            sc.__cutsceneLock = 0; sc.__storyFreeze = 0;
            if (sc.input && sc.input.keyboard) sc.input.keyboard.resetKeys();
        }""")

    def js(self, expr, arg=None):
        return self.page.evaluate(expr, arg) if arg is not None else self.page.evaluate(expr)

    def run(self, steps, duration, **opts):
        """steps : liste de dicts {t, down|up, mods}."""
        self.page.evaluate("([s, d, o]) => window.__drv.run(s, d, o)", [steps, duration, opts])
        return self.page.evaluate("window.__drv.rec")

    def frames(self):
        return self.page.evaluate("window.__drv.frames")

    def shot(self, name):
        path = os.path.join(OUT, name)
        self.page.screenshot(path=path)
        return path

    def close(self):
        try:
            self.browser.close()
            self.pw.stop()
        finally:
            self.httpd.shutdown()


def save_frames(frames, prefix, crop=None, cols=6, scale=1.0):
    """Décode les captures canvas ; crop = fonction(snap) -> (x0,y0,x1,y1) écran.
    Écrit une planche contact et renvoie son chemin."""
    from PIL import Image, ImageDraw
    tiles = []
    for i, fr in enumerate(frames):
        data = base64.b64decode(fr['url'].split(',', 1)[1])
        im = Image.open(io.BytesIO(data)).convert('RGBA')
        if crop and fr.get('snap'):
            im = im.crop(crop(fr['snap']))
        if scale != 1.0:
            im = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
        d = ImageDraw.Draw(im)
        d.text((3, 2), f"{i} t{fr['t']}", fill=(255, 255, 0, 255))
        tiles.append(im)
    if not tiles:
        return None
    w = max(t.width for t in tiles)
    h = max(t.height for t in tiles)
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGBA', (w * min(cols, len(tiles)), h * rows), (0, 0, 0, 255))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * w, (i // cols) * h))
    path = os.path.join(OUT, prefix + '.png')
    sheet.save(path)
    return path


def around_player(half_w=110, half_h=120, dy=-60):
    def f(s):
        cx = s['x'] - s['camX']
        cy = s['y'] - s['camY'] + dy
        return (int(cx - half_w), int(cy - half_h), int(cx + half_w), int(cy + half_h))
    return f


if __name__ == '__main__':
    g = Game()
    try:
        print(json.dumps(g.js("window.__game.loop.actualFps")))
    finally:
        g.close()


RESET_JS = """([x, y]) => { const sc = window.__drv.levelScene(); const p = sc.player;
  p.hearts = p.maxHearts; sc.registry.set('hearts', p.hearts); p.invulnerableUntil = 0;
  if (p.vine) p.releaseVine(false, sc.time.now);
  p.body.reset(x, y); p.setVelocity(0, 0); p.setAcceleration(0, 0);
  sc.input.keyboard.resetKeys(); p.jumpsUsed = 0; p.vineMomentumSpeed = 0;
  if (sc.__story) sc.__story.safePos = { x, y };
  return true; }"""


def reset_at(g, x, y, settle=0.35):
    g.js(RESET_JS, [x, y])
    time.sleep(settle)
    g.js(RESET_JS, [x, y])
