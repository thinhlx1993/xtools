function interceptRequest(requestDetails) {
    if (requestDetails.url.includes('client-api.arkoselabs.com/rtig/image') && !requestDetails.url.includes('mkt=en')) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.executeScript(
                tabs[0].id,
                { code: `var imageUrl = "${requestDetails.url}&mkt=en"
                var elementUrl = document.getElementById("UrlImageCaptcha")
                if (elementUrl) {
                    elementUrl.value = imageUrl;
                } else {
                    const textBox = document.createElement('input');
                    textBox.setAttribute('type', 'text');
                    textBox.setAttribute('id', 'UrlImageCaptcha');
                    document.body.appendChild(textBox);
                    textBox.value = imageUrl;
                }
                fetch(imageUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = function () {
                            const base64data = reader.result;
                            var elementBase64 = document.getElementById("Base64ImageCaptcha")
                            if (elementBase64) {
                                elementBase64.value = base64data;
                            } else {
                                const textBox = document.createElement('input');
                                textBox.setAttribute('type', 'text');
                                textBox.setAttribute('id', 'Base64ImageCaptcha');
                                document.body.appendChild(textBox);
                                textBox.value = base64data;
                            }
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(error => {
                        var elementBase64 = document.getElementById("Base64ImageCaptcha")
                        if (elementBase64) {
                            elementBase64.value = "";
                        } else {
                            const textBox = document.createElement('input');
                            textBox.setAttribute('type', 'text');
                            textBox.setAttribute('id', 'Base64ImageCaptcha');
                            document.body.appendChild(textBox);
                            textBox.value = "";
                        }
                    });`
                }
            );
        });
    }
    if (requestDetails.url.includes('index.html') && requestDetails.url.includes('iframe.arkoselabs.com') && !requestDetails.url.includes('mkt=en')) {
        //const modifiedURL = checkAndUpdateURL(requestDetails.url);
        return { redirectUrl: "https://iframe.arkoselabs.com/2CB16598-CB82-4CF7-B332-5990DB66F3AB/index.html?mkt=en" };
    }
    return {};
}

function checkAndUpdateURL(url) {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    if (searchParams.has('mkt')) {
        const mktValue = searchParams.get('mkt');
        if (mktValue !== 'en') {
            searchParams.set('mkt', 'en');
            return urlObj.toString();
        }
        return null;
    } else {
        searchParams.set('mkt', 'en');
        return urlObj.toString();
    }
}

chrome.webRequest.onBeforeRequest.addListener(
    interceptRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
);
