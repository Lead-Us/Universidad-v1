#!/usr/bin/env python3
"""
Universidad V1 — Instagram Carousel (Refined v2)
"Noche Digital" design philosophy · 1080×1080px
"""

from PIL import Image, ImageDraw, ImageFont
import os

FONTS = "/Users/ernestoah/.claude/skills/canvas-design/canvas-fonts"
OUT   = "/Users/ernestoah/Documents/Antigravity/universidadv1/social/instagram/carousel_que_hace"
W, H  = 1080, 1080
PAD   = 72

# ── Palette ────────────────────────────────────────────────────────────────────
BG        = (10,  10,  10)
SURFACE   = (17,  17,  17)
CARD      = (22,  22,  22)
CARD2     = (30,  30,  30)
ACCENT    = (99, 102, 241)
ACCENT_L  = (129,140, 248)
TEXT      = (248,250, 252)
TEXT_SEC  = (148,163, 184)
TEXT_MUTED= (71,  85, 105)
BORDER    = (37,  37,  37)

def blend(fg, alpha, bg=CARD):
    """Alpha-blend fg over bg without RGBA"""
    a = alpha / 255.0
    return tuple(int(bg[i]*(1-a) + fg[i]*a) for i in range(3))

# ── Fonts ──────────────────────────────────────────────────────────────────────
def F(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

# ── Canvas ─────────────────────────────────────────────────────────────────────
def new_img():
    img  = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def redraw(img):
    return ImageDraw.Draw(img)

def add_glow(img, cx, cy, radius=500, color=ACCENT, intensity=35):
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(radius, 0, -8):
        a = int(intensity * ((1 - r/radius)**2.4))
        if a > 0:
            gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, a))
    base = img.convert("RGBA")
    return Image.alpha_composite(base, glow).convert("RGB")

def add_dot_grid(img, spacing=54, dot_r=1, alpha=22):
    ov = Image.new("RGBA", (W, H), (0,0,0,0))
    od = ImageDraw.Draw(ov)
    for x in range(spacing//2, W, spacing):
        for y in range(spacing//2, H, spacing):
            od.ellipse([x-dot_r, y-dot_r, x+dot_r, y+dot_r], fill=(*BORDER, alpha))
    base = img.convert("RGBA")
    return Image.alpha_composite(base, ov).convert("RGB")

# ── Shared UI elements ─────────────────────────────────────────────────────────
def draw_wordmark(draw, x=PAD, y=58):
    f1 = F("Outfit-Regular.ttf", 20)
    f2 = F("BricolageGrotesque-Bold.ttf", 20)
    draw.text((x, y), "Universidad", font=f1, fill=TEXT_SEC)
    bb = draw.textbbox((x, y), "Universidad", font=f1)
    draw.text((bb[2]+5, y-1), "V1", font=f2, fill=ACCENT)

def draw_slide_num(draw, n, total=6):
    f = F("GeistMono-Regular.ttf", 13)
    t = f"{n:02d}/{total:02d}"
    bb = draw.textbbox((0,0), t, font=f)
    draw.text((W - PAD - (bb[2]-bb[0]), H - 50), t, font=f, fill=TEXT_MUTED)

def draw_eyebrow(draw, x, y, text):
    f = F("GeistMono-Bold.ttf", 13)
    bb = draw.textbbox((0,0), text, font=f)
    pw, ph = (bb[2]-bb[0]) + 32, (bb[3]-bb[1]) + 18
    r = ph // 2
    draw.rounded_rectangle([x, y, x+pw, y+ph], radius=r, outline=ACCENT, width=1)
    draw.text((x+16, y+9 - bb[1]), text, font=f, fill=ACCENT)
    return pw, ph

def bottom_accent(draw, y=H-74, strong_w=190):
    draw.line([(PAD, y), (W-PAD, y)], fill=BORDER, width=1)
    draw.line([(PAD, y), (PAD+strong_w, y)], fill=ACCENT, width=2)

def tcenter(draw, text, font, y, color=TEXT):
    bb = draw.textbbox((0,0), text, font=font)
    x  = (W - (bb[2]-bb[0])) // 2
    draw.text((x, y - bb[1]), text, font=font, fill=color)
    return bb[3] - bb[1]  # height

def draw_feature_card(draw, x, y, w, h, number, text, font, nfont, accent=ACCENT):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=10, fill=CARD)
    draw.rounded_rectangle([x, y, x+4, y+h], radius=2, fill=accent)
    draw.text((x+18, y+h//2-8), number, font=nfont, fill=accent)
    draw.text((x+56, y+h//2-13), text, font=font, fill=TEXT)


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — COVER
# ═══════════════════════════════════════════════════════════════════════════════
def slide_1():
    img, draw = new_img()
    img = add_glow(img, W//2, H - 60,  radius=640, intensity=42)
    img = add_glow(img, W//2, H//2 + 80, radius=320, intensity=18)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw.line([(PAD, 54), (PAD+105, 54)], fill=ACCENT, width=2)
    draw_slide_num(draw, 1)

    # Title — vertically centered with slight upward offset
    tf    = F("BricolageGrotesque-Bold.ttf", 90)
    lines = ["Tu universidad", "entera, en", "una app."]
    lh    = 106
    total = len(lines) * lh
    ty    = (H - total) // 2 - 80

    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text(((W-(bb[2]-bb[0]))//2, ty + i*lh - bb[1]), line, font=tf, fill=TEXT)

    # Subtitle
    sf  = F("Outfit-Regular.ttf", 27)
    sub = "Ramos  \u00b7  Notas  \u00b7  Horario  \u00b7  IA"
    sy  = ty + total + 42
    bb  = draw.textbbox((0,0), sub, font=sf)
    draw.text(((W-(bb[2]-bb[0]))//2, sy - bb[1]), sub, font=sf, fill=TEXT_SEC)

    # Beta pill
    pf  = F("GeistMono-Bold.ttf", 15)
    pt  = "BETA GRATUITA"
    pbb = draw.textbbox((0,0), pt, font=pf)
    pw  = (pbb[2]-pbb[0]) + 44
    ph  = (pbb[3]-pbb[1]) + 20
    px  = (W - pw) // 2
    py  = sy + 64
    draw.rounded_rectangle([px, py, px+pw, py+ph], radius=ph//2, fill=ACCENT)
    draw.text((px+22, py+10 - pbb[1]), pt, font=pf, fill=TEXT)

    # Swipe hint
    hf = F("Outfit-Regular.ttf", 16)
    draw.text((W - PAD - 115, H - 50), "desliza \u2192", font=hf, fill=TEXT_MUTED)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_01_cover.png")
    print("  01 done")


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — RAMOS & NOTAS
# ═══════════════════════════════════════════════════════════════════════════════
def slide_2():
    img, draw = new_img()
    img = add_glow(img, W + 40, 240, radius=480, intensity=26)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw_slide_num(draw, 2)

    # Eyebrow
    _, eph = draw_eyebrow(draw, PAD, 130, "01  RAMOS")
    ty = 130 + eph + 28

    # Title
    tf    = F("BricolageGrotesque-Bold.ttf", 68)
    lines = ["Todos tus ramos,", "organizados", "de verdad."]
    lh    = 82
    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text((PAD, ty + i*lh - bb[1]), line, font=tf, fill=TEXT)

    # Features — spread across remaining space
    ff   = F("Outfit-Regular.ttf", 23)
    nf   = F("GeistMono-Regular.ttf", 13)
    feats = [
        "Temario con unidades y materias",
        "Calificaciones por modulo de evaluacion",
        "Control de asistencia automatico",
        "Archivos organizados por ramo",
    ]

    content_end = H - 100       # end before bottom accent
    feat_start  = ty + len(lines)*lh + 44
    avail       = content_end - feat_start
    card_h      = (avail - 3*16) // 4   # 4 cards, 3 gaps of 16px

    for i, feat in enumerate(feats):
        y = feat_start + i*(card_h + 16)
        draw.rounded_rectangle([PAD, y, W-PAD, y+card_h], radius=12, fill=CARD)
        draw.rounded_rectangle([PAD, y, PAD+4, y+card_h], radius=2, fill=ACCENT)
        draw.text((PAD+20, y+card_h//2-9), f"0{i+1}", font=nf, fill=ACCENT)
        draw.text((PAD+60, y+card_h//2-14), feat, font=ff, fill=TEXT)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_02_ramos.png")
    print("  02 done")


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — HORARIO & CALENDARIO
# ═══════════════════════════════════════════════════════════════════════════════
def slide_3():
    img, draw = new_img()
    img = add_glow(img, -80, H//2, radius=480, intensity=28)
    img = add_glow(img, W - 80, H//2 + 120, radius=380, intensity=22)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw_slide_num(draw, 3)

    # Left column: text content (width ~530px)
    LW = 530  # left column width

    _, eph = draw_eyebrow(draw, PAD, 130, "02  HORARIO")
    ty = 130 + eph + 28

    tf    = F("BricolageGrotesque-Bold.ttf", 64)
    lines = ["\u00bfA que hora", "era el", "control?"]
    lh    = 78
    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text((PAD, ty + i*lh - bb[1]), line, font=tf, fill=TEXT)

    # Tagline
    tlf = F("Outfit-Bold.ttf", 22)
    tly = ty + len(lines)*lh + 8
    draw.text((PAD, tly), "Nunca mas.", font=tlf, fill=ACCENT)

    # Features
    ff   = F("Outfit-Regular.ttf", 21)
    nf   = F("GeistMono-Regular.ttf", 12)
    feats = [
        "Horario semanal visual",
        "Calendario con evaluaciones",
        "Puntos de color por ramo",
    ]
    feat_y = tly + 52
    for i, feat in enumerate(feats):
        y = feat_y + i * 76
        draw.rounded_rectangle([PAD, y, LW, y+56], radius=10, fill=CARD)
        draw.rounded_rectangle([PAD, y, PAD+4, y+56], radius=2, fill=ACCENT_L)
        draw.text((PAD+20, y+10), f"0{i+1}", font=nf, fill=ACCENT_L)
        draw.text((PAD+60, y+14), feat, font=ff, fill=TEXT)

    # ── Right column: full-height weekly schedule mockup ──────────────────────
    sx   = LW + 32           # schedule x start
    sw   = W - PAD - sx      # schedule width
    sy   = 120               # top margin
    sh   = H - 190 - sy      # height available

    # Background card
    draw.rounded_rectangle([sx, sy, sx+sw, sy+sh], radius=14, fill=CARD)

    # Day labels
    days = ["L","M","X","J","V"]
    dcols = len(days)
    col_w = sw // dcols
    hdr_h = 36
    dlf   = F("GeistMono-Regular.ttf", 12)

    for c, d in enumerate(days):
        cx = sx + c*col_w + col_w//2
        bb = draw.textbbox((0,0), d, font=dlf)
        draw.text((cx - (bb[2]-bb[0])//2, sy+8), d, font=dlf, fill=TEXT_MUTED)

    # Divider
    draw.line([(sx+8, sy+hdr_h), (sx+sw-8, sy+hdr_h)], fill=BORDER, width=1)

    # Time slots
    slot_h = (sh - hdr_h - 20) // 9
    times  = ["8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]
    tf_sm  = F("GeistMono-Regular.ttf", 10)
    for r, t in enumerate(times):
        ty_slot = sy + hdr_h + 10 + r*slot_h
        bb = draw.textbbox((0,0), t, font=tf_sm)
        draw.text((sx+4, ty_slot+2), t, font=tf_sm, fill=TEXT_MUTED)

    # Class blocks
    blocks = [
        # (day_col, start_slot, span_slots, label, color)
        (0, 0, 2, "Calculo", ACCENT),
        (1, 1, 2, "Historia", (59,130,246)),
        (2, 2, 2, "Ingles", (168,85,247)),
        (3, 0, 1, "Lab.Fis", (34,197,94)),
        (4, 3, 2, "Fisica", (239,68,68)),
        (0, 4, 1, "Taller", (245,158,11)),
        (2, 5, 2, "Redes", (20,184,166)),
        (3, 3, 2, "Calculo", ACCENT),
    ]

    blk_f = F("Outfit-Bold.ttf", 10)
    for (col, start, span, label, color) in blocks:
        bx = sx + col*col_w + 22
        by = sy + hdr_h + 10 + start*slot_h + 2
        bw = col_w - 10
        bh = span*slot_h - 4
        bg_color = blend(color, 60, BG)
        draw.rounded_rectangle([bx, by, bx+bw, by+bh], radius=6, fill=bg_color)
        draw.rounded_rectangle([bx, by, bx+3, by+bh], radius=2, fill=color)
        if bh > 18:
            bb = draw.textbbox((0,0), label, font=blk_f)
            draw.text((bx+7, by+4), label, font=blk_f, fill=color)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_03_horario.png")
    print("  03 done")


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — TAREAS & EVALUACIONES
# ═══════════════════════════════════════════════════════════════════════════════
def slide_4():
    img, draw = new_img()
    img = add_glow(img, W//2, -40, radius=440, intensity=26)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw_slide_num(draw, 4)

    _, eph = draw_eyebrow(draw, PAD, 130, "03  TAREAS")
    ty = 130 + eph + 28

    tf    = F("BricolageGrotesque-Bold.ttf", 64)
    lines = ["Todas tus fechas,", "sin que se te", "pase ninguna."]
    lh    = 78
    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text((PAD, ty + i*lh - bb[1]), line, font=tf, fill=TEXT)

    # Task type pills
    pf     = F("GeistMono-Regular.ttf", 12)
    types  = [("Tarea", ACCENT), ("Evaluacion", (59,130,246)),
              ("Control", (168,85,247)), ("Quiz", (34,197,94))]
    pill_x = PAD
    pill_y = ty + len(lines)*lh + 28

    for label, col in types:
        bb  = draw.textbbox((0,0), label, font=pf)
        pw  = (bb[2]-bb[0]) + 24
        ph  = (bb[3]-bb[1]) + 14
        bg  = blend(col, 40, SURFACE)
        draw.rounded_rectangle([pill_x, pill_y, pill_x+pw, pill_y+ph],
                                radius=ph//2, fill=bg)
        draw.rounded_rectangle([pill_x, pill_y, pill_x+pw, pill_y+ph],
                                radius=ph//2, outline=col, width=1)
        draw.text((pill_x+12, pill_y+7 - bb[1]), label, font=pf, fill=col)
        pill_x += pw + 10

    # Task cards
    mf    = F("Outfit-Regular.ttf", 21)
    df    = F("GeistMono-Regular.ttf", 13)
    bdf   = F("Outfit-Regular.ttf", 14)
    tasks = [
        ("Evaluacion", "Control Calculo II",           "Hoy",      (59,130,246)),
        ("Tarea",      "Resumen Unidad 3 — Historia",  "Manana",   ACCENT),
        ("Quiz",       "Quiz vocabulario Ingles IV",   "En 3 dias",(34,197,94)),
    ]

    task_y  = pill_y + 52
    avail   = H - 160 - task_y - 3*14  # space for 3 cards + features
    card_h  = 76

    for i, (tipo, nombre, fecha, col) in enumerate(tasks):
        y = task_y + i*(card_h + 14)
        draw.rounded_rectangle([PAD, y, W-PAD, y+card_h], radius=12, fill=CARD)
        draw.rounded_rectangle([PAD, y, PAD+4, y+card_h], radius=2, fill=col)

        bb = draw.textbbox((0,0), tipo, font=df)
        draw.text((PAD+20, y+14 - bb[1]), tipo, font=df, fill=col)
        draw.text((PAD+20, y+36), nombre, font=mf, fill=TEXT)

        # Date badge — use blended fill (no RGBA)
        dbb = draw.textbbox((0,0), fecha, font=bdf)
        dw  = (dbb[2]-dbb[0]) + 20
        dh  = (dbb[3]-dbb[1]) + 12
        dx  = W - PAD - dw - 4
        dy  = y + (card_h - dh)//2
        badge_bg = blend(col, 55, CARD)
        draw.rounded_rectangle([dx, dy, dx+dw, dy+dh], radius=8, fill=badge_bg)
        draw.text((dx+10, dy+6 - dbb[1]), fecha, font=bdf, fill=col)

    # Feature rows below
    feat_y = task_y + 3*(card_h+14) + 22
    ff     = F("Outfit-Regular.ttf", 22)
    feats  = [
        "Filtra por tipo, ramo o estado",
        "Indica cuando vence cada tarea",
        "Marca como hecha con un clic",
    ]
    avail2  = H - 100 - feat_y
    fsp     = avail2 // len(feats)

    for i, feat in enumerate(feats):
        y = feat_y + i*fsp + fsp//2 - 12
        draw.ellipse([PAD, y+8, PAD+7, y+15], fill=ACCENT)
        draw.text((PAD+20, y), feat, font=ff, fill=TEXT_SEC)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_04_tareas.png")
    print("  04 done")


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — APRENDER CON IA
# ═══════════════════════════════════════════════════════════════════════════════
def slide_5():
    img, draw = new_img()
    img = add_glow(img, W//2, H + 80, radius=600, intensity=48)
    img = add_glow(img, W//2, H//2, radius=280, intensity=14)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw_slide_num(draw, 5)

    _, eph = draw_eyebrow(draw, PAD, 130, "04  IA")
    ty = 130 + eph + 28

    tf    = F("BricolageGrotesque-Bold.ttf", 66)
    lines = ["Estudia con un tutor", "que conoce", "tus apuntes."]
    lh    = 80
    for i, line in enumerate(lines):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text((PAD, ty + i*lh - bb[1]), line, font=tf, fill=TEXT)

    # Subtitle
    sbf = F("Outfit-Regular.ttf", 21)
    sby = ty + len(lines)*lh + 12
    draw.text((PAD, sby), "Sube tus archivos. La IA te ensena con tu propio material.", font=sbf, fill=TEXT_SEC)

    # 2×2 method cards — fill remaining space
    methods = [
        ("Storytelling",  "Explicacion narrativa y\nverificacion del aprendizaje",
         "Narrativo · Comprension"),
        ("Recall Activo", "Tecnica Feynman y\nmemoria activa espaciada",
         "Activo · Retencion"),
        ("Matematico",    "Practica estructurada\nen 5 fases progresivas",
         "Ejercitacion · 5 fases"),
        ("Flash",         "Preparacion de emergencia\npara examenes en 30–60 min",
         "Intensivo · Critico"),
    ]

    mf   = F("BricolageGrotesque-Bold.ttf", 24)
    df   = F("Outfit-Regular.ttf", 17)
    tf2  = F("GeistMono-Regular.ttf", 11)
    nf   = F("GeistMono-Regular.ttf", 11)

    gap     = 16
    grid_y  = sby + 48
    grid_h  = H - 100 - grid_y
    card_w  = (W - PAD*2 - gap) // 2
    card_h  = (grid_h - gap) // 2

    for i, (name, desc, tag) in enumerate(methods):
        col  = i % 2
        row  = i // 2
        cx   = PAD + col*(card_w + gap)
        cy   = grid_y + row*(card_h + gap)

        draw.rounded_rectangle([cx, cy, cx+card_w, cy+card_h], radius=14, fill=CARD)
        draw.rounded_rectangle([cx, cy, cx+4, cy+card_h], radius=2, fill=ACCENT)

        draw.text((cx+20, cy+18), f"0{i+1}", font=nf, fill=ACCENT)
        draw.text((cx+20, cy+40), name, font=mf, fill=TEXT)

        # Separator
        sep_y = cy + 76
        draw.line([(cx+20, sep_y), (cx+card_w-20, sep_y)], fill=BORDER, width=1)

        desc_lines = desc.split('\n')
        for j, dl in enumerate(desc_lines):
            draw.text((cx+20, sep_y + 14 + j*24), dl, font=df, fill=TEXT_SEC)

        # Tag badge at bottom of card
        tbb = draw.textbbox((0,0), tag, font=tf2)
        tag_y = cy + card_h - 34
        draw.text((cx+20, tag_y), tag, font=tf2, fill=TEXT_MUTED)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_05_ia.png")
    print("  05 done")


# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — CTA / IMPORTAR
# ═══════════════════════════════════════════════════════════════════════════════
def slide_6():
    img, draw = new_img()
    img = add_glow(img, W//2, H//2 + 80, radius=620, intensity=50)
    img = add_glow(img, W//2, H//2, radius=300, intensity=20)
    img = add_dot_grid(img)
    draw = redraw(img)

    draw_wordmark(draw)
    draw_slide_num(draw, 6)

    # All content vertically centered
    content_h = 36+32+172+32+68+56+20+40+68+20+34+28+50
    cy0 = (H - content_h) // 2 - 20  # slight up

    # Eyebrow — centered
    ef  = F("GeistMono-Bold.ttf", 13)
    et  = "05  IMPORTAR"
    ebb = draw.textbbox((0,0), et, font=ef)
    ew  = (ebb[2]-ebb[0]) + 36
    eh  = (ebb[3]-ebb[1]) + 18
    draw.rounded_rectangle([(W-ew)//2, cy0, (W+ew)//2, cy0+eh], radius=eh//2, outline=ACCENT, width=1)
    draw.text(((W-ew)//2+18, cy0+9 - ebb[1]), et, font=ef, fill=ACCENT)
    y = cy0 + eh + 32

    # Title
    tf    = F("BricolageGrotesque-Bold.ttf", 88)
    tls   = ["Sube tu carpeta", "de semestre."]
    lh    = 102
    for i, line in enumerate(tls):
        bb = draw.textbbox((0,0), line, font=tf)
        draw.text(((W-(bb[2]-bb[0]))//2, y + i*lh - bb[1]), line, font=tf, fill=TEXT)
    y += len(tls)*lh + 32

    # Subtitle
    sf   = F("Outfit-Regular.ttf", 22)
    subs = ["La IA detecta tus ramos, organiza archivos",
            "y arma tu temario automaticamente."]
    for s in subs:
        bb = draw.textbbox((0,0), s, font=sf)
        draw.text(((W-(bb[2]-bb[0]))//2, y - bb[1]), s, font=sf, fill=TEXT_SEC)
        y += 36
    y += 20

    # Divider
    draw.line([(W//2 - 50, y), (W//2 + 50, y)], fill=ACCENT, width=1)
    draw.ellipse([W//2-4, y-4, W//2+4, y+4], fill=ACCENT)
    y += 40

    # CTA
    cf  = F("BricolageGrotesque-Bold.ttf", 56)
    ct  = "Unete a la beta gratuita"
    cbb = draw.textbbox((0,0), ct, font=cf)
    draw.text(((W-(cbb[2]-cbb[0]))//2, y - cbb[1]), ct, font=cf, fill=TEXT)
    y += 66

    # URL
    uf  = F("GeistMono-Regular.ttf", 22)
    ut  = "universidadv1.com"
    ubb = draw.textbbox((0,0), ut, font=uf)
    draw.text(((W-(ubb[2]-ubb[0]))//2, y - ubb[1]), ut, font=uf, fill=ACCENT_L)
    y += 42

    # Chile badge
    bf  = F("Outfit-Regular.ttf", 17)
    bt  = "Hecho para estudiantes chilenos  \u00b7  Chile"
    bbb = draw.textbbox((0,0), bt, font=bf)
    bw  = (bbb[2]-bbb[0]) + 36
    bh  = (bbb[3]-bbb[1]) + 18
    bx  = (W - bw) // 2
    draw.rounded_rectangle([bx, y, bx+bw, y+bh], radius=bh//2, fill=CARD)
    draw.text((bx+18, y+9 - bbb[1]), bt, font=bf, fill=TEXT_MUTED)
    y += bh + 32

    # Wordmark centered at bottom
    wf   = F("Outfit-Regular.ttf", 17)
    wt   = "Universidad"
    wb2f = F("BricolageGrotesque-Bold.ttf", 17)
    wbb  = draw.textbbox((0,0), wt, font=wf)
    w2bb = draw.textbbox((0,0), "V1", font=wb2f)
    tw   = (wbb[2]-wbb[0]) + 5 + (w2bb[2]-w2bb[0])
    wx   = (W - tw) // 2
    wy   = H - 52
    draw.text((wx, wy - wbb[1]), wt, font=wf, fill=TEXT_MUTED)
    draw.text((wx + (wbb[2]-wbb[0]) + 5, wy - w2bb[1]), "V1", font=wb2f, fill=ACCENT)

    bottom_accent(draw)
    img.save(f"{OUT}/slide_06_cta.png")
    print("  06 done")


# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print(f"Generating 6 slides → {OUT}\n")
    slide_1()
    slide_2()
    slide_3()
    slide_4()
    slide_5()
    slide_6()
    print("\nAll 6 slides saved.")
