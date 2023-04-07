let nextCommand = {
  name: 'wait',
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    switch (nextCommand.name) {
      case 'searchProcesso':
        await chrome.scripting.executeScript({
          target: {tabId},
          args: [nextCommand.numeroProcesso],
          function: async (processo) => {
            async function waitALittle(duration) {
              // return new Promise(res => setTimeout(res, duration ?? 1));
              return new Promise(res => res());
            }
            async function navigateToConsultaProcessos() {
              let menuItem = document.querySelector('#l-processos');
              menuItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              return waitALittle();
            }
    
            async function fillInProcesso(number) {
              const parts = number.split(/[^\d]/);
              const inputs = document.querySelectorAll('div.num_processo-div.campo-busca > input[type="text"]');
              for (let i = 0; i < 4; i++) {
                inputs[i].value = parts[i];
                inputs[i].dispatchEvent(new Event('input'));
              }
              return waitALittle();
            }
    
            async function clickSubmit() {
              const btnSubmit = document.querySelector('input[value="Consultar Processo"]');
              btnSubmit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              return waitALittle(2000);
            }
    
    
            await navigateToConsultaProcessos();
            await fillInProcesso(processo);
            await clickSubmit();
          }
        });
        nextCommand = {name: 'openInMesaVirtual'};
        break;
      case 'openInMesaVirtual':
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          function: async () => {
            const imgVisualizar = document.querySelector('img[alt="Visualizar Processo na Mesa Virtual"]');
            imgVisualizar.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        nextCommand = {name: 'wait'};
        break;
    }
  }
});


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'searchProcesso') {
    processo = request.processo;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => {
        location.href = 'https://sipac.ufba.br/public/jsp/portal.jsf';
      }
    });
    nextCommand = {name: 'searchProcesso', numeroProcesso: processo};
  }
});
