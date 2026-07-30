import random, math

W, H = 4096, 2048
img = bytearray(W * H * 3)
random.seed(20260724)

STAR_COUNT = 6500

def add(x, y, r, g, b):
    if 0 <= x < W and 0 <= y < H:
        i = (y * W + x) * 3
        img[i] = min(255, img[i] + r)
        img[i + 1] = min(255, img[i + 1] + g)
        img[i + 2] = min(255, img[i + 2] + b)

for _ in range(STAR_COUNT):
    u = random.random()
    v = math.acos(1 - 2 * random.random()) / math.pi  # uniform on sphere, not on rectangle
    x = int(u * W)
    y = int(v * H)

    m = random.random() ** 3.2          # power law: most stars faint, few bright
    lum = 18 + int(m * 237)

    tint = random.uniform(-1, 1)        # cool (blue-white) to warm (amber) stars
    r = lum
    g = lum
    b = lum
    if tint > 0.4:
        b = int(lum * 0.82)
        g = int(lum * 0.93)
    elif tint < -0.4:
        r = int(lum * 0.85)

    add(x, y, r, g, b)
    if lum > 150:                        # bright stars get a soft cross bloom
        half_r, half_g, half_b = r // 3, g // 3, b // 3
        add(x + 1, y, half_r, half_g, half_b)
        add(x - 1, y, half_r, half_g, half_b)
        add(x, y + 1, half_r, half_g, half_b)
        add(x, y - 1, half_r, half_g, half_b)
    if lum > 230:                        # the handful of beacons get a wider halo
        for dx, dy in [(2, 0), (-2, 0), (0, 2), (0, -2), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
            add(x + dx, y + dy, r // 6, g // 6, b // 6)

with open(r"C:\Users\Admin\AppData\Local\Temp\claude\D--Downloads-Everything\583add8f-8870-47ef-8ac4-ff71b188679e\scratchpad\starmap_gen.ppm", "wb") as f:
    f.write(b"P6\n%d %d\n255\n" % (W, H))
    f.write(bytes(img))

print("generated", STAR_COUNT, "stars")
