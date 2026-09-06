import { supabase } from './supabase.js'
import { requireBackoffice, setupShell, money, esc } from './auth.js'

const $ = x => document.getElementById(x)
const dt = x => x ? new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short'}).format(new Date(x)) : '-'

function safeJson(value){
  try { return JSON.stringify(value, null, 2) } catch { return String(value) }
}
function maskEmail(email){
  if(!email) return null
  const [name,domain] = String(email).split('@')
  if(!domain) return email
  return `${(name||'').slice(0,2)}***@${domain}`
}
function showDebug(data){
  const box = $('authDebug')
  if(!box) return
  box.textContent = safeJson(data)
}
function render(d){
  let s=d.summary||{}
  $('sales').textContent=money(s.net_sales)
  $('bills').textContent=`${s.bill_count||0} บิล`
  $('payment').textContent=`${money(s.cash_sales)} / ${money(s.qr_sales)}`
  $('shifts').textContent=s.shift_count||0
  $('shiftState').textContent=`เปิดค้าง ${s.open_shift_count||0} • ยังไม่นับ ${s.uncounted_shift_count||0}`
  $('diff').textContent=money(s.cash_difference)
  $('diff').className=Number(s.cash_difference||0)===0?'ok':'bad'
  $('shiftRows').innerHTML=(d.shifts||[]).map((x,i)=>`<tr><td>#${i+1}<br><small>${dt(x.opened_at)} → ${dt(x.closed_at)}</small></td><td>${esc(x.cashier_name||'-')}</td><td>${esc(x.terminal_code||'-')}<br><small>${x.float_mode==='carry_forward'?'Carry Forward':'Fresh Float'}</small></td><td class="num">${money(x.net_sales)}</td><td class="num">${money(x.cash_sales)}</td><td class="num">${money(x.qr_sales)}</td><td class="num">${x.expected_cash==null?'-':money(x.expected_cash)}</td><td class="num">${x.counted_cash==null?'-':money(x.counted_cash)}</td><td class="num">${x.cash_difference==null?'-':money(x.cash_difference)}</td></tr>`).join('')||'<tr><td colspan="9">ไม่พบกะ</td></tr>'
  $('cashierRows').innerHTML=(d.cashiers||[]).map(x=>{
    let avg=Number(x.bill_count||0)?Number(x.net_sales||0)/Number(x.bill_count):0
    return `<tr><td><b>${esc(x.cashier_name||'-')}</b></td><td class="num">${x.shift_count||0}</td><td class="num">${money(x.net_sales)}</td><td class="num">${money(x.cash_sales)}</td><td class="num">${money(x.qr_sales)}</td><td class="num">${x.bill_count||0}</td><td class="num">${money(avg)}</td><td class="num">${money(x.cash_difference)}</td></tr>`
  }).join('')||'<tr><td colspan="8">ไม่พบข้อมูลพนักงาน</td></tr>'
  let canClose=Number(s.open_shift_count||0)===0&&Number(s.uncounted_shift_count||0)===0&&Number(s.shift_count||0)>0
  $('closeBtn').disabled=!canClose
  $('msg').textContent=canClose?'✅ ทุกกะปิดและนับเงินครบ พร้อม End of Day':'⚠️ ต้องปิดทุกกะและนับเงินให้ครบก่อน End of Day'
}

async function load(){
  let {data,error}=await supabase.rpc('end_of_day_preview_v2',{p_business_date:$('date').value})
  if(error){$('msg').textContent=error.message;return}
  render(data)
}

async function collectAuthDebug(){
  const result = {
    checked_at: new Date().toISOString(),
    page: location.href,
    expected_project_ref: 'fzijrnpoemivbthzghuz'
  }

  try{
    const {data:{session},error} = await supabase.auth.getSession()
    result.session = {
      ok: !error && !!session,
      error: error?.message || null,
      user_id: session?.user?.id || null,
      email_masked: maskEmail(session?.user?.email),
      expires_at: session?.expires_at || null
    }

    if(session?.user?.id){
      const {data:profile,error:profileError}=await supabase
        .from('profiles')
        .select('id,full_name,role,is_active,branch_id')
        .eq('id',session.user.id)
        .maybeSingle()

      result.profile = {
        data: profile || null,
        error: profileError?.message || null,
        id_matches_session: !!profile?.id && profile.id===session.user.id
      }
    }
  }catch(e){
    result.session_exception = e?.message || String(e)
  }

  // Direct RPC attempt. If execute is intentionally not granted, capture that fact.
  try{
    const {data,error}=await supabase.rpc('_bo_ctx')
    result.bo_ctx_direct = {data:data??null,error:error?.message||null}
  }catch(e){
    result.bo_ctx_direct = {data:null,error:e?.message||String(e)}
  }

  try{
    const {data,error}=await supabase.rpc('backoffice_current_business_date_v22')
    result.business_date_rpc = {data:data??null,error:error?.message||null}
  }catch(e){
    result.business_date_rpc = {data:null,error:e?.message||String(e)}
  }

  try{
    const date=$('date')?.value||null
    if(date){
      const {data,error}=await supabase.rpc('end_of_day_preview_v2',{p_business_date:date})
      result.eod_preview = {
        ok: !error,
        error: error?.message||null,
        summary: data?.summary ? {
          shift_count:data.summary.shift_count,
          open_shift_count:data.summary.open_shift_count,
          uncounted_shift_count:data.summary.uncounted_shift_count,
          net_sales:data.summary.net_sales
        } : null
      }
    }
  }catch(e){
    result.eod_preview={ok:false,error:e?.message||String(e)}
  }

  showDebug(result)
  return result
}

async function closeDay(){
  if(!confirm('ยืนยัน End of Day และล็อก Snapshot ของวันนี้?'))return

  // Refresh auth state immediately before consequential RPC.
  await supabase.auth.refreshSession().catch(()=>{})

  const debug = await collectAuthDebug()

  let {data,error}=await supabase.rpc('end_of_day_close_v2',{p_business_date:$('date').value})
  if(error){
    debug.eod_close_error = {
      message:error.message||null,
      code:error.code||null,
      details:error.details||null,
      hint:error.hint||null
    }
    showDebug(debug)
    $('debugPanel').open = true
    alert(error.message)
    return
  }

  alert('End of Day สำเร็จ')
  render(data.snapshot)
}

async function currentBusinessDate(){
  let {data,error}=await supabase.rpc('backoffice_current_business_date_v22')
  if(error)throw error
  let p=Array.isArray(data)?(data[0]||null):(data||null),d=p?.business_date||null
  if(!d)throw new Error('ไม่พบ Business Date ปัจจุบันของสาขา')
  return d
}

$('loadBtn').onclick=load
$('closeBtn').onclick=closeDay
$('debugBtn').onclick=async()=>{
  $('debugPanel').open=true
  $('authDebug').textContent='กำลังตรวจ...'
  await collectAuthDebug()
}
$('copyDebugBtn').onclick=async()=>{
  const text=$('authDebug').textContent||''
  try{
    await navigator.clipboard.writeText(text)
    alert('คัดลอก Debug แล้ว')
  }catch{
    prompt('คัดลอกข้อความนี้',text)
  }
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab,.pane').forEach(x=>x.classList.remove('active'))
  b.classList.add('active')
  $(b.dataset.tab).classList.add('active')
})

let ctx=await requireBackoffice()
if(ctx){
  setupShell(ctx,'end-of-day')
  try{
    $('date').value=await currentBusinessDate()
    await load()
    await collectAuthDebug()
  }catch(error){
    console.error('EOD business date error:',error)
    $('msg').textContent='โหลด Business Date ไม่สำเร็จ: '+(error?.message||'Unknown error')
  }
}
