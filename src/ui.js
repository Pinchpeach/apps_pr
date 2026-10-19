// 빌드 시 HTML 조각을 만드는 헬퍼

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fieldWrap = (id, label, control, { hint = '', hidden = false } = {}) =>
  `<div class="field"${id ? ` id="${id}-field"` : ''}${hidden ? ' hidden' : ''}>
  <label${id ? ` for="${id}"` : ''}><span${id ? ` id="${id}-label"` : ''}>${label}</span></label>
  ${control}
  ${hint ? `<small class="hint">${hint}</small>` : ''}<small class="hint-amount" aria-live="polite"></small>
</div>`;

/** 원 단위 금액 입력 */
export const money = (name, label, value, opts = {}) =>
  fieldWrap(
    name,
    label,
    `<div class="input-unit"><input id="${name}" name="${name}" inputmode="numeric" autocomplete="off" data-money value="${value}"><span>원</span></div>`,
    opts,
  );

/** 일반 숫자 입력 */
export const number = (name, label, value, unit = '', { step = 'any', min = 0, ...opts } = {}) =>
  fieldWrap(
    name,
    label,
    `<div class="input-unit"><input id="${name}" name="${name}" type="number" inputmode="decimal" step="${step}" min="${min}" value="${value}">${unit ? `<span>${unit}</span>` : ''}</div>`,
    opts,
  );

export const date = (name, label, value = '', opts = {}) =>
  fieldWrap(name, label, `<input id="${name}" name="${name}" type="date" value="${value}">`, opts);

/** 라디오 버튼 그룹. options: [value, label][] */
export const segmented = (name, label, options, checked) =>
  `<fieldset class="field segmented"><legend>${label}</legend><div>${options
    .map(
      ([v, l]) =>
        `<label><input type="radio" name="${name}" value="${v}"${v === checked ? ' checked' : ''}><span>${l}</span></label>`,
    )
    .join('')}</div></fieldset>`;

export const select = (name, label, options, selected) =>
  fieldWrap(
    name,
    label,
    `<select id="${name}" name="${name}">${options
      .map(([v, l]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${l}</option>`)
      .join('')}</select>`,
  );

export const checkbox = (name, label, checked = false) =>
  `<label class="field check"><input type="checkbox" name="${name}"${checked ? ' checked' : ''}> ${label}</label>`;

/** 계산기 카드: 입력 폼 + 결과 패널 */
export const calculator = (fields, { extra = '' } = {}) => `
<div class="calc">
  <form id="calc" class="card form" novalidate>
    ${fields.join('\n')}
    <button type="submit" class="btn primary">계산하기</button>
  </form>
  <section class="card result" aria-live="polite" aria-label="계산 결과">
    <p class="eyebrow">계산 결과</p>
    <p id="headline" class="headline">-</p>
    <p id="subline" class="subline"></p>
    <dl id="result" class="rows"></dl>
    <button type="button" class="btn ghost" data-share>결과 공유</button>
  </section>
</div>
${extra}`;

export const table = (head, rows, cls = '') =>
  `<div class="table-wrap"><table class="${cls}"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
