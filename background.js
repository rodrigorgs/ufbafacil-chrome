let nextCommand = {
  name: 'wait',
}

// all commands get an object as a parameter, in the following format:
// {
//   request: request object from the popup
//   ...additional data from the workflow
// }
const workflows = {
  'teste': { // workflow
    initialUrl: 'https://www.ufba.br',
    steps: [
      {command: teste}
    ]
  },
  'searchProcesso': {
    initialUrl: 'https://sipac.ufba.br/public/jsp/portal.jsf',
    steps: [
      {command: searchProcesso},
      {command: openInMesaVirtual},
    ]
  },
  'createDocument': {
    initialUrl: 'https://sipac.ufba.br/sipac/portal_administrativo/index.jsf',    
    steps: [
      {command: openCreateDocumentPage},
      {command: chooseDocumentType},
      {command: chooseDocumentSubject},
      {command: chooseNatureza},
      {command: addAssinantes}
    ]
  }
}

let currentWorkflow = null;
let currentStep = 0;
let currentRequest = {};

////////////////////////

async function openInMesaVirtual() {
  performEvent('click', 'img[alt="Visualizar Processo na Mesa Virtual"]')
}
async function openCreateDocumentPage() {
  const menuProtocolo = getElementByXpath('//span[text()="Protocolo"]');
  menuProtocolo.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const submenuDocumentos = getElementByXpath('(//td[text()="Documentos"])[2]');
  submenuDocumentos.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const menuNovoDocumento = getElementByXpath('//td[text()="Cadastrar Documento"]');
  menuNovoDocumento.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}
async function chooseDocumentType() {
  const value = 'DECLARAÇÃO';
  const txtTipoDocumento = document.getElementById('documentoForm:tipo');
  txtTipoDocumento.focus();
  txtTipoDocumento.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, char: value }));
  txtTipoDocumento.value = value;
  await new Promise(res => setTimeout(res, 2000)); // TODO: replace by a solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  const dropdown = document.querySelector('.rich-sb-cell-padding.richfaces_suggestionSelectValue');
  dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true }));    
}
async function chooseDocumentSubject() {
  const value = '125.322'; // 125.322 - BANCAS EXAMINADORAS DE TRABALHO FINAL DE CURSO DE GRADUAÇÃO: INDICAÇÃO E ATUAÇÃO
  const txtTipoDocumento = document.getElementById('documentoForm:classificacaoConarq');
  txtTipoDocumento.focus();
  txtTipoDocumento.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, char: value }));
  txtTipoDocumento.value = value;
  await new Promise(res => setTimeout(res, 2000)); // TODO: replace by a solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  const dropdown = document.querySelector('.rich-sb-cell-padding.richfaces_suggestionSelectValue');
  dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true }));    
}
async function chooseNatureza() {
  const txtNatureza = document.getElementById('documentoForm:natureza');
  txtNatureza.value = '1'; // OSTENSIVO 
  
  const txtAssunto = document.getElementById('documentoForm:c_assunto_detalhado');
  txtAssunto.value = 'teste';
  await new Promise(res => setTimeout(res, 2000));

  await new Promise(res => setTimeout(res, 1000));
  const radioEscrever = document.getElementsByName('documentoForm:formaDocumento')[0];
  radioEscrever.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
async function addAssinantes() {
  const btnAdicionarAssinante = document.getElementById('documentoForm:btnAdicionarAssinante');
  btnAdicionarAssinante.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const linkAdicionarMinhaAssinatura = document.getElementById('documentoForm:linkAdicionarMinhaAssinatura');
  linkAdicionarMinhaAssinatura.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  
  await new Promise(res => setTimeout(res, 2000));
  const editor = document.querySelectorAll('iframe')[2].contentDocument.body; // TODO [2] is too fragile
  editor.innerText = 'Testando 1, 2, 3';
}

async function teste() {
  console.log(1);
  helloWorld();
  console.log(2);
}

async function searchProcesso(data) {
  const numeroProcesso = data.request.processo;

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
    
    if (currentWorkflow && currentStep < currentWorkflow.steps.length) {
      // inject util functions in every page
      await chrome.scripting.executeScript({target: {tabId: tabId}, files: ['utils.js']});

      const step = currentWorkflow.steps[currentStep];
      const func = step['command'];
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        args: [{request: currentRequest, ...step.data}],
        function: func
      });

      currentStep++;
    } else {
      currentWorkflow = null;
      currentStep = 0;
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

  currentWorkflow = workflows[request.type];
  if (currentWorkflow) {
    redirectTo(tab, currentWorkflow.initialUrl);
    currentStep = 0;
    currentRequest = request;
  }
});
