/*
 * CHAIXI BAMEEKIAO — Back Office Navigation
 * V4.21 — Pinned Daily Operations + Unified System Menu
 *
 * Sidebar layout:
 *   1) งานวันนี้ (pinned, direct)
 *   2) เมนูระบบ (collapsible master group)
 *      - ภาพรวม
 *      - Delivery & QR Order
 *      - Finance
 *      - Stock & Cost
 *      - Purchasing
 *
 * Top subnav remains contextual for the selected main category.
 */

const NAV_SECTIONS = [
    {
        key: 'overview',
        title: 'ภาพรวม',
        icon: '🏠',
        items: [
            { key: 'dashboard', label: '📊 Dashboard', path: 'dashboard.html' },
            { key: 'financial-summary', label: '🧭 Financial Summary', path: 'finance/financial-summary.html' },
            { key: 'kpi-targets', label: '🎯 KPI & Targets', path: 'finance/kpi-targets.html' },
            { key: 'daily-closing', label: '🌙 Daily Closing', path: 'finance/daily-closing.html' },
            { key: 'end-of-day', label: '🔐 End of Day', path: 'finance/end-of-day.html' },
            { key: 'sales-history', label: '🧾 ประวัติยอดขาย', path: 'finance/sales-history.html' }
        ]
    },
    {
        key: 'delivery-qr',
        title: 'Delivery & QR Order',
        icon: '🛵',
        items: [
            { key: 'delivery', label: '🛵 Delivery Center', path: 'finance/delivery.html' },
            { key: 'self-orders', label: '📱 QR Self Order', path: 'finance/self-orders.html' },
            { key: 'self-order-history', label: '🧾 QR Order History', path: 'finance/self-order-history.html' }
        ]
    },
    {
        key: 'finance',
        title: 'Finance',
        icon: '💰',
        items: [
            { key: 'expenses', label: '🧾 ค่าใช้จ่าย', path: 'finance/expenses.html' },
            { key: 'pnl', label: '📈 P&L', path: 'finance/pnl.html' },
            { key: 'accounts-payable', label: '💸 Accounts Payable', path: 'finance/accounts-payable.html' },
            { key: 'payment-forecast', label: '📅 Payment Forecast', path: 'finance/payment-forecast.html' },
            { key: 'cash-flow', label: '💵 Cash Flow', path: 'finance/cash-flow.html' },
            { key: 'reconciliation', label: '💳 กระทบยอดการขาย', path: 'finance/reconciliation.html' },
            { key: 'bank-cash-reconciliation', label: '🏦 Bank / Cash Reconciliation', path: 'finance/bank-cash-reconciliation.html' },
            { key: 'cost-quality', label: '🧪 Cost Data Quality', path: 'finance/cost-quality.html' },
            { key: 'cost-fix', label: '🛠 Cost Fix Center', path: 'finance/cost-fix.html' },
            { key: 'bulk-cost-sync', label: '🔄 Bulk Cost Sync', path: 'finance/bulk-cost-sync.html' }
        ]
    },
    {
        key: 'stock-cost',
        title: 'Stock & Cost',
        icon: '📦',
        items: [
            { key: 'ingredients', label: '📦 วัตถุดิบ / Stock', path: 'stock/ingredients.html' },
            { key: 'ingredient-categories', label: '🗂️ หมวดวัตถุดิบ', path: 'stock/categories.html' },
            { key: 'movements', label: '🔄 Stock Movement', path: 'stock/movements.html' },
            { key: 'waste-loss', label: '🗑️ Waste / Loss', path: 'stock/waste-loss.html' },
            { key: 'recipes', label: '🍳 Recipe / BOM', path: 'stock/recipes.html' },
            { key: 'production', label: '🏭 Production / Prep', path: 'stock/production.html' },
            { key: 'count', label: '🧮 Stock Count', path: 'stock/count.html' },
            { key: 'closing', label: '🔒 ปิดรอบ Stock', path: 'stock/closing.html' },
            { key: 'reports', label: '📈 Stock Report', path: 'stock/reports.html' },
            { key: 'daily-sales-usage', label: '📊 ขายเมนู / ใช้วัตถุดิบ', path: 'stock/daily-sales-usage.html' },
            { key: 'cost-control', label: '💰 Cost Control', path: 'stock/cost-control.html' }
        ]
    },
    {
        key: 'purchasing',
        title: 'Purchasing',
        icon: '🛒',
        items: [
            { key: 'suppliers', label: '🚚 Supplier', path: 'purchasing/suppliers.html' },
            { key: 'purchase-orders', label: '🛒 Purchase Orders', path: 'purchasing/purchase-orders.html' },
            { key: 'purchase-documents', label: '🧾 Purchase Documents', path: 'purchasing/purchase-documents.html' },
            { key: 'purchase-returns', label: '↩️ Purchase Returns', path: 'purchasing/purchase-returns.html' }
        ]
    }
]

function projectRoot() {
    const path = window.location.pathname
    for (const marker of ['/finance/', '/stock/', '/purchasing/']) {
        const i = path.indexOf(marker)
        if (i >= 0) return path.slice(0, i + 1)
    }
    return path.slice(0, path.lastIndexOf('/') + 1)
}

function normalize(path) {
    return decodeURIComponent(path)
        .replace(/\/+/g, '/')
        .replace(/\/index\.html$/i, '/')
}

function hrefFor(item, root) {
    return `${root}${item.path}`
}

function isCurrent(item, root) {
    return normalize(window.location.pathname) === normalize(hrefFor(item, root))
}

function isOperationsPage(root) {
    return normalize(window.location.pathname) === normalize(`${root}operations.html`)
}

function currentSection(root) {
    return NAV_SECTIONS.find(section =>
        section.items.some(item => isCurrent(item, root))
    ) || NAV_SECTIONS[0]
}

function ensureCss(root) {
    if (document.querySelector('link[data-chaixi-sidebar-css]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${root}css/backoffice-sidebar.css?v=4.21.0`
    link.dataset.chaixiSidebarCss = 'true'
    document.head.appendChild(link)
}

function createCategoryLink(section, root, sectionNow) {
    const link = document.createElement('a')
    link.className = 'nav-category-link'
    link.href = hrefFor(section.items[0], root)
    link.dataset.sectionKey = section.key

    if (!isOperationsPage(root) && section.key === sectionNow.key) {
        link.classList.add('active')
        link.setAttribute('aria-current', 'true')
    }

    link.innerHTML = `
        <span class="nav-category-icon">${section.icon}</span>
        <span class="nav-category-label">${section.title}</span>
        <span class="nav-category-arrow" aria-hidden="true">›</span>
    `
    return link
}

function renderSidebar(root, sectionNow) {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const operations = document.createElement('a')
    operations.className = 'nav-daily-link'
    operations.href = `${root}operations.html`
    if (isOperationsPage(root)) {
        operations.classList.add('active')
        operations.setAttribute('aria-current', 'page')
    }
    operations.innerHTML = `
        <span class="nav-daily-icon">✓</span>
        <span class="nav-daily-copy">
            <strong>งานวันนี้</strong>
            <small>Daily Operations</small>
        </span>
        <span class="nav-daily-arrow" aria-hidden="true">›</span>
    `

    const group = document.createElement('div')
    group.className = 'nav-system-group'

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'nav-system-toggle'
    toggle.setAttribute('aria-expanded', 'true')
    toggle.innerHTML = `
        <span class="nav-system-toggle-icon">☷</span>
        <span class="nav-system-toggle-copy">
            <strong>เมนูระบบ</strong>
            <small>เมนู Back Office ทั้งหมด</small>
        </span>
        <span class="nav-system-chevron" aria-hidden="true">⌃</span>
    `

    const body = document.createElement('div')
    body.className = 'nav-system-body'
    NAV_SECTIONS.forEach(section => body.appendChild(createCategoryLink(section, root, sectionNow)))

    const storageKey = 'chaixi.bo.systemMenuOpen'
    let open = true
    try {
        const saved = localStorage.getItem(storageKey)
        if (saved === '0') open = false
    } catch {}

    // If user is inside a system page, keep the menu expanded so current category is visible.
    if (!isOperationsPage(root)) open = true

    const applyOpen = () => {
        group.classList.toggle('collapsed', !open)
        body.hidden = !open
        toggle.setAttribute('aria-expanded', String(open))
        const chev = toggle.querySelector('.nav-system-chevron')
        if (chev) chev.textContent = open ? '⌃' : '⌄'
    }

    toggle.addEventListener('click', () => {
        open = !open
        try { localStorage.setItem(storageKey, open ? '1' : '0') } catch {}
        applyOpen()
    })

    group.append(toggle, body)
    nav.replaceChildren(operations, group)
    applyOpen()
}

function renderSubnav(root, sectionNow) {
    const slot = document.querySelector('[data-backoffice-subnav]')
    if (!slot) {
        console.warn('CHAIXI subnav slot not found on this page')
        return
    }

    // งานวันนี้เป็น workflow หลัก ไม่ต้องแสดงแถบ Overview ซ้ำด้านบน
    if (isOperationsPage(root)) {
        slot.replaceChildren()
        slot.style.display = 'none'
        return
    }

    slot.style.display = ''
    slot.className = 'backoffice-subnav'
    slot.setAttribute('aria-label', `${sectionNow.title} navigation`)

    const title = document.createElement('div')
    title.className = 'backoffice-subnav-title'
    title.innerHTML = `<span>${sectionNow.icon}</span><strong>${sectionNow.title}</strong>`

    const scroller = document.createElement('div')
    scroller.className = 'backoffice-subnav-scroll'

    for (const item of sectionNow.items) {
        const link = document.createElement('a')
        link.className = 'backoffice-subnav-link'
        link.href = hrefFor(item, root)
        link.textContent = item.label

        if (isCurrent(item, root)) {
            link.classList.add('active')
            link.setAttribute('aria-current', 'page')
        }

        scroller.appendChild(link)
    }

    slot.replaceChildren(title, scroller)

    requestAnimationFrame(() => {
        slot.querySelector('.backoffice-subnav-link.active')?.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
        })
    })
}

function initBackofficeNavigation() {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const root = projectRoot()
    const sectionNow = currentSection(root)

    ensureCss(root)
    renderSidebar(root, sectionNow)
    renderSubnav(root, sectionNow)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackofficeNavigation, { once: true })
} else {
    initBackofficeNavigation()
}
