import config from '../config.js';

async function fetchServerComments() {
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

function displayServerComments() {

}

function displayLocalComments() {

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

function displayCommentsInDOM(serverComments, localComments) {
    console.log("SERVER: ", groupCommentsByline(serverComments));
    console.log("LOCAL: ", groupCommentsByline(localComments));
    
}

const displayComments = (e) => {
    Promise.all([fetchServerComments(), getCommentsFromLocalStorage()])
    .then(([serverComments, localStorageComments]) => {
        displayCommentsInDOM(serverComments.comments, localStorageComments);
    })
    .catch(err => {
        throw new Error("Error displaying comments:", err);
    })
}

const updateComments = (e) => {
    console.log("SHOULD UPDATE COMMENTS");
}

document.addEventListener('dataready', displayComments);
document.addEventListener('updatecomments', updateComments);