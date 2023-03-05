import config from '../config.js';

const commentPopOut = document.querySelector('.comment-pop-out');
const commentsHolder = document.querySelector('.comments-holder');

commentPopOut.querySelector('.close-pop-out').addEventListener('click', (e) => e.target.parentElement.style.display = 'none');

async function fetchCommentsFromServer() {
    const method = 'GET';
    const headers = { key: config.apiKey };
    const options = {method, headers};

    const response = await fetch(`${config.apiUrl}/comments`, options);
    const comments = await response.json();
    return comments;
}

function getCommentsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('comments')) || [];
}

function groupCommentsByline(comments) {
    return comments.reduce((acc, comment) => {
        const line = comment.line;
        if (!acc[line]) {
          acc[line] = [];
        }
        acc[line].push(comment);
        return acc;
      }, {});
}

function displayComments(serverComments, localComments) {
    commentPopOut.style.display = 'block';
}

const showCommentsForLine = (e) => {
    Promise.all([fetchCommentsFromServer(), getCommentsFromLocalStorage()])
    .then(([serverComments, localStorageComments]) => {
        let targetCodeLine = e.detail.line;

        let serverCommentsForLine = groupCommentsByline(serverComments.comments)[targetCodeLine];
        let localCommentsForLine = groupCommentsByline(localStorageComments)[targetCodeLine];

        displayComments(serverCommentsForLine, localCommentsForLine);
    })
    .catch(err => {
        throw new Error("Error displaying comments:", err);
    })
}

document.addEventListener('showcomments', showCommentsForLine);