const baseUrl = 'https://homework-server1.onrender.com';
const key = 'dbaric99';
const codeContainer = document.querySelector('.code-container');

console.log("something is happening");

async function fetchCodeBlocks() {
    const method = 'GET';
    const headers = { key };
    const options = {method, headers};

    const response = await fetch(`${baseUrl}/code`, options);
    const codeBlock = await response.json();
    return codeBlock;
}

fetchCodeBlocks().then(codeBlock => {
    var codeLines = codeBlock.code.split('\n');
    codeLines.forEach((line, index) => {
        const lineIndex = document.createElement('span');
        lineIndex.classList.add = 'code-line__index';
        lineIndex.innerHTML = index;

        const element = document.createElement('div');
        element.classList.add = 'code-line';
        element.appendChild(lineIndex);
        element.innerHTML = line.replace(/ /g, '&nbsp;');

        codeContainer.appendChild(element);
    })
    console.log(codeLines);
});