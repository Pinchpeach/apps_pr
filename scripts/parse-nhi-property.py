"""국민건강보험법 시행령 [별표 4] 재산등급별 점수표 → src/calc/nhiPropertyTable.js

HWP 원문을 hwp5html(pyhwp)로 변환한 index.xhtml을 입력으로 받는다.
Usage: python3 -I scripts/parse-nhi-property.py <index.xhtml> <out.js>
"""
import html, json, re, sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
grades = {}
for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', s, re.S):
    cells = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', td))).strip() for td in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
    for i in range(0, len(cells) - 2, 3):
        g, rng, pts = cells[i:i + 3]
        if not re.fullmatch(r'\d+', g):
            continue
        m = re.search(r'([\d,]+) 이하', rng)
        upper = int(m.group(1).replace(',', '')) if m else None  # 마지막 등급은 '초과'만 있다
        grades[int(g)] = (upper, int(pts.replace(',', '')))
assert sorted(grades) == list(range(1, 61)), sorted(grades)
rows = [[grades[g][0], grades[g][1]] for g in range(1, 61)]
assert rows[-1][0] is None and all(rows[i][0] < rows[i + 1][0] for i in range(58))
assert all(rows[i][1] < rows[i + 1][1] for i in range(59))
with open(out, 'w', encoding='utf-8') as f:
    f.write('// 국민건강보험법 시행령 [별표 4] 재산등급별 점수 <개정 2024. 5. 7.>\n')
    f.write('// 생성: scripts/parse-nhi-property.py — 직접 수정하지 마세요.\n')
    f.write('// 각 행: [재산금액 상한(만원, 이하), 점수]. 마지막 등급은 상한 없음(null).\n')
    f.write('export const PROPERTY_GRADES = ' + json.dumps(rows, separators=(',', ':')) + ';\n')
print(len(rows), 'grades; top', rows[-2:], 'first', rows[:2])
