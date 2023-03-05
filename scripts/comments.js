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

function createCommentElement(comment, isFromServer) {
    let commentElement = document.getElementById('comment-template').cloneNode(true);
    commentElement.removeAttribute('id');
    let text = commentElement.querySelector('.comment-text');
    let timestamp = commentElement.querySelector('.comment-timestamp');
    let favorite = commentElement.querySelector('.favorite-icon');

    text.textContent = comment.text;
    timestamp.textContent = new Date(comment.createdAt).toLocaleString();
    favorite.src = comment.isLiked ? './icons/heart-full.svg' : './icons/heart-empty.svg';

    commentElement.classList.add(isFromServer ? 'server' : 'private');
    commentElement.classList.remove(!isFromServer ? 'server' : 'private');

    return commentElement;
}

function displayComments(serverComments, localComments) {
    commentPopOut.style.display = 'block';
    commentsHolder.innerHTML="";
    if(serverComments && serverComments.length !== 0) {
        serverComments.forEach(comment => {
            let commentElement = createCommentElement(comment, true);
            let favorite = commentElement.querySelector('.favorite-icon');
            let deleteButton = commentElement.querySelector('.btn-delete');
            
            favorite.addEventListener('click', () => {
                let setFavoriteEvent = new CustomEvent('setfavorite', {detail: {comment, isFromServer: true, commentElement}});
                document.dispatchEvent(setFavoriteEvent); 
            });
    
            deleteButton.addEventListener('click', () => {
                let deleteFromServer = new CustomEvent('deleteserver', {detail: {id: comment.id, commentElement}});
                document.dispatchEvent(deleteFromServer);
            })
    
            commentsHolder.appendChild(commentElement);
        });
    }

    if(localComments && localComments !== 0) {
        localComments.forEach(comment => {
            let commentElement = createCommentElement(comment, false);
            let favorite = commentElement.querySelector('.favorite-icon');
            let deleteButton = commentElement.querySelector('.btn-delete');
            
            favorite.addEventListener('click', () => {
                let setFavoriteEvent = new CustomEvent('setfavorite', {detail: {comment, isFromServer: false, commentElement}});
                document.dispatchEvent(setFavoriteEvent); 
            });
    
            deleteButton.addEventListener('click', () => {
                let deleteFromStorage = new CustomEvent('deleteprivate', {detail: {id: comment.id, commentElement}});
                document.dispatchEvent(deleteFromStorage);
            })
    
            commentsHolder.appendChild(commentElement);
        })
    }

    if(!localComments && !serverComments) {
        let message = document.createElement('div');
        message.textContent = 'No comments';
        commentsHolder.appendChild(message);
    } 
}

const showCommentsForLine = (e) => {
    Promise.all([fetchCommentsFromServer(), getCommentsFromLocalStorage()])
    .then(([serverComments, localStorageComments]) => {
        let targetCodeLine = e.detail.line;

        let serverCommentsForLine = serverComments.length !== 0 ? groupCommentsByline(serverComments.comments)[targetCodeLine] : [];
        let localCommentsForLine = localStorageComments.length !== 0 ? groupCommentsByline(localStorageComments)[targetCodeLine] : [];

        displayComments(serverCommentsForLine, localCommentsForLine);
    })
}

function setFavoriteServer(comment) {
    fetch(`${config.apiUrl}/update-is-liked/${comment.id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            key: config.apiKey,
        },
        body: JSON.stringify({
            isLiked: !comment.isLiked
        })
    })
    .catch(err => {
        throw new Error("Error occured while trying to update isLiked parameter:", err);
    })
}

const handleSetFavorite = (e) => {
    if(e.detail.isFromServer) {
        let favoriteIcon = e.detail.commentElement.querySelector('.favorite-icon');
        setFavoriteServer(e.detail.comment);
        favoriteIcon.src = !e.detail.comment.isLiked ? './icons/heart-full.svg' : './icons/heart-empty.svg';
    } else {
        let localStorageComments = JSON.parse(localStorage.getItem('comments'));
        var targetCommentIndex = localStorageComments.findIndex((comment) => {
            return comment.id === e.detail.comment.id;
        });
        localStorageComments[targetCommentIndex].isLiked = !localStorageComments[targetCommentIndex].isLiked;
        localStorage.setItem('comments', JSON.stringify(localStorageComments));

        e.detail.commentElement.querySelector('.favorite-icon').src = localStorageComments[e.detail.comment.id].isLiked ? './icons/heart-full.svg' : './icons/heart-empty.svg';
    }
}

const deleteCommentFromServer = (e) => {
    let commentId = e.detail.id;
    let commentElement = e.detail.commentElement;

    fetch(`${config.apiUrl}/remove/${commentId}`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            key: config.apiKey,
        }
    })
    .then(response => {
        commentElement.style.display = 'none';
    })
    .catch(err => {
        throw new Error("Error occured while trying to delete comment:", err);
    })
}

const deleteCommentFromStorage = (e) => {
    let commentId = e.detail.id;
    let commentElement = e.detail.commentElement;

    var commentFromStorage = JSON.parse(localStorage.getItem('comments'));

    var targetCommentIndex = commentFromStorage.findIndex((comment) => {
        return comment.id === commentId;
    });

    if (targetCommentIndex !== -1) {
        commentFromStorage.splice(targetCommentIndex, 1);
        commentElement.style.display = 'none';
    }

    localStorage.setItem('comments', JSON.stringify(commentFromStorage));
}

document.addEventListener('showcomments', showCommentsForLine);
document.addEventListener('deleteserver', deleteCommentFromServer);
document.addEventListener('deleteprivate', deleteCommentFromStorage);
document.addEventListener('setfavorite', handleSetFavorite);