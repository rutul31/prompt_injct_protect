(async function(){
  const endpoint = document.getElementById('endpoint');
  const apiKey = document.getElementById('apiKey');
  const msg = document.getElementById('msg');
  const save = document.getElementById('save');

  const cur = (await chrome.storage.local.get('llm_prompt_guard'))['llm_prompt_guard'] || {};
  endpoint.value = cur.endpoint || '';
  apiKey.value = cur.apiKey || '';

  save.onclick = async () => {
    const s = (await chrome.storage.local.get('llm_prompt_guard'))['llm_prompt_guard'] || {};
    s.endpoint = endpoint.value.trim();
    s.apiKey = apiKey.value.trim();
    await chrome.storage.local.set({ 'llm_prompt_guard': s });
    msg.textContent = 'Saved.';
    setTimeout(()=> msg.textContent = '', 1500);
  };
})();
