let nextCommand = {
  name: 'wait',
}

////////////////////////

async function searchProcesso(numeroProcesso) {
  // navigateToConsultaProcessos
  performEvent('mousedown', '#l-processos');
  
  // fillInProcesso
  const parts = numeroProcesso.split(/[^\d]/);
  const inputs = document.querySelectorAll('div.num_processo-div.campo-busca > input[type="text"]');
  for (let i = 0; i < 4; i++) {
    inputs[i].value = parts[i];
    inputs[i].dispatchEvent(new Event('input'));
  }

  // clickSubmit
  performEvent('click', 'input[value="Consultar Processo"]');
}

////////////////////////

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // inject util functions in every page
    await chrome.scripting.executeScript({target: {tabId: tabId}, files: ['utils.js']});

    console.log('nextCommand', nextCommand);
    switch (nextCommand.name) {
    case 'teste':
      await chrome.scripting.executeScript({target: {tabId: tabId}, function: async () => {
          console.log(1);
          helloWorld();
          console.log(2);
        }
      });
      break;
    case 'searchProcesso':
      await chrome.scripting.executeScript({
        target: {tabId},
        args: [nextCommand.numeroProcesso],
        function: searchProcesso
      });
      nextCommand = {name: 'openInMesaVirtual'};
      break;
    case 'openInMesaVirtual':
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async () => {
          performEvent('click', 'img[alt="Visualizar Processo na Mesa Virtual"]')
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
  } else if (request.type === 'teste') {
    await redirectTo(tab, 'https://www.ufba.br/');
    nextCommand = {name: 'teste'};
  }
});
