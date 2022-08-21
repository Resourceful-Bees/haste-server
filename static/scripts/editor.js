const TAB_KEY = 9;


const codeEditor = document.getElementById("code-editor");

codeEditor.onkeydown = (event) => {
    if (event.which === TAB_KEY) {
        event.preventDefault();
        const val = codeEditor.value;
        codeEditor.value = `${val.substring(0, codeEditor.selectionStart)}    ${val.substring(codeEditor.selectionEnd, val.length)}`;
        this.focus();
        codeEditor.selectionStart += 4;
        codeEditor.selectionEnd += 4;
    }
}