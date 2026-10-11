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
    const displayName = rec.name.trim() === '' ? '（未入力）' : escapeHtml(rec.name);
    row.innerHTML = `
      <span class="name">${displayName}</span>
      <input type="number" class="count" value="${rec.count}" min="1" aria-label="枚数">
      <button class="del" aria-label="削除">×</button>
    `;
    row.querySelector('.count').addEventListener('change', (e) => {
      const v = parseInt(e.target.value, 10);
      rec.count = Number.isFinite(v) && v >= 1 ? v : rec.count;
      e.target.value = rec.count;
    });
    row.querySelector('.del').addEventListener('click', (e) => {
      e.stopPropagation();
      columnRecords[type] = columnRecords[type].filter(r => r.id !== rec.id);
      const idx = priorityRecords.findIndex(r => r.id === rec.id);
      if(idx !== -1) priorityRecords.splice(idx, 1);
      renderColumn(type);
      renderPriority();
    });
    row.addEventListener('click', (e) => {
      if(e.target.closest('input') || e.target.closest('button')) return;
      openRegisterModal(type, rec);
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

// ---------- add-card modal flow ----------
const typeModal = document.getElementById('typeModal');
const registerModal = document.getElementById('registerModal');
const registerModalTitle = document.getElementById('registerModalTitle');
const registerModalDot = document.getElementById('registerModalDot');
const registerNameInput = document.getElementById('registerNameInput');
const registerCountInput = document.getElementById('registerCountInput');
const registerSearchRangeInput = document.getElementById('registerSearchRangeInput');
const registerSearchActionInput = document.getElementById('registerSearchActionInput');
const registerDrawCountInput = document.getElementById('registerDrawCountInput');
const registerResourcePointInput = document.getElementById('registerResourcePointInput');
const registerModalError = document.getElementById('registerModalError');
const registerModalFields = registerModal.querySelectorAll('.modal-field');
let pendingType = null;
let editingId = null;

function openTypeModal(){
  typeModal.hidden = false;
  typeModal.querySelector('.type-choice').focus();
}
function closeTypeModal(){ typeModal.hidden = true; }

function openRegisterModal(type, rec = null){
  pendingType = type;
  editingId = rec ? rec.id : null;
  const meta = TYPE_META[type];
  registerModalTitle.textContent = rec ? `${meta.fullLabel}を編集` : `${meta.fullLabel}を登録`;
  registerModalDot.style.setProperty('--dot', `var(${meta.colorVar})`);
  registerNameInput.value = rec ? rec.name : '';
  registerCountInput.value = rec ? rec.count : 1;
  registerSearchRangeInput.value = rec ? rec.searchRange : 1;
  registerSearchActionInput.value = rec ? rec.searchAction : 'bottom';
  registerDrawCountInput.value = rec ? rec.drawCount : 1;
  registerResourcePointInput.value = rec ? rec.resourcePoint : 0;
  registerModalFields.forEach(field => {
    field.hidden = !field.dataset.for.split(' ').includes(type);
  });
  registerModalError.classList.remove('is-visible');
  closeTypeModal();
  registerModal.hidden = false;
  registerNameInput.focus();
}
function closeRegisterModal(){
  registerModal.hidden = true;
  pendingType = null;
  editingId = null;
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
  const count = parseInt(registerCountInput.value, 10) || 1;
  const typeFields = {};
  if(type === 'search'){
    typeFields.searchRange = parseInt(registerSearchRangeInput.value, 10) || 1;
    typeFields.searchAction = registerSearchActionInput.value;
    typeFields.resourcePoint = parseInt(registerResourcePointInput.value, 10) || 0;
  } else if(type === 'draw'){
    typeFields.drawCount = parseInt(registerDrawCountInput.value, 10) || 1;
    typeFields.resourcePoint = parseInt(registerResourcePointInput.value, 10) || 0;
  }

  if(editingId){
    const rec = columnRecords[type].find(r => r.id === editingId);
    rec.name = name;
    rec.count = count;
    Object.assign(rec, typeFields);
  } else {
    order += 1;
    const rec = { id: `${type}-${order}`, type, name, order, count, ...typeFields };
    columnRecords[type].push(rec);
    priorityRecords.push(rec);
  }
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

// ---------- server-side calculation / advice ----------
function buildDeckState(){
  return {
    deckCount: parseInt(document.getElementById('deckCount').value, 10) || 0,
    handCount: parseInt(document.getElementById('trumpCount').value, 10) || 0,
    resourceCount: parseInt(document.getElementById('resourceCount').value, 10) || 0,
    records: columnRecords,
    priority: priorityRecords,
  };
}

function formatCalcResult(result){
  const lines = [];
  lines.push(`成功確率: ${result.probability.toFixed(1)}%`);
  lines.push(`試行回数: ${result.simulations}回（成功 ${result.success}回 / 失敗 ${result.failure}回）`);
  lines.push('');
  lines.push(`デッキ枚数: ${result.deckCount}枚`);
  lines.push(`初手枚数: ${result.handCount}枚`);
  lines.push(`リソース枚数: ${result.resourceCount}枚`);
  lines.push('');
  lines.push('登録カード数:');
  Object.keys(TYPE_META).forEach(type => {
    const list = result.records?.[type] ?? [];
    lines.push(`  ${TYPE_META[type].fullLabel}: ${list.length}種類`);
  });

  const priority = [...(result.priority ?? [])].sort((a, b) => a.order - b.order);
  lines.push('');
  if(priority.length === 0){
    lines.push('優先順位: 未設定');
  } else {
    lines.push('優先順位:');
    priority.forEach(rec => {
      const name = rec.name?.trim() ? rec.name : '（未入力）';
      lines.push(`  ${rec.order}. ${name}（${TYPE_META[rec.type].fullLabel}） ${rec.count}枚`);
    });
  }
  return lines.join('\n');
}

document.getElementById('calcBtn').addEventListener('click', async () => {
  const out = document.getElementById('calcOutput');
  out.classList.remove('is-empty');
  out.textContent = '計算中...';
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDeckState()),
    });
    const data = await res.json();
    if(!res.ok){
      out.textContent = data.error ?? '計算中にエラーが発生しました。';
      return;
    }
    out.textContent = formatCalcResult(data.result);
  } catch (err) {
    out.textContent = '計算中にエラーが発生しました。';
  }
});

document.getElementById('adviceBtn').addEventListener('click', async () => {
  const box = document.getElementById('adviceBox');
  box.classList.remove('is-empty');
  box.textContent = '生成中...';
  try {
    const res = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDeckState()),
    });
    const data = await res.json();
    box.textContent = data.result?.result ?? '（AIアドバイス生成処理は未実装です）';
  } catch (err) {
    box.textContent = 'アドバイス取得中にエラーが発生しました。';
  }
});

renderColumn('key');
renderColumn('search');
renderColumn('draw');
renderPriority();
