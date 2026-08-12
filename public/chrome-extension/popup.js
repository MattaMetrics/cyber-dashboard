const sessionEl = document.getElementById('session');

chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
  if (!response?.ok) {
    sessionEl.textContent = 'No active session. Open the Assessment Pipeline and arm intercept.';
    sessionEl.className = 'status warn';
    return;
  }

  const session = response.session || {};
  sessionEl.innerHTML = `
    <div class="ok">INTERCEPT ARMED</div>
    <div>Test: ${session.test_id || '—'}</div>
    <div>Client: ${session.client_id || '—'}</div>
    <div>Age: ${session.client_age || '—'}</div>
    <div>API: ${session.api_base || 'http://localhost:8000'}</div>
  `;
});

chrome.storage.local.get(['ll_last_capture'], (stored) => {
  if (!stored.ll_last_capture) return;
  const block = document.createElement('div');
  block.className = 'status';
  block.style.marginTop = '10px';
  block.innerHTML = `
    <div>Last capture: ${stored.ll_last_capture.assessment_id || '—'}</div>
    <div>${stored.ll_last_capture.at || ''}</div>
  `;
  document.body.appendChild(block);
});
