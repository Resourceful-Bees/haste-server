let app = null;

let handlePop = event => {
    let path = event.target.location.href;
    if (path === app.baseUrl) app.newDocument(true);
    else app.loadDocument(path.split('/').slice(-1)[0]);
};

setTimeout(() => window.onpopstate = (event) => { try { handlePop(event); } catch(err){} } , 1000);

let baseUrl = window.location.href.split('/');
baseUrl = baseUrl.slice(0, baseUrl.length - 1).join('/') + '/';
app = new App({ baseUrl: baseUrl });
handlePop({ target: window });