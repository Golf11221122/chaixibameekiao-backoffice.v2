import { supabase } from './supabase.js'
import { requireBackoffice, setupShell, money, number, esc } from './auth.js'

const $ = id => document.getElementById(id)
let menuRows = []
let ingredientRows = []

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function setRange(mode) {
  const end = new Date()
  const start = new Date(end)
  if (mode === 1) {
    start.setDate(start.getDate()-1)
    end.setDate(end.getDate()-1)
  } else if (mode > 1) {
    start.setDate(start.getDate()-(mode-1))
  }
  $('from').value = isoDate(start)
  $('to').value = isoDate(end)
}

function bounds() {
  const from = $('from').value
  const to = $('to').value
  if (!from || !to) throw new Error('กรุณาเลือกวันที่')
  if (to < from) throw new Error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น')
  return {
    from: new Date(`${from}T00:00:00`).toISOString(),
    to: new Date(`${to}T23:59:59.999`).toISOString()
  }
}

function dateText(v) {
  if (!v) return '-'
  return new Date(`${v}T00:00:00`).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' })
}

function message(t='', isError=false) {
  const el = $('message')
  el.textContent = t
  el.classList.toggle('error', Boolean(isError))
}

function sum(rows, key) {
  return rows.reduce((s,x)=>s+Number(x[key]||0),0)
}

function unique(rows, key) {
  return new Set(rows.map(x=>x[key]).filter(Boolean)).size
}

function renderKpis() {
  $('totalMenuQty').textContent = number(sum(menuRows,'quantity'))
  $('uniqueMenus').textContent = number(unique(menuRows,'product_id') || unique(menuRows,'product_name'),0)
  $('menuRevenue').textContent = money(sum(menuRows,'sales_amount'))
  $('uniqueIngredients').textContent = number(unique(ingredientRows,'ingredient_id'),0)
  $('ingredientCost').textContent = money(sum(ingredientRows,'usage_cost'))
}

function groupDays(rows, qtyKey, costKey) {
  const map = new Map()
  for (const row of rows) {
    const key = row.business_date
    const old = map.get(key) || { date:key, qty:0, cost:0, lines:0 }
    old.qty += Number(row[qtyKey]||0)
    old.cost += Number(row[costKey]||0)
    old.lines += 1
    map.set(key, old)
  }
  return [...map.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)))
}

function renderDayStrips() {
  const menuDays = groupDays(menuRows,'quantity','sales_amount')
  $('menuDailySummary').innerHTML = menuDays.length ? menuDays.map(x=>`
    <article class="day-chip"><span>${esc(dateText(x.date))}</span><strong>${number(x.qty)} จาน</strong><small>${money(x.cost)} • ${number(x.lines,0)} เมนู</small></article>
  `).join('') : '<div class="empty">ไม่มีข้อมูลการขายในช่วงนี้</div>'

  const ingredientDays = groupDays(ingredientRows,'quantity_used','usage_cost')
  $('ingredientDailySummary').innerHTML = ingredientDays.length ? ingredientDays.map(x=>`
    <article class="day-chip"><span>${esc(dateText(x.date))}</span><strong>${number(x.qty)} หน่วยใช้</strong><small>${money(x.cost)} • ${number(x.lines,0)} วัตถุดิบ</small></article>
  `).join('') : '<div class="empty">ไม่มีข้อมูลการใช้วัตถุดิบในช่วงนี้</div>'
}

function aggregateMenus(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = row.product_id || row.product_name
    const old = map.get(key) || {
      product_id: row.product_id || null,
      product_name: row.product_name || '-',
      quantity: 0,
      bill_count: 0,
      sales_amount: 0
    }
    old.quantity += Number(row.quantity || 0)
    old.bill_count += Number(row.bill_count || 0)
    old.sales_amount += Number(row.sales_amount || 0)
    map.set(key, old)
  }
  return [...map.values()].sort((a,b) =>
    Number(b.quantity||0) - Number(a.quantity||0) ||
    String(a.product_name||'').localeCompare(String(b.product_name||''), 'th')
  )
}

function aggregateIngredients(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = row.ingredient_id || `${row.ingredient_name}|${row.unit}`
    const old = map.get(key) || {
      ingredient_id: row.ingredient_id || null,
      ingredient_name: row.ingredient_name || '-',
      category_name: row.category_name || '-',
      ingredient_type: row.ingredient_type || null,
      unit: row.unit || '',
      quantity_used: 0,
      usage_cost: 0
    }
    old.quantity_used += Number(row.quantity_used || 0)
    old.usage_cost += Number(row.usage_cost || 0)
    map.set(key, old)
  }
  return [...map.values()].sort((a,b) =>
    Number(b.quantity_used||0) - Number(a.quantity_used||0) ||
    String(a.ingredient_name||'').localeCompare(String(b.ingredient_name||''), 'th')
  )
}

function renderMenuTable() {
  const q = $('menuSearch').value.trim().toLowerCase()
  const list = aggregateMenus(menuRows).filter(x=>!q || `${x.product_name}`.toLowerCase().includes(q))
  $('menuTable').innerHTML = list.length ? `
    <div class="table-wrap daily-table-wrap"><table class="raw-table daily-report-table simple-report-table menu-total-table">
      <thead><tr><th class="rank-col">#</th><th>เมนู</th><th class="num">จำนวนขายรวม</th><th class="num">จำนวนบิล</th><th class="num">ยอดขายรวม</th></tr></thead>
      <tbody>${list.map((x,i)=>`<tr>
        <td class="rank-col">${i+1}</td>
        <td><strong>${esc(x.product_name)}</strong></td>
        <td class="num"><strong>${number(x.quantity)}</strong></td>
        <td class="num">${number(x.bill_count,0)}</td>
        <td class="num"><strong>${money(x.sales_amount)}</strong></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty">ไม่พบเมนู</div>'
}

function typeText(v) {
  return ({raw:'Raw',prep:'Prep',beverage:'เครื่องดื่ม',packaging:'Packaging',consumable:'Consumable'})[v] || v || '-'
}

function renderIngredientTable() {
  const q = $('ingredientSearch').value.trim().toLowerCase()
  const list = aggregateIngredients(ingredientRows).filter(x=>!q || `${x.ingredient_name} ${x.category_name} ${x.unit}`.toLowerCase().includes(q))
  $('ingredientTable').innerHTML = list.length ? `
    <div class="table-wrap daily-table-wrap"><table class="raw-table daily-report-table simple-report-table ingredient-total-table">
      <thead><tr><th class="rank-col">#</th><th>วัตถุดิบ</th><th>หมวด</th><th class="num">ใช้รวม</th><th class="num">มูลค่าใช้รวม</th></tr></thead>
      <tbody>${list.map((x,i)=>`<tr>
        <td class="rank-col">${i+1}</td>
        <td><strong>${esc(x.ingredient_name)}</strong><small class="unit-inline"> ${esc(x.unit)}</small></td>
        <td>${esc(x.category_name)}</td>
        <td class="num"><strong>${number(x.quantity_used)} ${esc(x.unit)}</strong></td>
        <td class="num">${money(x.usage_cost)}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty">ไม่พบวัตถุดิบ</div>'
}

function render() {
  renderKpis()
  renderDayStrips()
  renderMenuTable()
  renderIngredientTable()
}

async function load() {
  try {
    message('กำลังโหลด...')
    const b = bounds()
    const [menuResult, ingredientResult] = await Promise.all([
      supabase.rpc('backoffice_daily_menu_sales_v1', { p_from:b.from, p_to:b.to }),
      supabase.rpc('backoffice_daily_ingredient_sale_usage_v1', { p_from:b.from, p_to:b.to })
    ])
    if (menuResult.error) throw menuResult.error
    if (ingredientResult.error) throw ingredientResult.error
    menuRows = menuResult.data || []
    ingredientRows = ingredientResult.data || []
    render()
    message(`แสดงข้อมูล ${dateText($('from').value)} – ${dateText($('to').value)}`)
  } catch (error) {
    console.error('Daily sales usage report error:', error)
    message(error.message || 'โหลดรายงานไม่สำเร็จ', true)
  }
}

for (const btn of document.querySelectorAll('.quick-date')) {
  btn.addEventListener('click', async () => {
    setRange(Number(btn.dataset.days || 0))
    await load()
  })
}

for (const tab of document.querySelectorAll('.report-tab')) {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.report-tab').forEach(x=>x.classList.toggle('active',x===tab))
    document.querySelectorAll('.report-pane').forEach(x=>x.classList.toggle('active',x.id===tab.dataset.pane))
  })
}

$('applyBtn').addEventListener('click', load)
$('refreshBtn').addEventListener('click', load)
$('menuSearch').addEventListener('input', renderMenuTable)
$('ingredientSearch').addEventListener('input', renderIngredientTable)

const ctx = await requireBackoffice()
if (ctx) {
  setupShell(ctx,'daily-sales-usage')
  setRange(0)
  await load()
}
