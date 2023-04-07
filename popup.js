document.addEventListener('DOMContentLoaded', () => {  
  document.getElementById('action').addEventListener('click', async () => {
    const userText = document.getElementById("user-text").value;
    chrome.runtime.sendMessage({ type: 'searchProcesso', processo: userText });
    window.close();
  });
});
