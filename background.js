let nextCommand = {
  name: 'wait',
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    console.log('nextCommand', nextCommand);
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
    case 'openCreateDocumentPage':
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async () => {
          function getElementByXpath(path, doc) {
            doc = doc || document;
            return doc.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          }
          
          const menuProtocolo = getElementByXpath('//span[text()="Protocolo"]');
          menuProtocolo.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          const submenuDocumentos = getElementByXpath('(//td[text()="Documentos"])[2]');
          submenuDocumentos.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          const menuNovoDocumento = getElementByXpath('//td[text()="Cadastrar Documento"]');
          menuNovoDocumento.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
      });
      nextCommand = {name: 'chooseDocumentType'};
      break;
    case 'chooseDocumentType':
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async () => {
          const value = 'DECLARAÇÃO';
          const txtTipoDocumento = document.getElementById('documentoForm:tipo');
          txtTipoDocumento.focus();
          txtTipoDocumento.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, char: value }));
          txtTipoDocumento.value = value;
          await new Promise(res => setTimeout(res, 2000)); // TODO: replace by a solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
          const dropdown = document.querySelector('.rich-sb-cell-padding.richfaces_suggestionSelectValue');
          dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true }));    
        }
      });
      nextCommand = {name: 'chooseDocumentSubject'};
      break;
      case 'chooseDocumentSubject':
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          function: async () => {
            const value = '125.322'; // 125.322 - BANCAS EXAMINADORAS DE TRABALHO FINAL DE CURSO DE GRADUAÇÃO: INDICAÇÃO E ATUAÇÃO
            const txtTipoDocumento = document.getElementById('documentoForm:classificacaoConarq');
            txtTipoDocumento.focus();
            txtTipoDocumento.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, char: value }));
            txtTipoDocumento.value = value;
            await new Promise(res => setTimeout(res, 2000)); // TODO: replace by a solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
            const dropdown = document.querySelector('.rich-sb-cell-padding.richfaces_suggestionSelectValue');
            dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true }));    
          }
        });
        nextCommand = {name: 'chooseNatureza'};
        break;
      case 'chooseNatureza':
        await chrome.scripting.executeScript({
          target: {tabId: tabId},
          function: async () => {
            const txtNatureza = document.getElementById('documentoForm:natureza');
            txtNatureza.value = '1'; // OSTENSIVO 
            
            const txtAssunto = document.getElementById('documentoForm:c_assunto_detalhado');
            txtAssunto.value = 'teste';
            await new Promise(res => setTimeout(res, 2000));
    
            await new Promise(res => setTimeout(res, 1000));
            const radioEscrever = document.getElementsByName('documentoForm:formaDocumento')[0];
            radioEscrever.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        nextCommand = {name: 'addAssinantes'};
        break;
    case 'addAssinantes':
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async () => {
          const btnAdicionarAssinante = document.getElementById('documentoForm:btnAdicionarAssinante');
          btnAdicionarAssinante.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          const linkAdicionarMinhaAssinatura = document.getElementById('documentoForm:linkAdicionarMinhaAssinatura');
          linkAdicionarMinhaAssinatura.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          
          await new Promise(res => setTimeout(res, 2000));
          const editor = document.querySelectorAll('iframe')[2].contentDocument.body; // TODO [2] is too fragile
          editor.innerText = 'Testando 1, 2, 3';
        }
      });
      nextCommand = {name: 'wait'};
      break;
    }
  }
});


async function redirectTo(tab, url) {  
  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [url],
    function: (url) => {
      location.href = url;
    }
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (request.type === 'searchProcesso') {
    processo = request.processo;
    await redirectTo(tab, 'https://sipac.ufba.br/public/jsp/portal.jsf');
    nextCommand = {name: 'searchProcesso', numeroProcesso: processo};
  } else if (request.type === 'createDocument') {
    await redirectTo(tab, 'https://sipac.ufba.br/sipac/portal_administrativo/index.jsf');
    nextCommand = {name: 'openCreateDocumentPage'};
  }
});
