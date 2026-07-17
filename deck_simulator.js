const TYPE_META = {
  key:    { label: 'キー',   fullLabel: 'キーカード',   colorVar: '--key' },
  search: { label: 'サーチ', fullLabel: 'サーチカード', colorVar: '--search' },
  draw:   { label: 'ドロー', fullLabel: 'ドローカード', colorVar: '--draw' },
};

let order = 0;
const columnRecords = { key: [], search: [], draw: [] };
const priorityRecords = [];

function renderColumn(type){
  const listEl = document.querySelector(`[data-list="${type}"]`);
  const records = columnRecords[type];
  listEl.innerHTML = '';
  if(records.length === 0){
    const p = document.createElement('p');
    p.className = 'empty-hint';
    p.textContent = '未登録';
    listEl.appendChild(p);
    return;
  }
  records.forEach(rec => {
    const row = document.createElement('div');
    row.className = 'card-record';
    row.innerHTML = `<input type="text" placeholder="カード名を入力" value="${escapeAttr(rec.name)}"><button class="del" aria-label="削除">×</button>`;
    row.querySelector('input').addEventListener('input', (e) => {
      rec.name = e.target.value;
      renderPriority();
    });
    row.querySelector('.del').addEventListener('click', () => {
      columnRecords[type] = columnRecords[type].filter(r => r.id !== rec.id);
      const idx = priorityRecords.findIndex(r => r.id === rec.id);
      if(idx !== -1) priorityRecords.splice(idx, 1);
      renderColumn(type);
      renderPriority();
    });
    listEl.appendChild(row);
  });
}

function renderPriority(){
  const listEl = document.querySelector('[data-list="priority"]');
  listEl.innerHTML = '';
  if(priorityRecords.length === 0){
    const p = document.createElement('p');
    p.className = 'empty-hint';
    p.textContent = 'カードを追加すると表示されます';
    listEl.appendChild(p);
    return;
  }
  const sorted = [...priorityRecords].sort((a,b) => a.order - b.order);
  sorted.forEach(rec => {
    const meta = TYPE_META[rec.type];
    const row = document.createElement('div');
    row.className = 'priority-row';
    const displayName = rec.name.trim() === '' ? '（未入力）' : escapeHtml(rec.name);
    row.innerHTML = `
      <input type="number" value="${rec.order}" aria-label="優先順位">
      <span class="type-badge" style="--badge:var(${meta.colorVar})">${meta.label}</span>
      <span class="name">${displayName}</span>
    `;
    row.querySelector('input').addEventListener('change', (e) => {
      const v = parseInt(e.target.value, 10);
      rec.order = Number.isFinite(v) ? v : rec.order;
      renderPriority();
    });
    listEl.appendChild(row);
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s){
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// ---------- add-card modal flow ----------
const typeModal = document.getElementById('typeModal');
const registerModal = document.getElementById('registerModal');
const registerModalTitle = document.getElementById('registerModalTitle');
const registerModalDot = document.getElementById('registerModalDot');
const registerNameInput = document.getElementById('registerNameInput');
const registerCountInput = document.getElementById('registerCountInput');
const registerEffectInput = document.getElementById('registerEffectInput');
const registerMemoInput = document.getElementById('registerMemoInput');
const registerModalError = document.getElementById('registerModalError');
let pendingType = null;

function openTypeModal(){
  typeModal.hidden = false;
  typeModal.querySelector('.type-choice').focus();
}
function closeTypeModal(){ typeModal.hidden = true; }

function openRegisterModal(type){
  pendingType = type;
  const meta = TYPE_META[type];
  registerModalTitle.textContent = `${meta.fullLabel}を登録`;
  registerModalDot.style.setProperty('--dot', `var(${meta.colorVar})`);
  registerNameInput.value = '';
  registerCountInput.value = 1;
  registerEffectInput.value = '';
  registerMemoInput.value = '';
  registerModalError.classList.remove('is-visible');
  closeTypeModal();
  registerModal.hidden = false;
  registerNameInput.focus();
}
function closeRegisterModal(){
  registerModal.hidden = true;
  pendingType = null;
}

document.getElementById('addBtn').addEventListener('click', openTypeModal);
document.getElementById('typeModalCancel').addEventListener('click', closeTypeModal);
typeModal.addEventListener('click', (e) => { if(e.target === typeModal) closeTypeModal(); });

typeModal.querySelectorAll('.type-choice').forEach(btn => {
  btn.addEventListener('click', () => openRegisterModal(btn.dataset.type));
});

document.getElementById('registerModalBack').addEventListener('click', () => {
  closeRegisterModal();
  openTypeModal();
});
registerModal.addEventListener('click', (e) => { if(e.target === registerModal) closeRegisterModal(); });

document.getElementById('registerModalSubmit').addEventListener('click', () => {
  const name = registerNameInput.value.trim();
  if(name === ''){
    registerModalError.classList.add('is-visible');
    registerNameInput.focus();
    return;
  }
  const type = pendingType;
  order += 1;
  const rec = {
    id: `${type}-${order}`,
    type,
    name,
    order,
    count: parseInt(registerCountInput.value, 10) || 1,
    effect: registerEffectInput.value.trim(),
    memo: registerMemoInput.value.trim(),
  };
  columnRecords[type].push(rec);
  priorityRecords.push(rec);
  renderColumn(type);
  renderPriority();
  closeRegisterModal();
});

registerNameInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') document.getElementById('registerModalSubmit').click();
});

document.addEventListener('keydown', (e) => {
  if(e.key !== 'Escape') return;
  if(!registerModal.hidden) closeRegisterModal();
  else if(!typeModal.hidden) closeTypeModal();
});

function combinationLog(n, k){
  if(k < 0 || k > n) return -Infinity;
  let res = 0;
  for(let i = 0; i < k; i++){
    res += Math.log(n - i) - Math.log(i + 1);
  }
  return res;
}

document.getElementById('calcBtn').addEventListener('click', () => {
  const deck = parseInt(document.getElementById('deckCount').value, 10) || 0;
  const hand = parseInt(document.getElementById('trumpCount').value, 10) || 0;
  const resource = parseInt(document.getElementById('resourceCount').value, 10) || 0;
  const keyCount = columnRecords.key.length;
  const out = document.getElementById('calcOutput');
  out.classList.remove('is-empty');

  if(deck <= 0 || hand < 0 || hand > deck){
    out.textContent = 'デッキ枚数・初手枚数を確認してください。';
    return;
  }

  const logNoKeyInHand = combinationLog(deck - keyCount, hand) - combinationLog(deck, hand);
  const pAtLeastOne = (1 - Math.exp(logNoKeyInHand)) * 100;

  const registered = priorityRecords.length;

  out.textContent =
`デッキ枚数: ${deck}枚 / 初手枚数: ${hand}枚 / リソース枚数: ${resource}枚
登録カード数: ${registered}枚（優先順位リスト参照）

初手 ${hand} 枚でキーカードを1枚以上引く確率: ${pAtLeastOne.toFixed(1)}%
（キーカード登録数: ${keyCount}枚、非復元抽出）`;
});

document.getElementById('adviceBtn').addEventListener('click', () => {
  const box = document.getElementById('adviceBox');
  box.classList.remove('is-empty');
  const hand = parseInt(document.getElementById('trumpCount').value, 10) || 0;
  const deck = parseInt(document.getElementById('deckCount').value, 10) || 0;
  const top = [...priorityRecords].sort((a,b) => a.order - b.order)[0];
  const lines = [];
  lines.push(`現在の構成はデッキ${deck}枚に対し初手${hand}枚です。`);
  if(top){
    lines.push(`優先順位1位に設定されている「${top.name}」（${TYPE_META[top.type].label}）を初手で確保できるかが序盤の安定性を左右します。`);
  } else {
    lines.push('優先順位が未設定です。まずキーカードを登録し、優先順位を割り当ててください。');
  }
  lines.push('キーカードの枚数がやや少ない場合は、サーチカードの優先順位を引き上げてアクセス率を補うことを推奨します。');
  box.textContent = lines.join('\n\n');
});

renderColumn('key');
renderColumn('search');
renderColumn('draw');
renderPriority();
