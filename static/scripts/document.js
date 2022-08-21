class HasteDocument {
    constructor(app) {
        this.locked = false;
        this.app = app;
    }

    htmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    load(key, callback, lang) {
        fetch(`${this.app.baseUrl}documents/${key}`)
            .then(response => response.json())
            .then(response => {
                this.locked = true;
                this.key = key;
                this.data = response.data;

                let highlight;
                try {
                    if (lang === 'txt') {
                        highlight = {value: this.htmlEscape(this.data)};
                    } else if (lang) {
                        highlight = hljs.highlight(this.data, {language: lang});
                    }
                } catch (err) {
                }
                if (!highlight) highlight = hljs.highlightAuto(this.data);
                callback({
                    value: highlight.value,
                    key: key,
                    language: highlight.language || lang,
                    lineCount: this.data.split("\n").length
                })
            })
            .catch(() => {
                callback(false)
            });
    }

    save(data, callback){
        if (this.locked) return false;
        this.data = data;
        fetch(`${this.app.baseUrl}documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: this.data})
            .then(response => response.json())
            .then(response => {
                this.locked = true;
                this.key = response.key;
                let high = hljs.highlightAuto(data);
                callback(null, {
                    value: high.value,
                    key: this.key,
                    language: high.language,
                    lineCount: data.split('\n').length
                });
            })
            .catch(response => {
                try {
                    callback(JSON.parse(response.responseText));
                } catch (e){
                    callback({ message: 'Something went wrong!' });
                }
            })
    }
}