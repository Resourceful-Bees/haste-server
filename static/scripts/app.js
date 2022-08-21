const EXTENSIONS = {
    sh: "bash",
    clike: "c-like",
    coffee: "coffeescript",
    cs: "csharp",
    dpr: "delphi",
    erl: "erlang",
    hs: "haskell",
    js: "javascript",
    kt: "kotlin",
    tex: "latex",
    lsp: "lisp",
    mk: "makefile",
    md: "markdown",
    mm: "objectivec",
    phptemp: "php-template",
    pl: "perl",
    txt: "plaintext",
    py: "python",
    pyrepl: "python-repl",
    rb: "ruby",
    rs: "rust",
    sc: "scala",
    sm: "smalltalk",
    ts: "typscript",
    vbs: "vbscript",
    html: "xml",
    htm: "xml",
};

const KEY_R = 82;
const KEY_D = 68;
const KEY_N = 78;
const KEY_S = 83;

class App {

    constructor(options){
        this.options = options;
        this.configureShortcuts();
        this.configureButtons();
        this.baseUrl = options.baseUrl || '/';
    }

    setTitle(ext){
        document.title = `Hastebin${ext ? ` - ${ext}` : ""}`;
    }

    showMessage(msg){
        const message = document.getElementById("message");
        document.getElementById("message-content").innerText = msg;
        message.show();
        setTimeout(() => message.close(), 3000);
    }

    lightKey(){
        this.configureKeys(['new', 'save']);
    }

    fullKey(){
        this.configureKeys(['new', 'duplicate', 'raw']);
    }

    configureKeys(keys){
        outer:
        for (let child of document.getElementById("sidebar").children) {
            for (let id of keys) {
                if (child.id === id) {
                    child.classList.add("enabled");
                    continue outer;
                }
            }
            child.classList.remove("enabled");
        }
    }

    newDocument(hideHistory) {
        document.getElementById("box").style.display = "none";

        this.doc = new HasteDocument(this);
        if (!hideHistory){
            window.history.pushState(null, "Hastebin", this.baseUrl);
        }
        this.setTitle();
        this.lightKey();

        const codeEditor = document.getElementById("code-editor");
        codeEditor.style.display = "";
        codeEditor.focus();

        this.removeLineNumbers();
    }

    lookupExtensionByType(type){
        for (let key in EXTENSIONS)
            if (EXTENSIONS[key] === type)
                return key;
        return type;
    }

    lookupTypeByExtension(ext){
        return EXTENSIONS[ext] || ext;
    }

    addLineNumbers(lineCount){
        let h = '';
        for (let i = 0; i < lineCount; i++){
            h += `${i + 1}<br/>`;
        }
        document.getElementById("linenos").innerHTML = h;
    }

    removeLineNumbers(){
        document.getElementById("linenos").innerHTML = "&gt;";
    }

    loadDocument(key){
        let parts = key.split('.', 2);

        this.doc = new HasteDocument(this);

        this.doc.load(parts[0], data => {
            if (data){
                document.getElementById("code-viewer").innerHTML = data.value;
                this.setTitle(data.key);
                this.fullKey();
                const codeEditor = document.getElementById("code-editor")
                codeEditor.value = "";
                codeEditor.style.display = "none";

                const box = document.getElementById("box");
                box.style.display = "";
                box.focus();
                document.getElementById("base").classList.add("should-scroll")
                this.addLineNumbers(data.lineCount);
            } else {
                this.newDocument();
            }
        }, this.lookupTypeByExtension(parts[1]));
    }

    duplicateDocument(){
        if (this.doc.locked){
            let currentData = this.doc.data;
            this.newDocument();
            document.getElementById("code-editor").value = currentData;
        }
    }

    lockDocument(){
        const codeEditor = document.getElementById("code-editor");
        this.doc.save(codeEditor.value, (err, data) => {
            if (err) {
                this.showMessage(err.message)
            } else if (data) {
                document.getElementById("code-viewer").innerHTML = data.value;
                this.setTitle(data.key);
                let file = this.baseUrl + data.key;
                if (data.language){
                    file += `.${this.lookupExtensionByType(data.language)}`;
                }
                window.history.pushState(null, `Hastebin-${data.key}`, file);
                this.fullKey();
                codeEditor.value = "";
                codeEditor.style.display = "none";
                const box = document.getElementById("box");
                box.style.display = "";
                box.focus();
                this.addLineNumbers(data.lineCount);
            }
        });
    }

    configureButtons() {
        this.buttons = [
            {
                element: document.getElementById("save"),
                label: 'Save',
                shortcutDescription: 'control + s',
                shortcut: event => event.ctrlKey && event.keyCode === KEY_S,
                action: () => {
                    const codeEditor = document.getElementById("code-editor");
                    if (codeEditor.value.replace(/^\s+|\s+$/g, '') !== '') {
                        this.lockDocument();
                    }
                }
            },
            {
                element: document.getElementById("new"),
                label: 'New',
                shortcut: event => event.ctrlKey && event.keyCode === KEY_N,
                shortcutDescription: 'control + n',
                action: () => this.newDocument(!this.doc.key)
            },
            {
                element: document.getElementById("duplicate"),
                label: 'Duplicate & Edit',
                shortcut: event => this.doc.locked && event.ctrlKey && event.keyCode === KEY_D,
                shortcutDescription: 'control + d',
                action: () => this.duplicateDocument()
            },
            {
                element: document.getElementById("raw"),
                label: 'Just Text',
                shortcut: event => event.ctrlKey && event.shiftKey && event.keyCode === KEY_R,
                shortcutDescription: 'control + shift + r',
                action: () => window.location.href = `${this.baseUrl}raw/${this.doc.key}`
            }
        ];
        for (const button of this.buttons){
            this.configureButton(button);
        }
    }

    configureButton(options){
        // Handle the click action
        options.element.onclick = event => {
            event.preventDefault();
            if (options.element.classList.contains('enabled')){
                options.action();
            }
        };
    }

    configureShortcuts(){
        onkeydown = event => {
            for (const button of this.buttons){
                if (button.shortcut && button.shortcut(event)){
                    event.preventDefault();
                    button.action();
                    return;
                }
            }
        }
    }
}