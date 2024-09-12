let getTabId = null; // Inicialize a variável

// Função para remover o iframe
function removeIframe(tabId) {
    if (!tabId) return; // Verifique se tabId é válido

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            const body = document.querySelector('body');

            if (!body.classList.contains('hide-iframe')) {
                body.classList.add('hide-iframe');
            }
        }
    }).catch(err => console.error("Error executing script:", err));
}

// Função para iniciar o intervalo de remoção
function startIframeRemoval(tabId) {
    if (!tabId) return; // Verifique se tabId é válido

    removeIframe(tabId);
}

// Função para parar o intervalo de remoção
function stopIframeRemoval(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            const body = document.querySelector('body');

            if (body.classList.contains('hide-iframe')) {
                body.classList.remove('hide-iframe');
            }
        }
    }).catch(err => console.error("Error executing script:", err));
}

// Verifica a URL da aba e remove o iframe se necessário
function checkAndRemoveIframe(tabId, changeInfo) {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get('isChecked', function (data) {
            chrome.tabs.get(tabId, (tab) => {
                if (tab.url.startsWith("http://facilita")) {
                    getTabId = tab.id;

                    chrome.scripting.insertCSS({
                        target: { tabId: tabId }, // O ID da aba onde o CSS será injetado
                        files: ['css/hide-iframe.css'] // O arquivo CSS que será injetado
                    }, () => {
                        console.log('CSS injetado!');
                    });

                    if (data.isChecked) {
                        startIframeRemoval(getTabId);
                    } else {
                        stopIframeRemoval(getTabId);
                    }
                } 
            });
        });
    }
}

// Adiciona um listener para quando a aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    checkAndRemoveIframe(tabId, changeInfo);
});

// Adiciona um listener para quando uma aba é carregada
chrome.webNavigation.onCompleted.addListener((details) => {
    checkAndRemoveIframe(details.tabId, { status: 'complete' });
});

// Adiciona um listener para mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSwitch') {
        if (getTabId) {
            message.isChecked ? startIframeRemoval(getTabId) : stopIframeRemoval(getTabId);
        }
    }
});
