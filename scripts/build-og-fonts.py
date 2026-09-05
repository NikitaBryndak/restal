"""One-off: build static Inter TTFs (wght 400/700) subsetted to ASCII + Cyrillic,
for server-side OG image rendering (@vercel/og's typy parser rejects WOFF2 and variable fonts)."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.subset import Options, Subsetter

SRC = "public/fonts/inter-variable.ttf"
OUTS = [(400, "public/fonts/Inter-Regular.ttf"), (700, "public/fonts/Inter-Bold.ttf")]

# ASCII printable + full Cyrillic block (covers Ukrainian Ґґ Єє Іі Її).
UNICODES = list(range(0x20, 0x7F)) + list(range(0x400, 0x500))

for wght, out in OUTS:
    font = TTFont(SRC)
    inst = instantiateVariableFont(font, {"wght": wght, "opsz": 14})
    opts = Options()
    opts.layout_features = []  # no OpenType features needed for satori rendering
    sub = Subsetter(options=opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(inst)
    inst.save(out)
    import os
    print(f"{out}: {os.path.getsize(out)} bytes")
