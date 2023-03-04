const baseUrl = 'https://homework-server1.onrender.com';
const key = 'dbaric99';

const handleUpdateInput = (e) => {
    let currentCharCounter = document.querySelector('.count__current');
    currentCharCounter.textContent = e.target.value.length;
    disableButtons();
}

const handleSendPrivate = (e) => {
    let commentValue = commentInputBox.querySelector('.comment-text-holder').value;
    let isEmpty = !(commentValue.length);
    if(isEmpty) return;

    let lineIndex = commentInputBox.parentElement.querySelector('.code-line__index').textContent;

    saveToLocalStorage({lineIndex, value: commentValue });
    toggleCommentSection();
}

const handleSendServer = (e) => {
    let commentValue = commentInputBox.querySelector('.comment-text-holder').value;
    var isEmpty = !(commentValue.length);
    if(isEmpty) return;

    let lineIndex = commentInputBox.parentElement.querySelector('.code-line__index').textContent;

    saveCommentToServer({ lineIndex, value: commentValue });
    toggleCommentSection();
}

const codeContainer = document.querySelector('.code-container');
const commentInputBox = getCommentAndBindListeners();

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
});

async function fetchAllComments() {
    const method = 'GET';
    const headers = { key };
    const options = {method, headers};

    const response = await fetch(`${baseUrl}/comments`, options);
    const comments = await response.json();
    return comments;
}

fetchAllComments().then(comments => {
    console.log("COMMENTS: ", comments);
})


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

    commentElement.querySelector('.send-private').addEventListener('click', handleSendPrivate);
    commentElement.querySelector('.send').addEventListener('click', handleSendServer);
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

function saveToLocalStorage(item) {
    let localStorageContents = JSON.parse(localStorage.getItem('comments')) || [];
    let newComment = { [item.lineIndex]: item.value };

    let index = localStorageContents.findIndex(comment => Object.keys(comment)[0] === Object.keys(newComment)[0]);

    if (index !== -1) {
        localStorageContents[index] = newComment;
    } else {
        localStorageContents.push(newComment);
    }
    
    localStorage.setItem('comments', JSON.stringify(localStorageContents));
}

function saveCommentToServer(item) {
    method = 'POST';
    const headers = {
        "Content-Type": "application/json",
        key,
    };
    const options = {method, headers};

    fetch(`${baseUrl}/create`, {
        options,
        body: JSON.stringify({
            line: item.lineIndex,
            text: item.value
        }),
    })
    .then(response => response.json())
    .then(response => console.log(JSON.stringify(response)))
    .catch(err => {throw new Error("Couldn't create new comment:", err)})
}