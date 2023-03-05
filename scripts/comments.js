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
    serverComments.forEach(comment => {
        console.log(new Date(comment.createdAt).toLocaleString());
        let commentElement = document.getElementById('comment-template').cloneNode(true);
        commentElement.removeAttribute('id');
        let text = commentElement.querySelector('.comment-text');
        let timestamp = commentElement.querySelector('.comment-timestamp');
        let favorite = commentElement.querySelector('.favorite-icon');
        let deleteButton = commentElement.querySelector('.btn-delete');

        text.textContent = comment.text;
        timestamp.textContent = new Date(comment.createdAt).toLocaleString();
        favorite.src = comment.isLiked ? './icons/heart-full.svg' : './icons/heart-empty.svg';

        commentElement.classList.add('server');
        commentElement.classList.remove('private');
        
        favorite.addEventListener('click', () => {
            let setFavoriteEvent = new CustomEvent('setfavorite', {detail: {comment, updatedData: !comment.isLiked, isFromServer: true}});
            document.dispatchEvent(setFavoriteEvent); 
        });

        deleteButton.addEventListener('click', () => {
            let deleteFromServer = new CustomEvent('deleteserver', {detail: {id: comment.id}});
            document.dispatchEvent(deleteFromServer);
        })

        commentsHolder.appendChild(commentElement);
    })
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

const handleSetFavorite = (e) => {
    console.log("SET FAVORITE", e.detail);
}

const deleteCommentFromServer = (e) => {
    console.log("DELETE: ", e.detail);
}

document.addEventListener('showcomments', showCommentsForLine);
document.addEventListener('deleteserver', deleteCommentFromServer)
document.addEventListener('setfavorite', handleSetFavorite);