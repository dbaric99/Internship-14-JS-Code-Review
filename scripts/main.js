import config from '../config.js';

const handleUpdateInput = (e) => {
    let currentCharCounter = document.querySelector('.count__current');
    currentCharCounter.textContent = e.target.value.length;
    disableButtons();
}

const handleSaveComment = (e) => {
    let commentValue = commentInputBox.querySelector('.comment-text-holder').value;
    let isEmpty = !(commentValue.length);
    if(isEmpty) return;

    let lineIndex = commentInputBox.parentElement.querySelector('.code-line__index').textContent;

    if(e.target.classList.contains('send-private')) {
        saveCommentToLocalStorage({lineIndex, value: commentValue });
    } else {
        saveCommentToServer({ lineIndex, value: commentValue });
    }
    toggleCommentSection();
}

const codeContainer = document.querySelector('.code-container');
const commentInputBox = getCommentAndBindListeners();

async function fetchCodeBlocks() {
    const method = 'GET';
    const headers = { key: config.apiKey };
    const options = {method, headers};

    const response = await fetch(`${config.apiUrl}/code`, options);
    const codeBlock = await response.json();
    return codeBlock;
}

fetchCodeBlocks().then(codeBlock => {
    if(!codeBlock.code) return;
    var codeLines = codeBlock.code.split('\n');
    codeLines.forEach((line, index) => {
        const lineIndex = document.createElement('span');
        lineIndex.classList.add('code-line__index');
        lineIndex.textContent = index + 1;

        const element = document.createElement('pre');
        element.classList.add('code-line');
        element.appendChild(lineIndex);
        element.innerHTML += line;

        const wrapper = document.createElement('div');
        wrapper.classList.add('code-line-wrapper');
        wrapper.appendChild(element);

        element.bindListeners({'mouseenter': lineMouseEnterHandler, 'mouseleave': lineMouseLeaveHandler, 'click': lineClickHandler});

        codeContainer.appendChild(wrapper);
    });
})
.catch(err => {
    throw new Error("Error has occured while fetching the code block:", err);
});

const lineMouseEnterHandler = (e) => {
    e.target.classList.add('code-line--highlighted');
}

const lineMouseLeaveHandler = (e) => {
    e.target.classList.remove('code-line--highlighted');
}

const lineClickHandler = (e) => {
    if(e.target.tagName === 'SPAN') {
        let holder = e.target.closest('.code-line-wrapper');
        holder.appendCommentSection();
    } else {
        let lineIndex = e.target.querySelector('span').textContent;
        let showComments = new CustomEvent('showcomments', { detail: {line: lineIndex }})
        document.dispatchEvent(showComments);
    }
}

HTMLElement.prototype.bindListeners = function(eventListeners) {
    for (let eventType in eventListeners) {
        this.addEventListener(eventType, eventListeners[eventType]);
    }
}

HTMLElement.prototype.appendCommentSection = function() {
    commentInputBox.querySelector('.comment-text-holder').value = '';
    this.appendChild(commentInputBox);
    toggleCommentSection('block');
}

function toggleCommentSection(display) {
    let currentDisplay = commentInputBox.style.display;
    if(display && !(display instanceof Event)) {
        commentInputBox.style.display = display;
        return;
    }
    commentInputBox.style.display = currentDisplay === 'none' ? 'block' : 'none';
}

function getCommentAndBindListeners() {
    let commentElement = document.getElementById('comment-wrapper');

    commentElement.querySelector('.comment-text-holder').addEventListener('keyup', handleUpdateInput);

    commentElement.querySelectorAll('.btn-comment').forEach(button => button.addEventListener('click', handleSaveComment));
    commentElement.querySelector('.close-mark').addEventListener('click', toggleCommentSection);
    
    return commentElement;
}

function disableButtons() {
    let currentCharCounter = document.querySelector('.count__current');
    let buttons = document.querySelectorAll('.btn-comment');
    if(parseInt(currentCharCounter.textContent) === 0) {
        buttons.forEach(btn => btn.classList.add('btn--disable'));
    } else {
        buttons.forEach(btn => btn.classList.remove('btn--disable'));
    }
}
disableButtons();

function saveCommentToLocalStorage(item) {
    let localStorageComments = JSON.parse(localStorage.getItem('comments')) || [];

    let newId = localStorageComments.length !== 0 ? localStorageComments.reduce(function(prev, curr) {
        return prev.id > curr.id ? prev : curr;
    }).id + 1 : 0;

    let newComment = { id: newId,line: item.lineIndex , text: item.value,isLiked: false, createdAt: new Date() };

    localStorageComments.push(newComment);
    
    localStorage.setItem('comments', JSON.stringify(localStorageComments));
}

function saveCommentToServer(item) {
    fetch(`${config.apiUrl}/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            key: config.apiKey,
        },
        body: JSON.stringify({
            line: item.lineIndex,
            text: item.value,
        }),
    })
    .then(response => response.json())
    .then(response => console.log('Created new comment:', response))
    .catch(err => {throw new Error("Couldn't create new comment:", err)})
}