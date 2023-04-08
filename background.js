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
      {command: chooseDocumentType, data: {value: 'DECLARAÇÃO'}},
      {command: chooseDocumentSubject, data: {value: '125.322'}},
      {command: chooseNatureza, data: {value: '1'}},
      {command: addAssinantesAndText, data: {text: 'Testando 1, 2, 3'}}
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
  performEvent('mouseover', '//span[text()="Protocolo"]');
  performEvent('mouseover', '(//td[text()="Documentos"])[2]');
  performEvent('mouseup', '//td[text()="Cadastrar Documento"]');
}
async function chooseDocumentType(data) {
  const value = data.value || throwError('value is required');
  await searchAndSelectFirstOptionRichFaces('#documentoForm\\:tipo', value);
}
async function chooseDocumentSubject(data) {
  const value = data.value || throwError('value is required');
  await searchAndSelectFirstOptionRichFaces('#documentoForm\\:classificacaoConarq', value);
}
async function chooseNatureza(data) {
  const value = data.value || '1'; // OSTENSIVO
  const txtNatureza = document.getElementById('documentoForm:natureza');
  txtNatureza.value = value;
  
  const txtAssunto = document.getElementById('documentoForm:c_assunto_detalhado');
  txtAssunto.value = 'teste';

  const radioEscrever = document.getElementsByName('documentoForm:formaDocumento')[0];
  radioEscrever.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
async function addAssinantesAndText(data) {
  const text = data.text || throwError('text is required');
  const editor = document.querySelector('#documentoForm\\:_texto_documento_ifr').contentDocument.body;
  editor.innerText = text;

  performEvent('mouseover', '#documentoForm\\:btnAdicionarAssinante')
  performEvent('click', '#documentoForm\\:linkAdicionarMinhaAssinatura')
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
      await chrome.scripting.executeScript({target: {tabId: tabId}, files: ['arrive.min.js', 'utils.js']});

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
