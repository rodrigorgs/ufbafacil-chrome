document.addEventListener('DOMContentLoaded', () => {  
  document.getElementById('action').addEventListener('click', async () => {
    const userText = document.getElementById("user-text").value;
    
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    chrome.runtime.sendMessage({ type: 'searchProcesso', processo: userText });


  });
});
