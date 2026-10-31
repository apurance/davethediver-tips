"""Rebuild the shared grid and three distributions from local CleverLab references.

Requires Pillow and the ignored rawdata/*12种*_{14,15,16}_*.jpg files.
Run from the repository root: python -B scripts/trace-glacial.py
"""
import json
from pathlib import Path
from PIL import Image

images = [Image.open(next(Path("rawdata").glob(f"*12种*_{n}_*"))) for n in (14, 15, 16)]
origin_x, origin_y, cell = 63, 390, 14.9
columns, rows = 64, 62


def is_rock(x, y):
    # Majority voting across both cell samples and layouts ignores item icons.
    votes = []
    for image in images:
        samples = [image.getpixel((int(x + dx), int(y + dy)))[:3]
                   for dx in (-4, 0, 4) for dy in (-4, 0, 4)]
        votes.append(sum(r > 225 for r, g, b in samples) >= 5)
    return sum(votes) >= 2


terrain = ["".join("#" if is_rock(origin_x + (x + .5) * cell, origin_y + (y + .5) * cell)
                   else "." for x in range(columns)) for y in range(rows)]
# A fixed, unnamed fish obscures one cell of this ledge in every layout.
terrain[47] = terrain[47][:8] + "#####" + terrain[47][13:]
# Green entrance labels cover the underlying open passages in the references.
for x1, x2, y1, y2 in [(58, 61, 12, 16), (61, 64, 23, 27), (62, 64, 46, 49), (2, 4, 21, 22)]:
    for y in range(y1, y2):
        terrain[y] = terrain[y][:x1] + "." * (x2 - x1) + terrain[y][x2:]

common_fish = [(550, 600, "独角鲸"), (700, 756, "鼠鲨"), (699, 954, "格陵兰鲨"),
               (405, 1057, "异刺鲨"), (548, 1134, "邓氏鱼"),
               (237, 1103, "未标名鱼类", .45)]
layouts = {
    "01": {
        "oxygen": [(883, 620), (451, 755), (268, 784), (944, 784), (148, 979), (898, 1054), (148, 1156)],
        "teleport": [(108, 874), (903, 859), (328, 1156), (753, 1216)],
        "supply": [(779, 640), (273, 713), (115, 801), (921, 786), (959, 966), (895, 1114), (220, 1160), (376, 1235)],
        "weapon": [(298, 593), (861, 625), (471, 757), (823, 832), (119, 965), (909, 965), (300, 1145), (783, 1189)],
        "ammo": [(413, 624), (750, 655), (407, 727), (165, 757), (648, 832), (246, 846), (197, 995), (868, 1055), (163, 1204), (430, 1263)],
        "topaz": [(348, 606), (862, 874)],
        "aquamarine": [(235, 889)],
        "uraninite": [(902, 1260)],
        "ruby": [],
        "fish": [(618, 814, "南极章鱼", .4), (333, 880, "南极章鱼", .4),
                 (328, 654, "金色帝王蟹", .4), (785, 835, "金色帝王蟹", .4), (936, 985, "未标名鳐鱼", .4)],
    },
    "02": {
        "oxygen": [(881, 620), (459, 755), (266, 784), (942, 784), (147, 979), (897, 1053), (147, 1156)],
        "teleport": [(106, 874), (903, 859), (327, 1156), (752, 1216)],
        "supply": [(316, 668), (461, 698), (817, 832), (118, 966), (910, 966), (281, 1130), (894, 1174), (709, 1234)],
        "weapon": [(204, 579), (697, 832), (172, 876), (361, 891), (868, 1054), (218, 1159), (403, 1248), (901, 1263)],
        "ammo": [(309, 594), (364, 713), (163, 758), (918, 787), (274, 861), (892, 1114), (303, 1144), (162, 1204), (779, 1189), (268, 1249)],
        "topaz": [(826, 636), (402, 726)],
        "aquamarine": [(134, 815)],
        "uraninite": [],
        "ruby": [(303, 1246)],
        "fish": [(320, 564, "南极章鱼", .4), (225, 879, "金色帝王蟹", .4), (146, 1000, "未标名鳐鱼", .4)],
    },
    "03": {
        "oxygen": [(881, 620), (445, 755), (266, 784), (941, 784), (136, 979), (897, 1053), (147, 1156)],
        "teleport": [(106, 874), (903, 857), (327, 1156), (752, 1216)],
        "supply": [(259, 638), (821, 638), (460, 757), (142, 817), (190, 995), (868, 1054), (894, 1114), (290, 1249)],
        "weapon": [(480, 459), (431, 638), (318, 669), (748, 653), (825, 832), (210, 907), (829, 1086), (178, 1234)],
        "ammo": [(221, 594), (288, 713), (163, 758), (477, 758), (219, 787), (121, 875), (866, 876), (197, 1086), (132, 1159), (709, 1234), (446, 1278)],
        "topaz": [(686, 830), (155, 979)],
        "aquamarine": [(403, 726)],
        "uraninite": [(790, 1187)],
        "ruby": [(374, 1232)],
        "fish": [(270, 605, "南极章鱼", .4), (869, 808, "南极章鱼", .4), (190, 858, "南极章鱼", .4),
                 (350, 597, "金色帝王蟹", .4), (710, 850, "未标名鳐鱼", .4)],
    },
}

distributions = {}
for variant, groups in layouts.items():
    points = []
    for kind, positions in groups.items():
        for index, point in enumerate(positions + common_fish if kind == "fish" else positions, 1):
            x, y, *extra = point
            marker = {"id": f"C{variant}-{kind}-{index}", "kind": kind,
                      "x": round((x - origin_x) / cell, 2), "y": round((y - origin_y) / cell, 2)}
            if extra:
                marker["label"] = extra[0]
            if len(extra) > 1:
                marker["scale"] = extra[1]
            points.append(marker)
    distributions[f"C{variant}"] = points

for filename, data in [("glacial-terrain.json", {"columns": columns, "rows": rows, "families": {"C": terrain}}),
                       ("glacial-markers.json", distributions)]:
    Path("src/data", filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Traced one shared glacial terrain and three marker distributions.")
