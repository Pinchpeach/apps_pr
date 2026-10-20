// 페이지 공용: 숫자 입력 포맷, 결과 렌더링, URL 공유 상태

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;

/** 1억 2,345만원 형태의 읽기 쉬운 한글 금액 */
export function koreanAmount(n) {
  const v = Math.round(Math.abs(n));
  if (v < 10_000) return `${v.toLocaleString('ko-KR')}원`;
  const eok = Math.floor(v / 100_000_000);
  const man = Math.floor((v % 100_000_000) / 10_000);
  const rest = v % 10_000;
  const parts = [];
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (rest) parts.push(rest.toLocaleString('ko-KR'));
  return `${n < 0 ? '-' : ''}${parts.join(' ')}원`;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function readNumber(input) {
  const v = Number(String(input.value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : 0;
}

/** data-money 입력에 천 단위 콤마와 한글 금액 힌트를 붙인다. */
function bindMoneyInput(input) {
  const hint = input.closest('.field')?.querySelector('.hint-amount');
  const update = () => {
    const digits = input.value.replace(/[^\d]/g, '');
    const caret = input.value.length - input.selectionStart;
    input.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
    if (document.activeElement === input) {
      const pos = Math.max(0, input.value.length - caret);
      input.setSelectionRange(pos, pos);
    }
    if (hint) hint.textContent = digits ? koreanAmount(Number(digits)) : '';
  };
  input.addEventListener('input', update);
  update();
}

/** 결과 목록 렌더링. rows: [label, value, className?][] */
export function renderRows(el, rows) {
  el.replaceChildren(
    ...rows.map(([label, value, cls]) => {
      const row = document.createElement('div');
      row.className = `result-row${cls ? ` ${cls}` : ''}`;
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }),
  );
}

/**
 * 폼 바인딩: 쿼리스트링 복원 → 입력 변경 시 계산 + URL 갱신.
 * compute(form)는 폼 값을 읽어 결과를 그린다.
 */
export function bindCalculator(form, compute) {
  const params = new URLSearchParams(location.search);
  for (const el of form.elements) {
    if (!el.name || !params.has(el.name)) continue;
    if (el.type === 'radio') el.checked = el.value === params.get(el.name);
    else if (el.type === 'checkbox') el.checked = params.get(el.name) === '1';
    else el.value = params.get(el.name);
  }
  form.querySelectorAll('[data-money]').forEach(bindMoneyInput);
  const run = () => {
    try {
      compute(form);
    } catch (err) {
      console.error(err);
    }
    const query = new URLSearchParams();
    for (const el of form.elements) {
      if (!el.name || el.type === 'submit' || el.type === 'button') continue;
      if (el.type === 'radio' && !el.checked) continue;
      query.set(el.name, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value.replace(/,/g, ''));
    }
    history.replaceState(null, '', `${location.pathname}?${query}`);
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
    // 모바일에서는 결과가 입력 폼 아래에 있으므로 결과로 이동한다.
    const result = document.querySelector('.result');
    if (result && result.getBoundingClientRect().top > window.innerHeight * 0.6) result.scrollIntoView({ behavior: 'smooth' });
  });
  const share = document.querySelector('[data-share]');
  share?.addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else {
        await navigator.clipboard.writeText(url);
        share.textContent = '링크 복사됨';
        setTimeout(() => (share.textContent = '결과 공유'), 1500);
      }
    } catch {
      /* 사용자가 공유를 취소함 */
    }
  });
  run();
}
