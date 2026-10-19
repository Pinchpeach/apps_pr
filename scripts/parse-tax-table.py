"""Convert the official 근로소득 간이세액표 PDF text (pdftotext -layout) into src/calc/taxTable.js.

Usage: python3 -I scripts/parse-tax-table.py <table.txt> <out.js>
"""
import json, re, sys

src, out = sys.argv[1], sys.argv[2]
num = lambda s: 0 if s == '-' else int(s.replace(',', ''))
rows = []
for line in open(src, encoding='utf-8'):
    parts = line.split()
    if len(parts) != 13 or not all(re.fullmatch(r'[\d,]+|-', p) for p in parts):
        continue
    rows.append([num(p) for p in parts])
row10m = None
for line in open(src, encoding='utf-8'):
    m = re.match(r'\s*10,000천원\s+([\d,\s]+)$', line)
    if m:
        row10m = [num(p) for p in m.group(1).split()]
assert row10m and len(row10m) == 11, row10m
for a, b in zip(rows, rows[1:]):
    assert a[1] == b[0], (a[:2], b[:2])
assert rows[0][0] == 770 and rows[-1][1] == 10000, (rows[0][:2], rows[-1][:2])
with open(out, 'w', encoding='utf-8') as f:
    f.write('// 소득세법 시행령 [별표 2] 근로소득 간이세액표 <개정 2026. 2. 27.>\n')
    f.write('// 생성: scripts/parse-tax-table.py — 직접 수정하지 마세요.\n')
    f.write('// 각 행: [월급여 이상(천원), 미만(천원), 공제대상가족 1명 … 11명 세액(원)]\n')
    f.write('export const TAX_TABLE_ROWS = ' + json.dumps(rows, separators=(',', ':')) + ';\n')
    f.write('export const TAX_AT_10M = ' + json.dumps(row10m) + ';\n')
print(len(rows), 'rows')
