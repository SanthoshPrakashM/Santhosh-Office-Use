/* =============================================
   MODULE BAZAAR – js/blog.js
   Blog listing page behaviour only.
   · Pagination (6 cards/page)
   · Grid / List view toggle
   · Search filter
   · Category filter
   · Newsletter subscribe
   All card HTML lives in index.html.
   JS only shows/hides cards from the DOM.
   ============================================= */

(function () {
  'use strict';

  const CARDS_PER_PAGE = 4;

  /* ── DOM refs ── */
  const postsGrid    = document.getElementById('postsGrid');
  const paginationEl = document.getElementById('pagination');
  const resultsInfo  = document.getElementById('resultsInfo');
  const gridBtn      = document.getElementById('gridBtn');
  const listBtn      = document.getElementById('listBtn');
  const searchInput  = document.getElementById('searchInput');
  const searchBtn    = document.getElementById('searchBtn');
  const categoryItems= document.querySelectorAll('.category-item');
  const emailInput   = document.getElementById('emailInput');
  const subscribeBtn = document.getElementById('subscribeBtn');
  const newsletterMsg= document.getElementById('newsletterMsg');

  /* ── All cards (read once from DOM) ── */
  const ALL_CARDS = Array.from(postsGrid.querySelectorAll('.card'));

  /* ── State ── */
  let currentPage    = 1;
  let activeCategory = 'all';
  let searchQuery    = '';
  let isListView     = localStorage.getItem('mb_view') === 'list';

  /* ════════════════════════════════
     FILTER — returns visible subset
  ════════════════════════════════ */
  function getFiltered() {
    return ALL_CARDS.filter(card => {
      const cat   = card.dataset.category || '';
      const title = (card.dataset.title || '').toLowerCase();
      const desc  = (card.dataset.desc  || '').toLowerCase();
      const q     = searchQuery.toLowerCase();
      const matchCat = activeCategory === 'all' || cat === activeCategory;
      const matchQ   = !q || title.includes(q) || desc.includes(q) || cat.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }

  /* ════════════════════════════════
     RENDER — show/hide cards
  ════════════════════════════════ */
  function render() {
    const filtered   = getFiltered();
    const total      = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));
    currentPage      = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * CARDS_PER_PAGE;
    const end   = start + CARDS_PER_PAGE;

    ALL_CARDS.forEach(card => {
      const idx = filtered.indexOf(card);
      if (idx >= start && idx < end) {
        card.style.display = '';
        card.style.animationDelay = ((idx - start) * 0.07) + 's';
        card.classList.remove('card--in');
        void card.offsetWidth;
        card.classList.add('card--in');
      } else {
        card.style.display = 'none';
      }
    });

    /* Results info */
    if (searchQuery || activeCategory !== 'all') {
      resultsInfo.textContent = total === 0
        ? 'No results found'
        : `Showing ${start + 1}–${Math.min(end, total)} of ${total} post${total !== 1 ? 's' : ''}`;
    } else {
      resultsInfo.textContent = '';
    }

    /* No-results message */
    let noRes = postsGrid.querySelector('.no-results');
    if (total === 0) {
      if (!noRes) {
        noRes = document.createElement('div');
        noRes.className = 'no-results';
        noRes.innerHTML = '<span class="material-symbols-outlined">search_off</span>No posts match your search. Try different keywords or clear the filter.';
        postsGrid.appendChild(noRes);
      }
    } else {
      if (noRes) noRes.remove();
    }

    buildPagination(totalPages);
  }

  /* ════════════════════════════════
     PAGINATION
  ════════════════════════════════ */
  function buildPagination(totalPages) {
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    const range = pageRange(currentPage, totalPages);
    const frag  = document.createDocumentFragment();

    const prev = makeBtn('', 'page-btn page-btn--nav', currentPage === 1);
    prev.setAttribute('aria-label', 'Previous');
    prev.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
    prev.addEventListener('click', () => goTo(currentPage - 1));
    frag.appendChild(prev);

    range.forEach(p => {
      if (p === '…') {
        frag.appendChild(makeBtn('…', 'page-btn page-btn--ellipsis', true));
      } else {
        const btn = makeBtn(p, 'page-btn' + (p === currentPage ? ' page-btn--active' : ''), false);
        btn.setAttribute('aria-label', 'Page ' + p);
        if (p === currentPage) btn.setAttribute('aria-current', 'page');
        btn.addEventListener('click', () => goTo(p));
        frag.appendChild(btn);
      }
    });

    const next = makeBtn('', 'page-btn page-btn--nav', currentPage === totalPages);
    next.setAttribute('aria-label', 'Next');
    next.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
    next.addEventListener('click', () => goTo(currentPage + 1));
    frag.appendChild(next);

    paginationEl.innerHTML = '';
    paginationEl.appendChild(frag);
  }

  function makeBtn(text, cls, disabled) {
    const b = document.createElement('button');
    b.className   = cls;
    b.textContent = text;
    b.disabled    = disabled;
    return b;
  }

  function pageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, cur]);
    if (cur > 1) set.add(cur - 1);
    if (cur < total) set.add(cur + 1);
    const sorted = [...set].sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    sorted.forEach(p => { if (p - prev > 1) result.push('…'); result.push(p); prev = p; });
    return result;
  }

  function goTo(n) {
    const totalPages = Math.ceil(getFiltered().length / CARDS_PER_PAGE) || 1;
    currentPage = Math.max(1, Math.min(n, totalPages));
    render();
    document.getElementById('feedSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ════════════════════════════════
     VIEW TOGGLE
  ════════════════════════════════ */
  function applyView() {
    postsGrid.classList.toggle('list-view', isListView);
    gridBtn.classList.toggle('active', !isListView);
    listBtn.classList.toggle('active',  isListView);
    localStorage.setItem('mb_view', isListView ? 'list' : 'grid');
  }
  gridBtn.addEventListener('click', () => { isListView = false; applyView(); });
  listBtn.addEventListener('click', () => { isListView = true;  applyView(); });

  /* ════════════════════════════════
     SEARCH
  ════════════════════════════════ */
  function doSearch() {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    render();
  }
  searchInput.addEventListener('input', doSearch);
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  /* ════════════════════════════════
     CATEGORY FILTER
  ════════════════════════════════ */
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      categoryItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      activeCategory    = item.dataset.category;
      searchQuery       = '';
      searchInput.value = '';
      currentPage       = 1;
      render();
    });
  });

  /* ════════════════════════════════
     NEWSLETTER
  ════════════════════════════════ */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function showMsg(text, ok) {
    newsletterMsg.textContent = text;
    newsletterMsg.style.color = ok ? '#c8e6c9' : '#ffccbc';
    clearTimeout(newsletterMsg._t);
    newsletterMsg._t = setTimeout(() => { newsletterMsg.textContent = ''; }, 4000);
  }
  subscribeBtn.addEventListener('click', () => {
    const v = emailInput.value.trim();
    if (!v)         return showMsg('Please enter your email address.', false);
    if (!isEmail(v)) return showMsg('Please enter a valid email.', false);
    showMsg('✓ Subscribed! Welcome aboard.', true);
    emailInput.value = '';
  });
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') subscribeBtn.click(); });

  /* ── INIT ── */
  applyView();
  render();

})();
