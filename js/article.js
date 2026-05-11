/* =============================================
   MODULE BAZAAR – js/article.js
   Article detail page behaviour only.
   · Reading progress bar
   · Copy link / code buttons
   · Share on X
   · Comment form with validation
   · Newsletter subscribe
   ============================================= */

(function () {
  'use strict';

  /* ════════════════════════════════
     0. TOC SCROLL SPY
     Watches each section heading via
     IntersectionObserver and moves the
     .active class to the matching TOC link.
  ════════════════════════════════ */
  const tocLinks   = document.querySelectorAll('.toc__link');
  const headings   = Array.from(tocLinks)
                         .map(a => document.querySelector(a.getAttribute('href')))
                         .filter(Boolean);

  function setActiveToc(id) {
    tocLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  if (headings.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      // Find the topmost heading that is currently intersecting
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length) setActiveToc(visible[0].target.id);
    }, {
      rootMargin: '0px 0px -70% 0px', // trigger when heading enters top 30% of viewport
      threshold: 0
    });

    headings.forEach(h => observer.observe(h));
  }

  /* ════════════════════════════════
     1. READING PROGRESS BAR
  ════════════════════════════════ */
  const progressBar = document.getElementById('readProgress');
  function updateProgress() {
    const article = document.querySelector('.article');
    if (!article || !progressBar) return;
    const top    = article.getBoundingClientRect().top + window.scrollY;
    const height = article.offsetHeight;
    const pct    = Math.min(100, Math.max(0, ((window.scrollY - top) / (height - window.innerHeight)) * 100));
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ════════════════════════════════
     2. COPY LINK
  ════════════════════════════════ */
  const shareToast        = document.getElementById('shareToast');
  const shareLinkBtn      = document.getElementById('shareLinkBtn');
  const copyLinkBtn       = document.getElementById('copyLinkBtn');

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (!shareToast) return;
      shareToast.classList.add('visible');
      clearTimeout(shareToast._t);
      shareToast._t = setTimeout(() => shareToast.classList.remove('visible'), 2500);
    });
  }
  if (shareLinkBtn) shareLinkBtn.addEventListener('click', copyLink);
  if (copyLinkBtn)  copyLinkBtn.addEventListener('click', copyLink);

  /* ════════════════════════════════
     3. SHARE ON X (TWITTER)
  ════════════════════════════════ */
  const shareTwitterBtn       = document.getElementById('shareTwitterBtn');
  const shareTwitterInlineBtn = document.getElementById('shareTwitterInlineBtn');
  function openTwitterShare() {
    const title = document.querySelector('.article__title')?.textContent || '';
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
      '_blank', 'noopener,noreferrer'
    );
  }
  if (shareTwitterBtn)       shareTwitterBtn.addEventListener('click', openTwitterShare);
  if (shareTwitterInlineBtn) shareTwitterInlineBtn.addEventListener('click', openTwitterShare);

  /* ════════════════════════════════
     4. COPY CODE BUTTON
  ════════════════════════════════ */
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const code = copyCodeBtn.closest('.code-block')?.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(() => {
        const label = copyCodeBtn.querySelector('span:last-child');
        const orig  = label.textContent;
        label.textContent = 'Copied!';
        copyCodeBtn.style.color = '#86efac';
        setTimeout(() => { label.textContent = orig; copyCodeBtn.style.color = ''; }, 2000);
      });
    });
  }

  /* ════════════════════════════════
     5. COMMENT FORM
  ════════════════════════════════ */
  const commentForm  = document.getElementById('commentForm');
  const commentList  = document.getElementById('commentList');
  const commentCount = document.getElementById('commentCount');
  let count = commentList ? commentList.querySelectorAll('.comment').length : 0;

  function setError(inputId, errorId, msg) {
    const input = document.getElementById(inputId);
    const err   = document.getElementById(errorId);
    if (msg) { input?.classList.add('invalid'); if (err) err.textContent = msg; return false; }
    input?.classList.remove('invalid'); if (err) err.textContent = ''; return true;
  }

  function initials(name) {
    return name.trim().split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
  }

  function avatarColor(name) {
    const hues = [221, 160, 280, 340, 45, 190];
    let sum = 0;
    for (const c of name) sum += c.charCodeAt(0);
    return `hsl(${hues[sum % hues.length]}, 55%, 42%)`;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Inject entrance animation
  const s = document.createElement('style');
  s.textContent = `@keyframes commentIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`;
  document.head.appendChild(s);

  if (commentForm) {
    commentForm.addEventListener('submit', e => {
      e.preventDefault();
      const nameVal  = document.getElementById('commenterName')?.value.trim()  || '';
      const emailVal = document.getElementById('commenterEmail')?.value.trim()  || '';
      const textVal  = document.getElementById('commenterText')?.value.trim()   || '';

      let ok = true;
      ok = setError('commenterName',  'nameError',  !nameVal ? 'Name is required.' : '') && ok;
      ok = setError('commenterEmail', 'emailError',
        emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) ? 'Enter a valid email.' : '') && ok;
      ok = setError('commenterText',  'textError',
        !textVal ? 'Comment cannot be empty.' : textVal.length < 10 ? 'Comment is too short.' : '') && ok;

      if (!ok) return;

      const el = document.createElement('div');
      el.className = 'comment';
      el.style.animation = 'commentIn 0.35s ease both';
      el.innerHTML = `
        <div class="comment__avatar" style="background:${avatarColor(nameVal)}">${initials(nameVal)}</div>
        <div class="comment__body">
          <div class="comment__meta">
            <strong class="comment__author">${escHtml(nameVal)}</strong>
            <time class="comment__date">Just now</time>
          </div>
          <p class="comment__text">${escHtml(textVal)}</p>
          <button class="comment__reply-btn">
            <span class="material-symbols-outlined">reply</span> Reply
          </button>
        </div>`;

      commentList.appendChild(el);
      count++;
      if (commentCount) commentCount.textContent = count;
      commentForm.reset();
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ════════════════════════════════
     6. NEWSLETTER
  ════════════════════════════════ */
  const emailInput   = document.getElementById('emailInput');
  const subscribeBtn = document.getElementById('subscribeBtn');
  const newsletterMsg= document.getElementById('newsletterMsg');

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function showMsg(text, ok) {
    if (!newsletterMsg) return;
    newsletterMsg.textContent = text;
    newsletterMsg.style.color = ok ? '#c8e6c9' : '#ffccbc';
    clearTimeout(newsletterMsg._t);
    newsletterMsg._t = setTimeout(() => { newsletterMsg.textContent = ''; }, 4000);
  }

  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', () => {
      const v = emailInput?.value.trim() || '';
      if (!v)          return showMsg('Please enter your email address.', false);
      if (!isEmail(v)) return showMsg('Please enter a valid email.', false);
      showMsg('✓ Subscribed! Welcome aboard.', true);
      if (emailInput) emailInput.value = '';
    });
  }
  if (emailInput) emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') subscribeBtn?.click(); });

})();
