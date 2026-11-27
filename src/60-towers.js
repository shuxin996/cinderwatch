
const G = {
  B: null, t: 0, gold: 0, lives: 20, maxLives: 20, wave: 0, slain: 0, level: 0, run: 1,
  towers: [], mons: [], men: [], arrows: [], shells: [], stuck: [], hbars: [], orbs: [], zones: [], phase: 'play',
};
const TOWER = {
  archer: { name: '弓箭塔', short: '弓箭', icon: 'archer', cost: [70, 90, 140], range: [6.2, 6.8, 7.4], dmg: [9, 11, 14], rate: [.85, .78, .7], n: [1, 2, 3], air: true, ground: true, light: [80, 105, 140], desc: ['发射快速燃烧的箭矢。', '可以命中飞行单位。'] },
  bombard: { name: '投石炮', short: '投石炮', icon: 'bombard', cost: [120, 130, 190], range: [7.4, 8.0, 8.6], minRange: 2.3, dmg: [36, 60, 98], splash: [1.55, 1.8, 2.1], rate: [2.9, 2.7, 2.5], air: false, ground: true, light: [50, 62, 80], desc: ['缓慢飞行后爆炸的炮弹。', '只能攻击地面目标。'] },
  spire: { name: '雷暴尖塔', short: '尖塔', icon: 'spire', cost: [110, 120, 180], range: [5.5, 6.0, 6.5], dmg: [17, 25, 35], jumps: [3, 4, 6], rate: [2.3, 2.1, 1.9], slow: [.36, .42, .48], slowT: [1.3, 1.5, 1.7], air: true, ground: true, light: [16, 20, 26], desc: ['连锁闪电，可减速。', '可以命中飞行单位。'] },
  guard: { name: '守卫哨所', short: '守卫', icon: 'guard', cost: [80, 90, 150], range: [3.4, 3.7, 4.0], n: [2, 3, 3], hp: [62, 90, 135], dmg: [7, 10, 15], rate: [7, 6, 5], air: false, ground: true, light: [55, 70, 90], desc: ['阻挡敌人的步兵，', '在路上与敌人对决。'] },
};
Object.assign(TOWER, {
  mage: { name: '奥术法师塔', short: '法师', icon: 'mage', cost: [100, 120, 180], range: [6.0, 6.6, 7.2], dmg: [16, 24, 36], rate: [1.25, 1.1, .95], burn: [0, 6, 11], air: true, ground: true, light: [30, 38, 48], lcol: [.75, .45, 1], desc: ['追踪奥术弹，无视护甲，', '二级起附带灼烧。'], vs: '克制：骑士 魔像 石像鬼' },
  frost: { name: '寒霜方尖碑', short: '寒霜', icon: 'frost', cost: [90, 110, 160], range: [5.6, 6.0, 6.5], dmg: [5, 8, 12], rate: [3.2, 2.9, 2.6], zoneR: [1.5, 1.75, 2.0], zoneT: [3.5, 4.2, 5.0], slow: [.4, .48, .55], freeze: [.9, 1.1, 1.4], air: false, ground: true, light: [20, 26, 32], lcol: [.5, .85, 1], desc: ['在路面留下冰霜区减速，', '停留太久会被冻住。'], vs: '克制：快怪 火元素' },
  crypt: { name: '亡灵墓穴', short: '墓穴', icon: 'crypt', cost: [110, 120, 170], range: [5.0, 5.6, 6.2], chance: [.35, .45, .6], cap: [3, 4, 6], n: [3, 3, 3], hp: [50, 75, 110], dmg: [8, 11, 16], rate: [1, 1, 1], air: false, ground: true, light: [22, 28, 36], lcol: [.4, 1, .5], desc: ['附近倒下的人形敌人', '可能复活为你作战。'], vs: '克制：成群的骷髅' },
  shrine: { name: '圣火祭坛', short: '祭坛', icon: 'shrine', cost: [120, 130, 180], range: [4.6, 5.2, 5.8], haste: [.18, .28, .4], rangeUp: [.06, .1, .14], heal: [0, 5, 9], dmg: [0, 0, 0], rate: [1, 1, 1], air: false, ground: false, light: [60, 75, 95], desc: ['不攻击。加快附近塔的', '攻速和射程，幽灵现形。'], vs: '辅助：放在塔群中间' },
});
TOWER.archer.vs = '克制：飞行单位'; TOWER.bombard.vs = '克制：成群的地面怪'; TOWER.spire.vs = '克制：飞行 群怪 冰冻目标'; TOWER.guard.vs = '克制：拦截地面怪';
const TOWER_KINDS = ['archer', 'bombard', 'spire', 'guard', 'mage', 'frost', 'crypt', 'shrine'];

function blueprint(kind, lvl) {
  const pieces = [], mounts = {};
  const piece = (id, order, fn) => {
    const S = new Soup(); fn(S); if (!S.verts) return; let minY = 1e9; for (let i = 1; i < S.P.length; i += 3) minY = Math.min(minY, S.P[i]);
    for (let i = 1; i < S.P.length; i += 3) S.P[i] -= minY; pieces.push({ id, order, y: minY, soup: S });
  };
  const w = COL.wood, wd = COL.woodD, wl = COL.woodL, st = COL.stone, sdk = COL.stoneD, sl = COL.stoneL, iron = COL.iron, rng = soupRng;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const brazier = (S, x, y, z, bs) => {
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5; S.seg([x + Math.cos(a) * bs * .42, y, z + Math.sin(a) * bs * .42], [x + Math.cos(a) * bs * .2, y + bs * .5, z + Math.sin(a) * bs * .2], .028, .028, iron, { l: L_METAL, n: 4 }); }
    S.cyl(bs * .3, bs * .22, x, y + bs * .56, z, iron, { n: 8, l: L_METAL, rt: 1.5, rough: .6 });
    S.cyl(bs * .4, .04, x, y + bs * .68, z, COL.ember, { n: 8, emis: .55, jit: 0 });
  };
  if (kind === 'archer') {
    const bH = [.25, 1.0, 1.9][lvl], H = [2.0, 2.7, 3.35][lvl], W = [.75, .85, .93][lvl], bs = [.5, .62, .8][lvl];
    piece('base', 0, S => {
      if (lvl === 0) { S.box(1.6, .25, 1.6, 0, .125, 0, sdk, { l: L_MASON }); for (const [a, b] of corners) S.box(.3, .32, .3, a * .66, .16, b * .66, sl, { l: L_MASON }); }
      else {
        S.box(1.8, .3, 1.8, 0, .15, 0, sdk, { l: L_MASON });
        S.cyl(1.02, bH - .3, 0, .3 + (bH - .3) / 2, 0, st, { n: 4, l: L_MASON, rt: .9, r: [0, PI / 4, 0] });
        S.box(1.42, .14, 1.42, 0, bH - .04, 0, sl, { l: L_MASON });
        S.box(.3, .5, .06, 0, .56, .71, COL.black, { jit: 0 });
        if (lvl === 2) { for (const [a, b] of corners) for (let q = 0; q < 3; q++) S.box(.22, .2, .22, a * (.7 - q * .025), .5 + q * .5, b * (.7 - q * .025), sl, { l: L_MASON }); for (const sg of [-1, 1]) S.box(.06, .5, .12, sg * .7, 1.1, 0, COL.black, { jit: 0 }); }
      }
    });
    piece('posts', 1, S => {
      for (const [a, b] of corners) S.seg([a * .62, bH, b * .62], [a * (W - .1), H, b * (W - .1)], .085, .075, wd, { l: L_WOOD });
      const ym = (bH + H) / 2, r = lerp(.62, W - .1, .5);
      for (let k = 0; k < 4; k++) { const [a, b] = corners[k], [c, d] = corners[(k + 1) % 4]; S.seg([a * r, ym, b * r], [c * r, ym, d * r], .05, .05, w, { l: L_WOOD, n: 4 }); }
    });
    piece('brace', 2, S => {
      for (let k = 0; k < 4; k++) { const [a, b] = corners[k], [c, d] = corners[(k + 1) % 4]; S.seg([a * .62, bH + .1, b * .62], [c * (W - .12), H - .15, d * (W - .12)], .035, .035, w, { l: L_WOOD, n: 4 }); S.seg([c * .62, bH + .1, d * .62], [a * (W - .12), H - .15, b * (W - .12)], .035, .035, wl, { l: L_WOOD, n: 4 }); }
    });
    piece('deck', 3, S => {
      S.box(W * 2 + .16, .1, W * 2 + .16, 0, H + .05, 0, w, { l: L_WOOD }); for (const sg of [-1, 1]) S.box(W * 2 + .3, .09, .1, 0, H - .04, sg * (W - .1), wd, { l: L_WOOD });
      for (const sg of [-1, 1]) S.box(.1, .09, W * 2 + .3, sg * (W - .1), H - .04, 0, wd, { l: L_WOOD });
      if (lvl >= 1) for (const [a, b] of corners) S.seg([a * (W - .1), H - .55, b * (W - .1)], [a * (W + .06), H - .02, b * (W + .06)], .04, .04, wd, { l: L_WOOD, n: 4 });
    });
    piece('rail', 4, S => {
      const y0 = H + .1;
      for (let k = 0; k < 4; k++) {
        const ang = k * HPI, cs = Math.cos(ang), sn = Math.sin(ang);
        for (let j = 0; j < 5; j++) {
          if (k === 2 && (j === 1 || j === 2)) continue;
          const u = (j - 2) * W * .42, hh = (j & 1) ? .34 : .5, x = u * cs + (W + .02) * sn, z = -u * sn + (W + .02) * cs;
          S.box(W * .4, hh, .06, x, y0 + hh / 2, z, (j & 1) ? w : wl, { l: L_WOOD, r: [0, ang, 0] });
        }
      }
      for (const [a, b] of corners) S.box(.1, .66, .1, a * (W + .02), y0 + .33, b * (W + .02), wd, { l: L_WOOD });
      if (lvl >= 1) for (const u of lvl === 2 ? [-.5, 0, .5] : [-.35, .35]) { S.cyl(.2, .04, u, y0 + .22, W + .08, lvl === 2 ? COL.ironL : COL.clothB, { n: 8, r: [HPI, 0, 0], l: lvl === 2 ? L_METAL : L_WOOD }); S.sph(.05, u, y0 + .22, W + .11, COL.ironL, { l: L_METAL, w: 5, h: 3, smooth: false }); }
      if (lvl === 2) for (const sg of [-1, 1]) S.cyl(.2, .04, sg * (W + .08), y0 + .22, .1, COL.clothR, { n: 8, r: [0, 0, HPI], l: L_WOOD });
    });
    piece('ladder', 5, S => {
      for (const sg of [-1, 1]) S.seg([sg * .17, 0, -W - .5], [sg * .17, H + .15, -W - .06], .035, .035, wd, { l: L_WOOD, n: 4 });
      for (let y = .3; y < H; y += .34) { const u = y / (H + .15); S.box(.36, .04, .05, 0, y, lerp(-W - .5, -W - .06, u), wl, { l: L_WOOD }); }
    });
    const bx = -W + .34, bz = -W + .36, by = H + .1 + (lvl === 2 ? .35 : 0);
    piece('brazier', 6, S => { if (lvl === 2) S.cyl(.2, .38, bx, H + .29, bz, sdk, { n: 6, l: L_MASON }); brazier(S, bx, by, bz, bs); });
    if (lvl >= 1) piece('flag', 7, S => { S.seg([W - .08, H + .1, -W + .08], [W - .08, H + 1.75, -W + .08], .035, .025, wd, { l: L_WOOD, n: 4 }); const T = new Soup(); clothPanel(T, { x0: 0, x1: .62, yTop: 0, len: .36, z: 0, col: COL.clothR, rng, nx: 3, ny: 2, rag: 0, sway: 1.2 }); S.merge(T, { p: [W - .06, H + 1.7, -W + .08], ao: null }); });
    mounts.flame = [bx, by + bs * .7, bz]; mounts.flameSize = bs; mounts.top = H + 1.7;
    mounts.archers = [[[.12, H + .1, .28]], [[-.3, H + .1, .42], [.42, H + .1, .1]], [[-.35, H + .1, .5], [.5, H + .1, .3], [.25, H + .1, -.4]]][lvl];
  } else if (kind === 'bombard') {
    const Rr = [1.0, 1.08, 1.15][lvl], H = [1.1, 1.5, 1.9][lvl];
    piece('plinth', 0, S => { S.cyl(Rr + .22, .26, 0, .13, 0, sdk, { n: 10, l: L_MASON }); if (lvl === 2) S.cyl(Rr + .12, .2, 0, .36, 0, st, { n: 10, l: L_MASON }); });
    piece('drum', 1, S => {
      S.cyl(Rr, H, 0, H / 2, 0, st, { n: 10, l: L_MASON, rt: .93, jit: .03 });
      for (let c = 0; c < 2 + lvl; c++) S.cyl(Rr * (1 - .05 * (.5 + c) / (2 + lvl)) + .012, .16, 0, .35 + c * (H - .5) / (1.5 + lvl), 0, mixC(sdk, sl, rng()), { n: 10, l: L_MASON });
      S.box(.34, .55, .1, 0, .3, Rr * .97, COL.black, { jit: 0 });
    });
    if (lvl >= 1) piece('butt', 2, S => { for (let k = 0; k < 4; k++) { const a = k * HPI + PI / 4; S.box(.36, H * .8, .5, Math.cos(a) * (Rr + .06), H * .36, Math.sin(a) * (Rr + .06), sdk, { l: L_MASON, r: [0, -a + HPI, 0] }); S.box(.4, .12, .56, Math.cos(a) * (Rr + .06), H * .78, Math.sin(a) * (Rr + .06), sl, { l: L_MASON, r: [0, -a + HPI, 0] }); } });
    if (lvl >= 1) piece('bands', 3, S => { for (const y of lvl === 2 ? [H * .45, H * .8] : [H * .65]) S.cyl(Rr * .965 + .02, .07, 0, y, 0, iron, { n: 10, l: L_METAL, rough: .55 }); });
    piece('deck', 4, S => { S.cyl(Rr * .93 + .14, .16, 0, H + .02, 0, sl, { n: 10, l: L_MASON }); S.cyl(Rr * .8, .06, 0, H + .12, 0, w, { n: 10, l: L_WOOD }); });
    piece('rim', 5, S => { for (let k = 0; k < 10; k++) { if (k % 5 === 0) continue; const a = (k + .5) / 10 * TAU + HPI; S.box(.46, .34, .22, Math.cos(a) * Rr * .96, H + .27, Math.sin(a) * Rr * .96, lvl === 2 && (k & 1) ? iron : mixC(sdk, sl, rng()), { l: lvl === 2 && (k & 1) ? L_METAL : L_MASON, r: [0, -a + HPI, 0] }); } });
    piece('ammo', 6, S => { for (const [x, z] of [[-.42, -.5], [-.24, -.52], [-.33, -.36]]) S.sph(.09, x, H + .22, z, mulC(iron, .8), { l: L_METAL, w: 6, h: 4, smooth: false }); S.sph(.09, -.33, H + .36, -.46, mulC(iron, .8), { l: L_METAL, w: 6, h: 4, smooth: false }); PROP.barrel(S, .45, H + .13, -.5, .75, rng); });
    const lx = -Rr * .78, lz = .2, lh = H + 1.25 + lvl * .12;
    piece('lantern', 7, S => {
      for (const sg of lvl === 2 ? [-1, 1] : [1]) {
        const x = lx * sg;
        S.seg([x, H + .1, lz], [x, lh, lz], .04, .035, iron, { l: L_METAL, n: 4 }); S.seg([x, lh, lz], [x - sg * -.0, lh, lz + .32], .03, .03, iron, { l: L_METAL, n: 4 });
        S.box(.2, .05, .2, x, lh - .08, lz + .32, iron, { l: L_METAL }); S.box(.16, .2, .16, x, lh - .22, lz + .32, COL.ember, { emis: .8, jit: 0 }); S.box(.2, .04, .2, x, lh - .34, lz + .32, iron, { l: L_METAL });
        for (const [a, b] of corners) S.box(.025, .22, .025, x + a * .09, lh - .22, lz + .32 + b * .09, iron, { l: L_METAL });
      }
    });
    mounts.flame = [lx, lh - .3, lz + .32]; mounts.flameSize = .26 + lvl * .05; mounts.flame2 = lvl === 2 ? [-lx, lh - .3, lz + .32] : null; mounts.top = H + 1.6;
    mounts.gun = [0, H + .15, .05]; mounts.gunLen = [.95, 1.12, 1.25][lvl]; mounts.gunR = [.15, .18, .215][lvl];
  } else if (kind === 'spire') {
    const H = [2.7, 3.4, 4.1][lvl], bas = COL.basalt, basL = COL.basaltL, cu = C(0x8a5a3a);
    piece('plinth', 0, S => { S.box(1.55, .22, 1.55, 0, .11, 0, basL, { l: L_ROCK }); S.box(1.18, .2, 1.18, 0, .32, 0, bas, { l: L_ROCK }); if (lvl >= 1) for (const [a, b] of corners) S.cone(.16, .5, a * .62, .5, b * .62, basL, { n: 4, l: L_ROCK }); });
    piece('shaft', 1, S => {
      S.cyl(.62, H - .42, 0, .42 + (H - .42) / 2, 0, bas, { n: 4, l: L_ROCK, rt: .52, r: [0, PI / 4, 0], jit: .03 });
      for (let k = 0; k < 4; k++) { const a = k * HPI, n = 3 + lvl; for (let j = 0; j < n; j++) { const u = (j + .7) / (n + .6), y = .42 + u * (H - .42), rr2 = lerp(.62, .32, u) * .7072 + .012; S.box(.07, .2, .02, Math.sin(a) * rr2, y, Math.cos(a) * rr2, COL.crystal, { emis: .5, jit: 0, r: [-.12, a, 0], ro: 'YXZ' }); } }
    });
    if (lvl >= 1) piece('bands', 2, S => { for (const u of lvl === 2 ? [.3, .58, .82] : [.4, .75]) S.cyl(lerp(.62, .32, u) + .03, .09, 0, .42 + u * (H - .42), 0, cu, { n: 4, l: L_METAL, r: [0, PI / 4, 0], rough: .45 }); });
    piece('claws', 3, S => { for (let k = 0; k < 4; k++) { const a = k * HPI + PI / 4, cs = Math.cos(a), sn = Math.sin(a); S.seg([cs * .22, H - .12, sn * .22], [cs * .46, H + .26, sn * .46], .06, .045, basL, { l: L_ROCK, n: 4 }); S.seg([cs * .46, H + .26, sn * .46], [cs * .26, H + .74, sn * .26], .045, .012, lvl ? cu : basL, { l: lvl ? L_METAL : L_ROCK, n: 4 }); } S.cyl(.34, .12, 0, H - .02, 0, basL, { n: 4, l: L_ROCK, r: [0, PI / 4, 0] }); });
    mounts.crystal = [0, H + .42, 0]; mounts.crystalS = [.2, .24, .29][lvl]; mounts.shards = [0, 2, 4][lvl]; mounts.rings = lvl === 2; mounts.top = H + 1.2; mounts.flame = null; mounts.lightAt = [0, H + .45, 0];
  } else if (kind === 'mage') {
    const H = [2.3, 2.9, 3.5][lvl], Rr = [.6, .66, .72][lvl], vio = C(0x4e3878), rune = C(0xc49cff), br = COL.brass;
    piece('plinth', 0, S => { S.cyl(Rr + .42, .24, 0, .12, 0, sdk, { n: 8, l: L_MASON }); S.cyl(Rr + .26, .18, 0, .33, 0, st, { n: 8, l: L_MASON }); if (lvl >= 1) for (const [a, b] of corners) S.box(.26, .3, .26, a * (Rr + .3), .39, b * (Rr + .3), sl, { l: L_MASON }); });
    piece('tower', 1, S => {
      S.cyl(Rr, H - .42, 0, .42 + (H - .42) / 2, 0, st, { n: 8, l: L_MASON, rt: .86, jit: .02 });
      S.cyl(Rr * .93 + .04, .1, 0, .42 + (H - .42) * .5, 0, br, { n: 8, l: L_METAL });
      for (let k = 0; k < 4; k++) { const a = k * HPI + PI / 8, r2 = lerp(Rr, Rr * .86, .3) + .01; S.box(.1, .26, .03, Math.sin(a) * r2, .42 + (H - .42) * .3, Math.cos(a) * r2, rune, { emis: .6, jit: 0, r: [0, a, 0] }); }
      S.box(.3, .5, .06, 0, .64, Rr * .98, COL.black, { jit: 0 });
      if (lvl >= 1) for (let k = 0; k < 2; k++) { const a = k * PI + HPI, r2 = lerp(Rr, Rr * .86, .72) + .02; S.box(.28, .62, .03, Math.sin(a) * r2, .42 + (H - .42) * .7, Math.cos(a) * r2, vio, { l: L_CLOTH, r: [0, a, 0] }); S.box(.12, .12, .035, Math.sin(a) * (r2 + .01), .42 + (H - .42) * .72, Math.cos(a) * (r2 + .01), COL.gold, { l: L_METAL, r: [0, a, 0] }); }
    });
    piece('crown', 2, S => {
      S.cyl(Rr * .86 + .14, .12, 0, H + .02, 0, sl, { n: 8, l: L_MASON });
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8; S.box(.16, .2, .14, Math.cos(a) * (Rr * .86 + .08), H + .18, Math.sin(a) * (Rr * .86 + .08), sl, { l: L_MASON, r: [0, -a + HPI, 0] }); }
      for (let k = 0; k < 4; k++) { const a = k * HPI + PI / 4, cs = Math.cos(a), sn = Math.sin(a); S.seg([cs * .3, H + .05, sn * .3], [cs * .42, H + .5, sn * .42], .045, .035, br, { l: L_METAL, n: 4 }); S.seg([cs * .42, H + .5, sn * .42], [cs * .2, H + .9, sn * .2], .035, .012, br, { l: L_METAL, n: 4 }); }
    });
    mounts.crystal = [0, H + .72, 0]; mounts.crystalS = [.16, .19, .23][lvl]; mounts.shards = [1, 3, 5][lvl]; mounts.rings = lvl === 2; mounts.top = H + 1.3; mounts.flame = null; mounts.lightAt = [0, H + .72, 0];
  } else if (kind === 'frost') {
    const H = [2.5, 3.2, 3.9][lvl], ice = C(0xa8dcff), stB = C(0x667186), stBL = C(0x8590a6), ch = .5 + lvl * .15;
    piece('plinth', 0, S => { S.box(1.5, .22, 1.5, 0, .11, 0, sdk, { l: L_MASON }); S.box(1.12, .2, 1.12, 0, .32, 0, stBL, { l: L_ROCK }); for (const [a, b] of corners) S.cone(.12, ch, a * .6, .42 + ch / 2, b * .6, ice, { n: 4, emis: .35, jit: 0 }); });
    piece('obelisk', 1, S => {
      S.cyl(.42, H - .42, 0, .42 + (H - .42) / 2, 0, stB, { n: 4, l: L_ROCK, rt: .55, r: [0, PI / 4, 0], jit: .02 });
      for (let k = 0; k < 4; k++) { const a = k * HPI, n = 2 + lvl; for (let j = 0; j < n; j++) { const u = (j + .6) / (n + .4), y = .42 + u * (H - .42), r2 = lerp(.42, .23, u) * .7072 + .012; S.box(.06, .16, .02, Math.sin(a) * r2, y, Math.cos(a) * r2, ice, { emis: .55, jit: 0, r: [-.1, a, 0], ro: 'YXZ' }); } }
      if (lvl >= 1) for (const u of lvl === 2 ? [.35, .7] : [.5]) S.cyl(lerp(.42, .23, u) + .03, .08, 0, .42 + u * (H - .42), 0, COL.ironL, { n: 4, l: L_METAL, r: [0, PI / 4, 0] });
    });
    piece('cap', 2, S => { S.cone(.24, .45, 0, H + .2, 0, stBL, { n: 4, l: L_ROCK, r: [0, PI / 4, 0] }); for (let k = 0; k < 3 + lvl; k++) { const a = k * TAU / (3 + lvl), cs = Math.cos(a), sn = Math.sin(a); S.seg([cs * .2, H - .1, sn * .2], [cs * .42, H + .35, sn * .42], .05, .01, ice, { emis: .4, n: 4 }); } });
    mounts.crystal = [0, H + .95, 0]; mounts.crystalS = [.16, .19, .23][lvl]; mounts.shards = [2, 3, 5][lvl]; mounts.rings = false; mounts.top = H + 1.4; mounts.flame = null; mounts.lightAt = [0, H + .9, 0];
  } else if (kind === 'crypt') {
    const W = [1.4, 1.6, 1.8][lvl], D = [1.2, 1.35, 1.5][lvl], wh = [.95, 1.15, 1.4][lvl], moss = C(0x535f52), grn = C(0x7dff9a), bone = C(0xe0d6bd), rh = .5 + lvl * .15, y1 = .18 + wh;
    piece('floor', 0, S => { S.box(W + .55, .18, D + .6, 0, .09, .05, sdk, { l: L_MASON }); S.box(.8, .1, .35, 0, .05, D / 2 + .5, st, { l: L_MASON }); });
    piece('walls', 1, S => {
      S.box(W, wh, D, 0, .18 + wh / 2, 0, moss, { l: L_MASON, jit: .03 });
      for (const sg of [-1, 1]) for (const zz of [-1, 1]) S.box(.16, wh + .12, .16, sg * W / 2, .18 + (wh + .12) / 2, zz * D / 2, sl, { l: L_MASON });
      S.box(.52, .78, .08, 0, .18 + .39, D / 2, COL.black, { jit: 0 }); S.box(.34, .6, .02, 0, .18 + .32, D / 2 + .05, grn, { emis: .45, jit: 0 });
      S.box(.74, .14, .16, 0, .18 + .84, D / 2 + .03, sl, { l: L_MASON });
      S.box(.18, .18, .04, 0, .18 + .84, D / 2 + .12, bone, { l: L_PLAIN });
    });
    piece('roof', 2, S => { S.box(W + .22, .14, D + .22, 0, y1 + .07, 0, sl, { l: L_MASON }); S.cyl(W * .42, rh, 0, y1 + .14 + rh / 2, 0, moss, { n: 6, l: L_MASON, rt: .55 }); S.box(.2, .2, .2, 0, y1 + .14 + rh + .1, 0, sl, { l: L_MASON }); S.sph(.15, 0, y1 + .14 + rh + .32, 0, bone, { l: L_PLAIN, w: 6, h: 4, smooth: false }); });
    piece('graves', 3, S => { const gs = [[-W / 2 - .38, .55], [W / 2 + .38, .2], [-W / 2 - .34, -.45], [W / 2 + .36, -.5]]; for (let i = 0; i < 2 + lvl; i++) { const [x, z] = gs[i]; S.box(.3, .44, .09, x, .22, z, i & 1 ? sl : st, { l: L_MASON, r: [rng() * .2 - .1, rng() * .5 - .25 + HPI, rng() * .16 - .08] }); } });
    if (lvl >= 1) piece('braziers', 4, S => { for (const sg of [-1, 1]) { S.cyl(.12, .6, sg * (W / 2 + .14), .3, D / 2 + .38, sdk, { n: 6, l: L_MASON }); S.cyl(.17, .08, sg * (W / 2 + .14), .64, D / 2 + .38, grn, { n: 6, emis: .7, jit: 0 }); } });
    mounts.flame = null; mounts.lightAt = [0, y1 + rh + .5, 0]; mounts.top = y1 + rh + .7; mounts.door = [0, 0, D / 2 + .45];
    mounts.green = lvl >= 1 ? [[-(W / 2 + .14), .78, D / 2 + .38], [W / 2 + .14, .78, D / 2 + .38]] : [];
  } else if (kind === 'shrine') {
    const Rr = [1.0, 1.1, 1.2][lvl], ph = [1.3, 1.6, 1.9][lvl], np = lvl ? 6 : 4, bs = .55 + lvl * .1, ay = .36;
    piece('base', 0, S => { S.cyl(Rr + .28, .2, 0, .1, 0, sdk, { n: 10, l: L_MASON }); S.cyl(Rr + .05, .16, 0, .28, 0, sl, { n: 10, l: L_MASON }); S.box(.7, .1, .4, 0, .05, Rr + .38, st, { l: L_MASON }); });
    piece('pillars', 1, S => { for (let k = 0; k < np; k++) { const a = k * TAU / np + PI / np, x = Math.cos(a) * Rr * .8, z = Math.sin(a) * Rr * .8; S.box(.24, .12, .24, x, ay + .06, z, sl, { l: L_MASON }); S.cyl(.1, ph, x, ay + .12 + ph / 2, z, st, { n: 6, l: L_MASON }); S.cyl(.12, .06, x, ay + .12 + ph * .78, z, COL.gold, { n: 6, l: L_METAL }); S.box(.26, .12, .26, x, ay + .18 + ph, z, sl, { l: L_MASON }); if (lvl === 2) S.cone(.08, .3, x, ay + .39 + ph, z, COL.gold, { n: 4, l: L_METAL }); } });
    if (lvl >= 1) piece('ring', 2, S => { const n = 12, y = ay + .3 + ph; for (let k = 0; k < n; k++) { const a = k / n * TAU; S.box(.52 * Rr, .08, .1, Math.cos(a) * Rr * .8, y, Math.sin(a) * Rr * .8, COL.brass, { l: L_METAL, r: [0, -a + HPI, 0] }); } });
    piece('altar', 3, S => { S.box(.6, .5, .6, 0, ay + .25, 0, sl, { l: L_MASON }); S.box(.74, .08, .74, 0, ay + .54, 0, COL.gold, { l: L_METAL }); S.box(.5, .12, .5, 0, ay + .64, 0, st, { l: L_MASON }); brazier(S, 0, ay + .7, 0, bs); });
    mounts.flame = [0, ay + .7 + bs * .7, 0]; mounts.flameSize = bs; mounts.top = ay + ph + .8;
  } else {
    const W = [1.5, 1.7, 1.9][lvl], D = [1.3, 1.4, 1.5][lvl], wh = [1.05, 1.25, 1.5][lvl], stoneWalls = lvl === 2;
    piece('floor', 0, S => { S.box(W + .5, .16, D + .7, 0, .08, .1, sdk, { l: L_MASON }); S.box(.7, .1, .4, 0, .05, D / 2 + .55, st, { l: L_MASON }); });
    piece('walls', 1, S => {
      const wc = stoneWalls ? st : C(0x8f8468), wlay = stoneWalls ? L_MASON : L_PLAIN;
      if (lvl === 1) S.box(W + .04, .5, D + .04, 0, .41, 0, st, { l: L_MASON });
      S.box(W, wh, D, 0, .16 + wh / 2, 0, wc, { l: wlay, jit: .03 });
      if (!stoneWalls) { for (const [a, b] of corners) S.box(.12, wh + .04, .12, a * W / 2, .16 + wh / 2, b * D / 2, wd, { l: L_WOOD }); for (const sg of [-1, 1]) { S.box(W, .1, .08, 0, .16 + wh * .55, sg * D / 2, wd, { l: L_WOOD }); S.seg([sg * W * .5, .2, D / 2 + .01], [sg * W * .22, .16 + wh, D / 2 + .01], .04, .04, wd, { l: L_WOOD, n: 4 }); } S.box(.08, .1, D, W / 2, .16 + wh * .55, 0, wd, { l: L_WOOD }); S.box(.08, .1, D, -W / 2, .16 + wh * .55, 0, wd, { l: L_WOOD }); }
      S.box(.5, .82, .12, 0, .57, D / 2, COL.black, { jit: 0 }); S.box(.66, .1, .16, 0, 1.02, D / 2 + .02, wd, { l: L_WOOD }); for (const sg of [-1, 1]) S.box(.09, .86, .16, sg * .29, .59, D / 2 + .02, wd, { l: L_WOOD });
      S.box(.24, .24, .08, W * .32, .16 + wh * .62, D / 2 + .01, COL.black, { jit: 0 }); S.box(.08, .3, .3, W / 2 + .01, .16 + wh * .6, 0, COL.black, { jit: 0 });
    });
    piece('roof', 2, S => {
      const rl = lvl === 0 ? L_THATCH : L_SLATE, rc = lvl === 0 ? COL.thatch : COL.slate, y0 = .16 + wh, rh = [.75, .85, .9][lvl], sl2 = Math.atan2(rh, D / 2 + .2), len = Math.hypot(rh, D / 2 + .2) + .12;
      for (const sg of [-1, 1]) S.box(W + .36, .09, len, 0, y0 + rh / 2 - .02, sg * (D / 4 + .1), rc, { l: rl, r: [sg * sl2, 0, 0] });
      for (const sg of [-1, 1]) { const T = [[sg * W / 2, y0, -D / 2], [sg * W / 2, y0, D / 2], [sg * W / 2, y0 + rh, 0]]; const gc = stoneWalls ? st : C(0x8f8468); if (sg > 0) S.tri(T[0], T[2], T[1], gc, stoneWalls ? L_MASON : L_PLAIN, .95); else S.tri(T[0], T[1], T[2], gc, stoneWalls ? L_MASON : L_PLAIN, .95); }
      S.box(W + .44, .1, .14, 0, y0 + rh + .02, 0, wd, { l: L_WOOD });
      S.box(.26, .5, .26, -W * .3, y0 + rh * .7 + .1, -D * .2, sdk, { l: L_MASON });
    });
    piece('rack', 3, S => { const x = -W / 2 - .28; S.box(.06, .7, .06, x, .5, -.3, wd, { l: L_WOOD }); S.box(.06, .7, .06, x, .5, .3, wd, { l: L_WOOD }); S.box(.05, .05, .7, x, .78, 0, w, { l: L_WOOD }); for (const z of [-.2, 0, .2]) { S.seg([x + .06, .12, z], [x - .04, 1.5, z], .018, .018, wl, { l: L_WOOD, n: 4 }); S.cone(.035, .14, x - .045, 1.56, z, COL.steel, { n: 4, l: L_METAL }); } if (lvl >= 1) { S.cyl(.2, .04, W / 2 + .03, .75, -.25, COL.clothB, { n: 8, r: [0, 0, HPI], l: L_WOOD }); } });
    if (lvl === 2) piece('turret', 4, S => { const x = W / 2 - .2, z = -D / 2 + .2, th = 2.7; S.box(.8, th, .8, x, th / 2 + .16, z, st, { l: L_MASON }); S.box(.94, .16, .94, x, th + .2, z, sl, { l: L_MASON }); for (const [a, b] of corners) S.box(.24, .26, .24, x + a * .35, th + .4, z + b * .35, mixC(sdk, sl, rng()), { l: L_MASON }); S.box(.1, .4, .06, x, th * .7, z + .41, COL.black, { jit: 0 }); });
    const fx = W / 2 + .12, fz = D / 2 + .5, bs = [.34, .46, .6][lvl];
    piece('fire', 5, S => { if (lvl === 0) { S.seg([fx, 0, fz], [fx, 1.05, fz], .04, .035, wd, { l: L_WOOD, n: 4 }); S.cyl(.07, .12, fx, 1.1, fz, iron, { n: 6, l: L_METAL, rt: 1.4 }); } else brazier(S, fx, .08, fz, bs + .1); });
    piece('flag', 6, S => { const x = lvl === 2 ? W / 2 - .2 : -W / 2 + .1, z = lvl === 2 ? -D / 2 + .2 : -D / 2 + .1, y0 = lvl === 2 ? 3.1 : .2, y1 = lvl === 2 ? 4.5 : 2.9; S.seg([x, y0, z], [x, y1, z], .04, .028, wd, { l: L_WOOD, n: 4 }); const T = new Soup(); clothPanel(T, { x0: 0, x1: .7, yTop: 0, len: .46, z: 0, col: COL.clothB, col2: mulC(COL.gold, .6), rng, nx: 4, ny: 3, rag: .2, sway: 1.1 }); S.merge(T, { p: [x + .03, y1 - .06, z], ao: null }); });
    mounts.flame = lvl === 0 ? [fx, 1.2, fz] : [fx, .08 + (bs + .1) * .72, fz]; mounts.flameSize = bs; mounts.door = [0, 0, D / 2 + .45]; mounts.top = lvl === 2 ? 3.4 : 2.2;
  }
  pieces.sort((a, b) => a.order - b.order);
  return { pieces, mounts };
}

function scaffoldGeo(w, h) {
  const S = new Soup(), c = mulC(COL.woodL, .9), c2 = COL.wood;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.seg([a * w, 0, b * w], [a * w, h, b * w], .04, .035, c, { l: L_WOOD, n: 4 });
  for (let y = .9; y < h; y += 1.05) for (let k = 0; k < 4; k++) { const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]], [a, b] = q[k], [cc, d] = q[(k + 1) % 4]; S.seg([a * w, y, b * w], [cc * w, y, d * w], .03, .03, c2, { l: L_WOOD, n: 4 }); if (k & 1) S.seg([a * w, y - .9, b * w], [cc * w, y, d * w], .022, .022, c, { l: L_WOOD, n: 3 }); }
  S.box(w * 1.2, .05, .34, 0, Math.min(h - .2, 1.95), w + .12, c2, { l: L_WOOD }); S.box(.34, .05, w * 1.2, -w - .12, Math.min(h - .25, .95), 0, c, { l: L_WOOD });
  return S.build();
}

let TOWER_STUN = false;
function findTarget(x, z, range, air, ground, minRange = 0) {
  if (G.phase !== 'play' || TOWER_STUN) return null;
  let best = null, bp = -1; const r2 = range * range, m2 = minRange * minRange;
  for (const m of G.mons) {
    if (m.dead || m.hp <= 0 || !m.vis) continue; if (m.fly ? !air : !ground) continue;
    const d = dist2(x, z, m.x, m.z); if (d > r2 || d < m2) continue;
    const sc = m.prog + (m.fly ? 2 : 0) + (m.def.boss ? -.0 : 0); if (sc > bp) { bp = sc; best = m; }
  }
  return best;
}
function aimPoint(m, dt, out) {
  if (m.fly) { out.x = m.x + m.vx * dt; out.y = m.y; out.z = m.z + m.vz * dt; return out; }
  const B = G.B, adv = m.blocked ? 0 : m.spdNow * dt, s2 = Math.min(B.L - .1, m.s + adv);
  pathAt(B, s2, out); out.x += -out.tz * m.lat; out.z += out.tx * m.lat; out.y += m.hitH; return out;
}

const _tv = new THREE.Vector3(), _tq = new THREE.Quaternion(), _tm = new THREE.Matrix4(), _tz = new THREE.Vector3(0, 0, 1), _ts = new THREE.Vector3(1, 1, 1), _ap = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };

class Tower {
  constructor(pad, kind, idx) {
    this.pad = pad; this.kind = kind; this.idx = idx; this.lvl = 0; this.def = TOWER[kind];
    this.x = pad.x; this.y = pad.y; this.z = pad.z; this.yaw = pad.face; this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
    this.spent = this.def.cost[0]; this.state = 'build'; this.bt = 0; this.cool = rr(.2, .8); this.kills = 0; this.dealt = 0; this.alive = true; this.recent = 0;
    this.group = new THREE.Group(); this.group.position.set(this.x, this.y, this.z); this.group.rotation.y = this.yaw; R.scene.add(this.group);
    this.pieces = []; this.staticMesh = null; this.scaf = null; this.flame = null; this.flame2 = null; this.archers = []; this.men = []; this.respawn = 0;
    this.em = { x: this.x, y: this.y + 3, z: this.z, r: 1, g: .56, b: .26, I: 0, range: 13, on: 0, alive: true, seed: rnd() * 50, spot: !['spire', 'mage', 'frost', 'crypt'].includes(kind), dx: this.sn, dz: this.cs, fl: 1, _spot: 0 };
    LT.emitters[idx] = this.em; pad.tower = this;
    this.gunYaw = 0; this.recoil = 0; this.charge = 0; this.spin = rnd() * 6; this.hover = 0; this.appear = 0;
    this.begin();
  }
  get range() { return this.def.range[this.lvl] * (1 + (this.rbuff || 0)); }
  w(l, out) { out.x = this.x + l[0] * this.cs + l[2] * this.sn; out.y = this.y + l[1]; out.z = this.z - l[0] * this.sn + l[2] * this.cs; return out; }
  begin() {
    const bp = blueprint(this.kind, this.lvl); this.bp = bp; this.mounts = bp.mounts; this.bt = 0; this.state = this.lvl ? 'upgrade' : 'build';
    this.clearModel(true);
    const n = bp.pieces.length, gap = Math.min(.2, 1.45 / n);
    bp.pieces.forEach((p, i) => {
      const mesh = new THREE.Mesh(p.soup.build(), MAT.world); mesh.castShadow = mesh.receiveShadow = true; mesh.visible = false; mesh.position.y = p.y + 2.4;
      this.group.add(mesh); this.pieces.push({ mesh, y: p.y, t0: .32 + i * gap, landed: false, soup: p.soup });
    });
    this.tEnd = .32 + n * gap + .3;
    this.scaf = new THREE.Mesh(scaffoldGeo(1.25, Math.min(4.4, bp.mounts.top + .3)), MAT.world); this.scaf.castShadow = true; this.scaf.scale.set(1, .01, 1); this.group.add(this.scaf);
    fxDust(this.x, this.y + .1, this.z, 7, 1.0, { speed: 1.6 });
    sfx('hammer', this.x, this.z, .8, .3);
  }
  clearModel(keepLights) {
    for (const p of this.pieces) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); } this.pieces.length = 0;
    for (const k of ['staticMesh', 'scaf', 'carriage', 'crystal']) if (this[k]) { this.group.remove(this[k]); this[k].traverse(o => { if (o.geometry) o.geometry.dispose(); }); this[k] = null; }
    this.barrel = null; this.shards = null; this.ringG = null;
    removeFlame(this.flame); removeFlame(this.flame2); this.flame = this.flame2 = null; this.em.on = keepLights ? this.em.on * .4 : 0;
    this.archers.length = 0;
  }
  finish() {
    const M = new Soup(); for (const p of this.pieces) M.merge(p.soup, { p: [0, p.y, 0], ao: [0, 1.0, .72] });
    for (const p of this.pieces) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); } this.pieces.length = 0;
    this.staticMesh = new THREE.Mesh(M.build(), MAT.world); this.staticMesh.castShadow = this.staticMesh.receiveShadow = true; this.group.add(this.staticMesh);
    if (this.scaf) { this.group.remove(this.scaf); this.scaf.geometry.dispose(); this.scaf = null; }
    const mt = this.mounts, lvl = this.lvl, d = this.def;
    if (mt.flame) { const p = this.w(mt.flame, {}); this.flame = addFlame({ x: p.x, y: p.y, z: p.z, size: mt.flameSize, on: 0, layers: mt.flameSize > .7 ? 2 : 1, glow: 1 }); this.em.x = p.x; this.em.y = p.y + .25; this.em.z = p.z; this.em.r = 1; this.em.g = .56; this.em.b = .26; }
    if (mt.flame2) { const p = this.w(mt.flame2, {}); this.flame2 = addFlame({ x: p.x, y: p.y, z: p.z, size: mt.flameSize, on: 0 }); }
    if (mt.lightAt) { const p = this.w(mt.lightAt, {}); this.em.x = p.x; this.em.y = p.y; this.em.z = p.z; const lc = d.lcol || [.45, .72, 1]; this.em.r = lc[0]; this.em.g = lc[1]; this.em.b = lc[2]; }
    this.em.I = d.light[lvl]; this.em.range = this.kind === 'archer' ? 12 : 10.5;
    if (this.kind === 'archer') mt.archers.forEach((a, i) => this.archers.push({ l: a, yaw: this.yaw, draw: 0, cool: .4 + i * .3, e: { scale: .82, ph: 0, mv: 0, atk: -1, bow: true, draw: 0, pitch: 0, tint: [1, .9, .7], x: 0, y: 0, z: 0, yaw: 0, flash: 0 } }));
    if (this.kind === 'bombard') this.makeGun();
    if (mt.crystal) this.makeCrystal();
    if (this.kind === 'guard') { this.respawn = .2; }
    this.state = 'active'; this.appear = 0;
    fxDust(this.x, this.y + .2, this.z, 10, 1.3, { speed: 2.2 });
    sfx('buildDone', this.x, this.z, 1);
    if (this.flame) fxEmbers(this.flame.x, this.flame.y, this.flame.z, 10, .2);
  }
  makeGun() {
    const mt = this.mounts, L = mt.gunLen, r = mt.gunR, S = new Soup(), br = this.lvl === 2 ? COL.iron : COL.bronze;
    S.cyl(.42, .12, 0, .06, 0, COL.woodD, { n: 8, l: L_WOOD }); for (const sg of [-1, 1]) { S.box(.09, .34, .62, sg * (r + .07), .26, 0, COL.wood, { l: L_WOOD }); S.cyl(.17, .07, sg * (r + .16), .17, -.12, COL.woodD, { n: 8, r: [0, 0, HPI], l: L_WOOD }); }
    this.carriage = new THREE.Mesh(S.build(), MAT.world); this.carriage.castShadow = this.carriage.receiveShadow = true; this.carriage.position.set(mt.gun[0], mt.gun[1], mt.gun[2]); this.group.add(this.carriage);
    const Bq = new Soup(), o = () => ({ n: 8, l: L_METAL, r: [HPI, 0, 0], rough: .42 });
    Bq.cyl(r, L, 0, 0, L / 2 - .28, br, Object.assign(o(), { rt: .8 })); Bq.cyl(r * 1.16, .12, 0, 0, L - .3, br, o()); Bq.cyl(r * .62, .03, 0, 0, L - .235, COL.black, Object.assign(o(), { jit: 0 }));
    for (const z of [-.2, L * .25, L * .55]) Bq.cyl(r * 1.1 - z * .03, .07, 0, 0, z, mulC(br, .8), o());
    Bq.sph(r * .9, 0, 0, -.3, br, { l: L_METAL, w: 6, h: 4, smooth: false, rough: .42 }); Bq.sph(r * .32, 0, 0, -.3 - r * .9, mulC(br, .8), { l: L_METAL, w: 5, h: 3, smooth: false });
    this.barrel = new THREE.Mesh(Bq.build(), MAT.world); this.barrel.castShadow = this.barrel.receiveShadow = true; this.barrel.position.set(0, .4, 0); this.barrel.rotation.x = -.42; this.carriage.add(this.barrel);
    this.gunYaw = this.yaw;
  }
  makeCrystal() {
    const mt = this.mounts, mk = (sx, sy) => { const S = new Soup(); S.add(gOct(), { s: [sx, sy, sx], c: [1, 1, 1], jit: 0, cf: v => .55 + .45 * smooth(-sy, sy, v.y) + (v.x > 0 ? .12 : 0) }); return S.build(); };
    this.cmat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.3, .6, 1) });
    this.crystal = new THREE.Group(); this.crystal.position.set(mt.crystal[0], mt.crystal[1], mt.crystal[2]);
    const c = new THREE.Mesh(mk(mt.crystalS, mt.crystalS * 1.9), this.cmat); c.castShadow = true; this.crystal.add(c); this.core = c;
    this.shards = [];
    for (let i = 0; i < mt.shards; i++) { const s = new THREE.Mesh(mk(.07, .16), this.cmat); this.crystal.add(s); this.shards.push(s); }
    if (mt.rings) { const S = new Soup(); for (let k = 0; k < 7; k++) { if (k === 3) continue; const a = k / 7 * TAU; S.box(.5, .16, .2, Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0, COL.basaltL, { l: L_ROCK, r: [0, -a + HPI, 0] }); } this.ringG = new THREE.Mesh(S.build(), MAT.world); this.ringG.castShadow = true; this.ringG.position.y = -1.25; this.crystal.add(this.ringG); }
    this.group.add(this.crystal);
  }
  upgrade() { if (this.lvl >= 2 || this.state !== 'active') return false; this.lvl++; this.spent += this.def.cost[this.lvl]; for (const m of this.men) m.lvlUp = true; this.begin(); return true; }
  sell() {
    this.alive = false; this.em.alive = false; this.em.on = 0; LT.emitters[this.idx] = null; this.pad.tower = null;
    for (let i = 0; i < 14; i++) { _tm.compose(_tv.set(this.x + rr(-.7, .7), this.y + rr(.3, 2.4), this.z + rr(-.7, .7)), _tq.set(rr(-1, 1), rr(-1, 1), rr(-1, 1), 1).normalize(), _ts.set(1, 1, 1)); addDebris(this.kind === 'archer' || this.kind === 'guard' ? KIT.plank : KIT.rubble, _tm, null, rr(-2, 2), rr(1, 4), rr(-2, 2), rr(3, 9), rr(2, 3.5)); }
    fxDust(this.x, this.y + .4, this.z, 16, 1.6, { speed: 2.6 }); sfx('sell', this.x, this.z, 1);
    for (const m of this.men) m.leave = true;
    this.clearModel(false); R.scene.remove(this.group);
  }
  update(dt) {
    const d = this.def, lvl = this.lvl; this.recent = Math.max(0, this.recent - dt * .25);
    if (this.state !== 'active') {
      this.bt += dt; const bt = this.bt;
      if (this.scaf) this.scaf.scale.y = bt < this.tEnd - .25 ? easeOutBack(bt / .3) : Math.max(.01, 1 - (bt - (this.tEnd - .25)) / .25);
      for (const p of this.pieces) {
        const u = (bt - p.t0) / .24;
        if (u < 0) continue; p.mesh.visible = true;
        if (u < 1) p.mesh.position.y = p.y + (1 - u * u) * 2.2;
        else { p.mesh.position.y = p.y; const sq = clamp((u - 1) / .5, 0, 1); p.mesh.scale.y = 1 - .1 * Math.sin(sq * PI) * (1 - sq);
          if (!p.landed) { p.landed = true; fxDust(this.x + rr(-.5, .5), this.y + p.y + .1, this.z + rr(-.5, .5), 3, .55, { speed: 1.2, a: .4 }); sfx('hammer', this.x, this.z, .7, rnd()); } }
      }
      this.em.on = damp(this.em.on, 0, 4, dt);
      if (bt >= this.tEnd) this.finish();
      return;
    }
    this.appear = Math.min(1, this.appear + dt * 2.2);
    TOWER_STUN = this.stun > 0;
    if (TOWER_STUN) { this.stun -= dt; const k = Math.min(1, this.stun * 2); FX.add.push(this.x, this.y + 1.7, this.z, 4.2, 5.6, 0, 0, .2, .5, 1.2, .3 * k, 2, 0, 0, 0); if (rnd() < dt * 5) { const a = rnd() * TAU, h = rr(.6, 3); fxBolt([this.x + Math.cos(a) * .8, this.y + h, this.z + Math.sin(a) * .8], [this.x + Math.cos(a + 1.2) * .8, this.y + h + rr(-.5, .5), this.z + Math.sin(a + 1.2) * .8], .12, [.5, .85, 1.5], .03); } if (rnd() < dt * 18) fxPart(this.x + rr(-.7, .7), this.y + rr(.4, 3.2), this.z + rr(-.7, .7), 0, rr(-.5, .1), 0, rr(.4, .9), rr(.05, .08), .6, 1.1, 2.0, { drag: .5 }); }
    this.em.on = damp(this.em.on, TOWER_STUN ? .12 : 1, TOWER_STUN ? 8 : 3, dt);
    if (this.flame) this.flame.on = this.em.on; if (this.flame2) this.flame2.on = this.em.on;
    this.cool -= dt * (1 + (this.buff || 0));
    if (this.kind === 'archer') this.updArcher(dt, d, lvl);
    else if (this.kind === 'bombard') this.updBombard(dt, d, lvl);
    else if (this.kind === 'spire') this.updSpire(dt, d, lvl);
    else if (this.kind === 'mage') this.updMage(dt, d, lvl);
    else if (this.kind === 'frost') this.updFrost(dt, d, lvl);
    else if (this.kind === 'crypt') this.updCrypt(dt, d, lvl);
    else if (this.kind === 'shrine') this.updShrine(dt, d, lvl);
    else this.updGuard(dt, d, lvl);
    TOWER_STUN = false;
  }
  updArcher(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, this.range, true, true);
    for (const a of this.archers) {
      const p = this.w(a.l, _ap), e = a.e; e.x = p.x; e.y = p.y - (1 - easeOut(this.appear)) * .5; e.z = p.z; e.scale = .82 * (.3 + .7 * this.appear);
      a.cool -= dt * (1 + (this.buff || 0));
      if (tgt) {
        const T = clamp(Math.hypot(tgt.x - p.x, tgt.z - p.z) / 14, .22, .62), q = aimPoint(tgt, T, _ap2);
        a.yaw = angDamp(a.yaw, Math.atan2(q.x - p.x, q.z - p.z), 12, dt);
        e.pitch = clamp(Math.atan2(q.y - (p.y + 1), Math.hypot(q.x - p.x, q.z - p.z)) * .7 + .2, -.5, .6);
        a.draw = a.cool < .34 ? Math.min(1, a.draw + dt * 3.6) : Math.max(0, a.draw - dt * 6);
        if (a.cool <= 0 && a.draw > .95) {
          a.cool = d.rate[lvl] * rr(.9, 1.12); a.draw = 0;
          shootArrow(p.x + Math.sin(a.yaw) * .3, p.y + 1.0, p.z + Math.cos(a.yaw) * .3, tgt, d.dmg[lvl], this);
          sfx('bow', p.x, p.z, .6, rnd());
        }
      } else { a.draw = Math.max(0, a.draw - dt * 3); a.yaw = angDamp(a.yaw, this.yaw + Math.sin(G.t * .5 + a.l[0] * 3) * .5, 2, dt); e.pitch = damp(e.pitch, 0, 4, dt); if (a.cool < .3) a.cool = .3; }
      e.yaw = a.yaw; e.draw = a.draw;
      rigHuman(KIT.foot, SPEC.foot, e);
    }
  }
  updBombard(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, this.range, false, true, d.minRange);
    this.recoil = Math.max(0, this.recoil - dt * 1.6);
    let aligned = false;
    if (tgt) {
      const dist = Math.hypot(tgt.x - this.x, tgt.z - this.z), T = clamp(dist / 7.2, .75, 1.45), q = aimPoint(tgt, T, _ap2);
      const want = Math.atan2(q.x - this.x, q.z - this.z); this.gunYaw = angDamp(this.gunYaw, want, 5, dt); aligned = Math.abs(angDiff(this.gunYaw, want)) < .12;
      if (aligned && this.cool <= 0) {
        this.cool = d.rate[lvl] * rr(.95, 1.08); this.recoil = 1;
        this.carriage.updateMatrixWorld(true); const mz = _tv.set(0, 0, this.mounts.gunLen - .2).applyMatrix4(this.barrel.matrixWorld);
        const gy = G.B.heightAt(q.x, q.z);
        G.shells.push({ x0: mz.x, y0: mz.y, z0: mz.z, tx: q.x, ty: Math.max(gy, q.y - tgt.hitH) + .05, tz: q.z, t: 0, T, dmg: d.dmg[lvl], splash: d.splash[lvl], tower: this, x: mz.x, y: mz.y, z: mz.z, sm: 0, arc: 1.5 + dist * .2 });
        const dx = Math.sin(this.gunYaw), dz = Math.cos(this.gunYaw);
        lightFlash(mz.x, mz.y + .2, mz.z, 0xffc880, 420, .16, 15);
        fxTimed(5, mz.x + dx * .2, mz.y + .1, mz.z + dz * .2, 1.9, 1.9, 4, 3, 1.6, 1, .1); fxTimed(3, mz.x + dx * .3, mz.y + .12, mz.z + dz * .3, .9, .9, 4, 3.2, 2.2, 1, .2, { grow: .8 });
        for (let i = 0; i < 6; i++) fxSmoke(mz.x + dx * .3, mz.y + .1, mz.z + dz * .3, dx * rr(1, 3.4) + rr(-.5, .5), rr(.3, 1.2), dz * rr(1, 3.4) + rr(-.5, .5), rr(1.2, 2.4), rr(.35, .6), .9, .3, .29, .28, .5, { drag: 2.2, rise: .2 });
        fxSparks(mz.x + dx * .2, mz.y, mz.z + dz * .2, 8, 5, 3, 1.8, .6, { lo: 0, hi: .6 });
        sfx('cannon', this.x, this.z, 1, lvl / 2); FX.shake = Math.min(1, FX.shake + .12);
      }
    } else this.gunYaw = angDamp(this.gunYaw, this.yaw + Math.sin(G.t * .3 + this.idx) * .7, 1.2, dt);
    this.carriage.rotation.y = this.gunYaw - this.yaw;
    const k = this.recoil; this.barrel.position.z = -.3 * k * k; this.barrel.rotation.x = -.42 - .1 * k * k;
    if (this.cool > 0 && this.cool < 1.2 && rnd() < dt * 5) { this.carriage.updateMatrixWorld(true); const mz = _tv.set(0, 0, this.mounts.gunLen - .2).applyMatrix4(this.barrel.matrixWorld); fxSmoke(mz.x, mz.y, mz.z, rr(-.1, .1), rr(.3, .6), rr(-.1, .1), 1.2, .18, .35, .3, .3, .3, .22, { drag: 1 }); }
  }
  updSpire(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, this.range, true, true);
    const was = this.charge;
    this.charge = tgt ? Math.min(1, this.charge + dt * (1 + (this.buff || 0)) / d.rate[lvl]) : Math.max(0, this.charge - dt * .25);
    if (was < .68 && this.charge >= .68 && tgt) sfx('charge', this.x, this.z, .5);
    const c = this.charge, pulse = .85 + .15 * Math.sin(G.t * (6 + c * 20));
    this.spin += dt * (.8 + c * 5); this.core.rotation.y = this.spin; this.core.position.y = Math.sin(G.t * 1.6 + this.idx) * .05;
    this.shards.forEach((s, i) => { const a = this.spin * .7 + i * TAU / this.shards.length; s.position.set(Math.cos(a) * .58, Math.sin(a * 1.3) * .14 - .05, Math.sin(a) * .58); s.rotation.y = -a * 2; });
    if (this.ringG) this.ringG.rotation.y = -this.spin * .25;
    const k = (.9 + 4.5 * c * c) * pulse * this.appear; this.cmat.color.setRGB(.28 * k, .62 * k, 1.15 * k);
    this.em.I = (d.light[lvl] + 70 * c * c) * pulse;
    const cp = this.w(this.mounts.crystal, _ap);
    FX.add.push(cp.x, cp.y, cp.z, 1.5 + c, 1.5 + c, 0, 0, .25, .55, 1.0, (.1 + .22 * c) * pulse, 2, 0, 0, 0);
    if (c > .5 && rnd() < dt * 14 * c) { const a = rnd() * TAU; fxBolt([cp.x, cp.y, cp.z], [cp.x + Math.cos(a) * .7, cp.y + rr(-.5, .5), cp.z + Math.sin(a) * .7], .1, [.45, .7, 1.4], .035); }
    if (c >= 1 && tgt) {
      this.charge = 0; let from = [cp.x, cp.y, cp.z], cur = tgt, dmg = d.dmg[lvl]; const hit = [];
      let jl = d.jumps[lvl]; for (let j = 0; j < jl && cur; j++) { if (cur.frozen > 0 && jl < d.jumps[lvl] + 2) jl++;
        hit.push(cur); const to = [cur.x, cur.y + cur.hitH, cur.z];
        fxBolt(from, to, .26 - j * .015, [.5, .78, 1.6], .1 - j * .008);
        fxSparks(to[0], to[1], to[2], 5, 3.5, 1.2, 2, 4, { grav: 3, size: .06 }); fxTimed(2, to[0], to[1], to[2], 1.6, 1.6, .5, .9, 2, .7, .16);
        const cx = cur.x, cz = cur.z; slowMonster(cur, d.slow[lvl], d.slowT[lvl]); hitMonster(cur, dmg, 'bolt', 0, 0, this);
        dmg *= .86; from = to; let nb = null, nd = 3.0 * 3.0;
        for (const m of G.mons) { if (m.dead || m.hp <= 0 || !m.vis || hit.includes(m)) continue; const dd = dist2(cx, cz, m.x, m.z); if (dd < nd) { nd = dd; nb = m; } }
        cur = nb;
      }
      lightFlash(tgt.x, tgt.y + 1.2, tgt.z, 0x9fd0ff, 520, .22, 16); lightFlash(cp.x, cp.y, cp.z, 0x9fd0ff, 300, .18, 12);
      sfx('zap', this.x, this.z, 1, lvl / 2); FX.shake = Math.min(1, FX.shake + .08);
    }
  }
  updGuard(dt, d, lvl) {
    for (let i = this.men.length - 1; i >= 0; i--) if (this.men[i].gone) this.men.splice(i, 1);
    if (this.men.length < d.n[lvl]) { this.respawn -= dt; if (this.respawn <= 0) { this.respawn = this.men.length === 0 && G.t < 4 ? .5 : d.rate[lvl]; spawnFootman(this); } }
  }
  animOrb(dt, c, col) {
    this.spin += dt * (.8 + c * 4); this.core.rotation.y = this.spin; this.core.position.y = Math.sin(G.t * 1.6 + this.idx) * .08;
    this.shards.forEach((s, i) => { const a = this.spin * .7 + i * TAU / this.shards.length; s.position.set(Math.cos(a) * .55, Math.sin(a * 1.3) * .14 - .05, Math.sin(a) * .55); s.rotation.y = -a * 2; });
    if (this.ringG) this.ringG.rotation.y = -this.spin * .25;
    const k = (.9 + 3.2 * c * c) * this.appear; this.cmat.color.setRGB(col[0] * k, col[1] * k, col[2] * k);
    const cp = this.w(this.mounts.crystal, _ap); FX.add.push(cp.x, cp.y, cp.z, 1.4 + c, 1.4 + c, 0, 0, col[0] * .45, col[1] * .45, col[2] * .45, .12 + .2 * c, 2, 0, 0, 0);
    return cp;
  }
  updMage(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, this.range, true, true);
    if (!tgt) this.cool = Math.max(this.cool, .25);
    const c = 1 - sat(this.cool / d.rate[lvl]), cp = this.animOrb(dt, c, [.78, .42, 1.3]);
    this.em.I = d.light[lvl] * (.8 + .5 * c);
    if (tgt && this.cool <= 0) {
      this.cool = d.rate[lvl] * rr(.95, 1.05);
      G.orbs.push({ x: cp.x, y: cp.y, z: cp.z, vx: rr(-1, 1), vy: 2.6, vz: rr(-1, 1), m: tgt, dmg: d.dmg[lvl], burn: d.burn[lvl], tower: this, life: 3.5, alive: true, lI: 20, lCol: 0xb070ff, lx: cp.x, ly: cp.y, lz: cp.z, lseed: rnd() * 9 });
      lightFlash(cp.x, cp.y, cp.z, 0xc090ff, 220, .14, 10); sfx('zap', this.x, this.z, .45, .95);
      for (let i = 0; i < 6; i++) fxPart(cp.x, cp.y, cp.z, rr(-1.2, 1.2), rr(-.4, 1.2), rr(-1.2, 1.2), rr(.3, .6), .05, 1.8, .9, 3, { drag: 2 });
    }
  }
  updFrost(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, this.range, false, true);
    if (!tgt) this.cool = Math.max(this.cool, .3);
    const c = 1 - sat(this.cool / d.rate[lvl]), cp = this.animOrb(dt, c, [.45, .85, 1.35]);
    this.em.I = d.light[lvl] * (.8 + .5 * c);
    if (tgt && this.cool <= 0) {
      this.cool = d.rate[lvl] * rr(.95, 1.05);
      const q = aimPoint(tgt, .55, _ap2), gy = G.B.heightAt(q.x, q.z), zr = d.zoneR[lvl], cx = cp.x, cy = cp.y, cz = cp.z;
      G.zones.push({ x: q.x, y: gy, z: q.z, r: zr, t: 0, T: d.zoneT[lvl], tick: .2, tower: this, lvl });
      fxBolt([cx, cy, cz], [q.x, gy + .3, q.z], .3, [.6, 1.0, 1.8], .09);
      fxTimed(4, q.x, gy + .08, q.z, zr * 2.6, zr * 2.6, .6, 1.1, 1.9, .8, .45, { ground: true });
      for (let i = 0; i < 12; i++) { const a = rnd() * TAU; fxPart(q.x, gy + .2, q.z, Math.cos(a) * rr(1, 3), rr(1, 3), Math.sin(a) * rr(1, 3), rr(.4, .8), rr(.05, .08), .9, 1.4, 2.3, { grav: 6, drag: .5 }); }
      lightFlash(q.x, gy + .6, q.z, 0xa0e0ff, 320, .25, 10); sfx('zap', q.x, q.z, .55, .05);
    }
  }
  updCrypt(dt, d, lvl) {
    for (let i = this.men.length - 1; i >= 0; i--) if (this.men[i].gone) this.men.splice(i, 1);
    const p = this.w(this.mounts.lightAt, _ap), pulse = .8 + .2 * Math.sin(G.t * 3 + this.idx);
    FX.add.push(p.x, p.y, p.z, 1.6, 1.6, 0, 0, .3, 1.2, .45, .28 * pulse * this.appear, 2, 0, 0, 0);
    if (rnd() < dt * 6) fxPart(p.x + rr(-.15, .15), p.y, p.z + rr(-.15, .15), rr(-.1, .1), rr(.4, .9), rr(-.1, .1), rr(.6, 1.1), rr(.05, .08), .5, 2.0, .7, { drag: .6, rise: .3 });
    for (const g of this.mounts.green || []) { const q = this.w(g, _ap2); FX.add.push(q.x, q.y, q.z, .5, .7, 0, 0, .5, 2.2, .8, .8 * pulse, 0, 0, 0, 0); if (rnd() < dt * 4) fxPart(q.x, q.y, q.z, 0, rr(.5, 1), 0, rr(.3, .6), .05, .6, 2.2, .8, { drag: .5, rise: .5 }); }
    this.em.I = d.light[lvl] * pulse;
  }
  updShrine(dt, d, lvl) {
    const r = d.range[lvl], pulse = .7 + .3 * Math.sin(G.t * 2 + this.idx);
    FX.add.push(this.x, this.y + .1, this.z, r * 2, r * 2, 0, 0, 1.6, 1.1, .4, .16 * pulse * this.appear, 4, 0, .52, 1);
    if (rnd() < dt * 5) { const a = rnd() * TAU, q = rr(.4, 1) * r; fxPart(this.x + Math.cos(a) * q, this.y + .2, this.z + Math.sin(a) * q, 0, rr(.4, 1), 0, rr(.6, 1.2), .05, 2.4, 1.6, .5, { drag: .8, rise: .3 }); }
    if (d.heal[lvl] > 0) for (const f of G.men) if (!f.dead && !f.raised && f.hp < f.maxHp && dist2(f.x, f.z, this.x, this.z) < r * r) f.hp = Math.min(f.maxHp, f.hp + d.heal[lvl] * dt);
    for (const t of G.towers) if (t !== this && t.alive && t.buff > 0 && t.state === 'active' && rnd() < dt * .8 && dist2(t.x, t.z, this.x, this.z) < r * r) fxBolt([this.x, this.y + 1.4, this.z], [t.x, t.y + 1.5, t.z], .18, [1.6, 1.1, .4], .03);
  }
  dispose() { this.alive = false; this.em.alive = false; LT.emitters[this.idx] = null; this.clearModel(false); R.scene.remove(this.group); this.pad.tower = null; }
}
const _ap2 = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };

function shootArrow(x, y, z, m, dmg, tower) {
  const dist = Math.hypot(m.x - x, m.z - z), T = clamp(dist / 14, .22, .62), q = aimPoint(m, T, _ap2);
  G.arrows.push({ x0: x, y0: y, z0: z, tx: q.x, ty: q.y, tz: q.z, t: 0, T, m, dmg, tower, x, y, z, dx: 0, dy: 0, dz: 1, arc: .25 + dist * .07, alive: true, lI: 22, lCol: 0xff9040, lx: x, ly: y, lz: z, lseed: rnd() * 9, ember: 0 });
}
function arrowMatrix(x, y, z, dx, dy, dz) { _tq.setFromUnitVectors(_tz, _tv.set(dx, dy, dz).normalize()); return _tm.compose(_tv.set(x, y, z), _tq, _ts.set(1, 1, 1)); }
function updateProjectiles(dt) {
  const A = G.arrows, B = G.B;
  for (let i = A.length - 1; i >= 0; i--) {
    const a = A[i]; a.t += dt; const u = Math.min(1, a.t / a.T), m = a.m;
    if (m && !m.dead && m.hp > 0) { const q = aimPoint(m, Math.max(0, a.T - a.t), _ap2), k = Math.min(1, dt * 9); a.tx = lerp(a.tx, q.x, k); a.ty = lerp(a.ty, q.y, k); a.tz = lerp(a.tz, q.z, k); }
    const px = a.x, py = a.y, pz = a.z;
    a.x = lerp(a.x0, a.tx, u); a.z = lerp(a.z0, a.tz, u); a.y = lerp(a.y0, a.ty, u) + a.arc * 4 * u * (1 - u);
    const dx = a.x - px, dy = a.y - py, dz = a.z - pz, l = Math.hypot(dx, dy, dz) || 1; a.dx = dx / l; a.dy = dy / l; a.dz = dz / l;
    a.lx = a.x; a.ly = a.y; a.lz = a.z;
    KIT.arrow.put(arrowMatrix(a.x, a.y, a.z, a.dx, a.dy, a.dz), 0, null);
    const hx = a.x + a.dx * .25, hy = a.y + a.dy * .25, hz = a.z + a.dz * .25;
    FX.segs.push(hx, hy, hz, .055, hx - a.dx * .95, hy - a.dy * .95, hz - a.dz * .95, .0, 2.6, 1.05, .25, .85);
    FX.add.push(hx, hy, hz, .3, .3, 0, 0, 3.6, 1.9, .5, 1, 0, 0, 0, 0); FX.add.push(hx, hy, hz, 1.0, 1.0, 0, 0, 1, .45, .12, .22, 2, 0, 0, 0);
    a.ember += dt * 26; while (a.ember > 1) { a.ember -= 1; fxPart(hx, hy, hz, rr(-.4, .4), rr(-.1, .6), rr(-.4, .4), rr(.25, .6), .05, 2.6, 1.1, .2, { drag: 1.5, rise: .6 }); }
    if (u >= 1) {
      a.alive = false; swapRemove(A, i);
      if (m && !m.dead && m.hp > 0 && dist2(a.tx, a.tz, m.x, m.z) < 1.0) {
        fxSparks(a.x, a.y, a.z, 5, 3, 3, 1.5, .4, { size: .055, grav: 6 }); fxTimed(2, a.x, a.y, a.z, .9, .9, 1.6, .8, .25, .8, .12);
        sfx('arrowHit', a.x, a.z, .55, rnd()); hitMonster(m, a.dmg, 'arrow', a.dx, a.dz, a.tower);
      } else if (!m || !m.fly) {
        const gy = B.heightAt(a.x, a.z);
        G.stuck.push({ x: a.x, y: gy + .12, z: a.z, dx: a.dx, dy: Math.min(-.5, a.dy), dz: a.dz, life: 3.2 });
        fxSparks(a.x, gy + .1, a.z, 3, 2, 3, 1.5, .4, { size: .05 });
      }
    }
  }
  updateOrbs(dt); updateZones(dt);
  const St = G.stuck;
  for (let i = St.length - 1; i >= 0; i--) {
    const s = St[i]; s.life -= dt; if (s.life <= 0) { swapRemove(St, i); continue; }
    KIT.arrow.put(arrowMatrix(s.x, s.y - Math.max(0, .5 - s.life) * .5, s.z, s.dx, s.dy, s.dz), 0, null);
    if (s.life > 1.4) { FX.add.push(s.x - s.dx * .25, s.y - s.dy * .25 + .04, s.z - s.dz * .25, .2, .2, 0, 0, 3, 1.4, .3, Math.min(1, (s.life - 1.4)), 0, 0, 0, 0); if (rnd() < dt * 5) fxPart(s.x, s.y + .1, s.z, rr(-.1, .1), rr(.4, .9), rr(-.1, .1), .6, .045, 2.4, 1, .2, { drag: .5, wob: 1 }); }
  }
  const Sh = G.shells;
  for (let i = Sh.length - 1; i >= 0; i--) {
    const s = Sh[i]; s.t += dt; const u = Math.min(1, s.t / s.T);
    s.x = lerp(s.x0, s.tx, u); s.z = lerp(s.z0, s.tz, u); s.y = lerp(s.y0, s.ty, u) + s.arc * 4 * u * (1 - u);
    _tm.compose(_tv.set(s.x, s.y, s.z), _tq.setFromAxisAngle(_tz, s.t * 9), _ts.set(1, 1, 1)); KIT.shell.put(_tm, 0, null);
    FX.add.push(s.x, s.y + .1, s.z, .3, .3, 0, 0, 3.2, 1.5, .3, 1, 0, 0, 0, 0);
    s.sm += dt * 30; while (s.sm > 1) { s.sm -= 1; fxSmoke(s.x, s.y, s.z, rr(-.1, .1), rr(0, .2), rr(-.1, .1), rr(.5, .9), .16, .3, .26, .25, .25, .32, { drag: 1 }); if (rnd() < .5) fxPart(s.x, s.y, s.z, rr(-.5, .5), rr(-.2, .5), rr(-.5, .5), .4, .05, 2.5, 1.1, .2, { grav: 2 }); }
    if (u >= 1) { swapRemove(Sh, i); explodeAt(s.tx, s.ty, s.tz, s.dmg, s.splash, s.tower); }
  }
}
function explodeAt(x, y, z, dmg, splash, tower) {
  const sc = splash / 1.7;
  fxExplosion(x, y, z, sc);
  FX.decals.add(G.B.heightAt, x, z, splash * 1.2, .016, .013, .011, .85, 45);
  sfx('explode', x, z, 1, clamp(sc - .6, 0, 1));
  for (const m of G.mons) {
    if (m.dead || m.hp <= 0 || m.fly || !m.vis) continue;
    const d = Math.hypot(m.x - x, m.z - z); if (d > splash + m.rad) continue;
    const k = lerp(1, .45, sat(d / splash)), l = d || 1;
    hitMonster(m, dmg * k, 'blast', (m.x - x) / l, (m.z - z) / l, tower);
  }
  for (let i = 0; i < 5; i++) { _tm.compose(_tv.set(x + rr(-.3, .3), y + .2, z + rr(-.3, .3)), _tq.set(rr(-1, 1), rr(-1, 1), rr(-1, 1), 1).normalize(), _ts.set(.6, .6, .6)); addDebris(KIT.rubble, _tm, [.5, .45, .4], rr(-3, 3), rr(3, 6), rr(-3, 3), rr(4, 10), rr(1.6, 2.6)); }
}

function updateOrbs(dt) {
  const O = G.orbs, sp = 10;
  for (let i = O.length - 1; i >= 0; i--) {
    const o = O[i], m = o.m; o.life -= dt;
    if (!m || m.dead || m.hp <= 0 || o.life <= 0) { fxTimed(2, o.x, o.y, o.z, .8, .8, 1.2, .6, 2, .6, .15); o.alive = false; swapRemove(O, i); continue; }
    const dx = m.x - o.x, dy = m.y + (m.fly ? 0 : m.hitH) - o.y, dz = m.z - o.z, l = Math.hypot(dx, dy, dz) || 1, k = 1 - Math.exp(-7 * dt);
    o.vx += (dx / l * sp - o.vx) * k; o.vy += (dy / l * sp - o.vy) * k; o.vz += (dz / l * sp - o.vz) * k;
    o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; o.lx = o.x; o.ly = o.y; o.lz = o.z;
    FX.add.push(o.x, o.y, o.z, .34, .34, 0, 0, 2.4, 1.3, 3.6, 1, 0, 0, 0, 0); FX.add.push(o.x, o.y, o.z, 1.2, 1.2, 0, 0, .7, .35, 1.2, .3, 2, 0, 0, 0);
    if (rnd() < .7) fxPart(o.x, o.y, o.z, rr(-.3, .3), rr(-.3, .3), rr(-.3, .3), rr(.25, .5), .05, 1.8, .9, 3, { drag: 2 });
    if (l < .5) {
      o.alive = false; swapRemove(O, i);
      fxSparks(o.x, o.y, o.z, 6, 3, 1.8, 1, 3, { size: .055, grav: 3 }); fxTimed(2, o.x, o.y, o.z, 1.4, 1.4, 1.4, .7, 2.4, .8, .16); sfx('arrowHit', o.x, o.z, .45, .2);
      hitMonster(m, o.dmg, 'arcane', o.vx / sp, o.vz / sp, o.tower);
      if (o.burn > 0 && !m.dead) applyBurn(m, o.burn, 3, o.tower);
    }
  }
}
function updateZones(dt) {
  const Z = G.zones;
  for (let i = Z.length - 1; i >= 0; i--) {
    const z = Z[i]; z.t += dt; if (z.t >= z.T) { swapRemove(Z, i); continue; }
    const a = Math.min(1, z.t * 4, (z.T - z.t) * 1.5), d = z.tower.def, l = z.lvl;
    FX.add.push(z.x, z.y + .07, z.z, z.r * 2.2, z.r * 2.2, 0, 0, .35, .7, 1.3, .6 * a, 4, 0, .52, 1);
    if (rnd() < dt * 12) { const an = rnd() * TAU, q = Math.sqrt(rnd()) * z.r; fxPart(z.x + Math.cos(an) * q, z.y + .1, z.z + Math.sin(an) * q, 0, rr(.3, .8), 0, rr(.5, 1), .05, .9, 1.4, 2.2, { drag: 1 }); }
    z.tick -= dt; const tick = z.tick <= 0; if (tick) z.tick = .5;
    for (const m of G.mons) {
      if (m.dead || m.fly || m.hp <= 0 || !m.vis) continue;
      const r2 = z.r + m.rad; if (dist2(m.x, m.z, z.x, z.z) > r2 * r2) continue;
      slowMonster(m, d.slow[l], .45); m.chill = (m.chill || 0) + dt * 2;
      if (m.chill >= 1.8 && !(m.frozen > 0)) { m.chill = 0; freezeMonster(m, d.freeze[l], z.tower); }
      if (tick) hitMonster(m, d.dmg[l], 'frost', 0, 0, z.tower);
    }
  }
}
function applyBurn(m, dps, T, tower) {
  if (m.dead || m.hp <= 0 || m.def.burnImm) return;
  if (m.frozen > 0) { elementBurst(m, tower); return; }
  m.burnD = Math.max(m.burnT > 0 ? m.burnD : 0, dps); m.burnT = Math.max(m.burnT || 0, T); m.burnBy = tower;
}
function freezeMonster(m, T, tower) {
  if (m.dead || m.hp <= 0 || m.def.freezeImm) return;
  if (m.def.boss) T *= .35;
  if (m.burnT > 0) { elementBurst(m, tower); return; }
  m.frozen = Math.max(m.frozen || 0, T * (m.def.fireEl ? 1.5 : 1));
  fxTimed(2, m.x, m.y + (m.hitH || .4), m.z, 1.4, 1.4, .6, 1.1, 1.9, .8, .2); sfx('zap', m.x, m.z, .35, .05);
}
function elementBurst(m, tower) {
  const y = m.y + (m.hitH || .4); m.frozen = 0; m.burnT = 0;
  fxSparks(m.x, y, m.z, 12, 4.5, 1.6, 1.4, 2.2, { size: .06, grav: 5 }); fxSparks(m.x, y, m.z, 8, 3.5, 2.6, 1.0, .3, { size: .06, grav: 4 });
  fxTimed(5, m.x, y, m.z, 2.4, 2.4, 1.6, 1.2, 1.8, .9, .25); lightFlash(m.x, y + .4, m.z, 0xd0e8ff, 380, .2, 12); sfx('explode', m.x, m.z, .55, .9);
  hitMonster(m, 35 + m.maxHp * .1 * (m.def.boss ? .25 : 1), 'arcane', 0, 0, tower);
}
function applyShrines() {
  for (const t of G.towers) { t.buff = 0; t.rbuff = 0; }
  for (const s of G.towers) {
    if (!s.alive || s.kind !== 'shrine' || s.state !== 'active' || s.stun > 0) continue;
    const d = s.def, l = s.lvl, r2 = d.range[l] * d.range[l];
    for (const t of G.towers) if (t !== s && t.alive && t.kind !== 'shrine' && dist2(t.x, t.z, s.x, s.z) < r2) { t.buff = Math.max(t.buff, d.haste[l]); t.rbuff = Math.max(t.rbuff, d.rangeUp[l]); }
  }
}
function shrineNear(m) {
  for (const t of G.towers) if (t.alive && t.kind === 'shrine' && t.state === 'active') { const r = t.def.range[t.lvl]; if (dist2(t.x, t.z, m.x, m.z) < r * r) return true; }
  return false;
}
function towerStat(k, l) {
  const d = TOWER[k];
  if (k === 'guard') return d.n[l] + ' 名步兵 · ' + d.hp[l] + ' 生命';
  if (k === 'crypt') return '复活率 ' + Math.round(d.chance[l] * 100) + '% · 上限 ' + d.cap[l];
  if (k === 'shrine') return '攻速 +' + Math.round(d.haste[l] * 100) + '% · 射程 +' + Math.round(d.rangeUp[l] * 100) + '%';
  if (k === 'frost') return '射程 ' + d.range[l].toFixed(1) + ' · 减速 ' + Math.round(d.slow[l] * 100) + '%';
  return '射程 ' + d.range[l].toFixed(1) + ' · 伤害 ' + d.dmg[l];
}
