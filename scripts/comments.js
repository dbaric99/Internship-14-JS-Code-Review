import { API_URL, API_KEY } from '../config.js';

async function fetchAllComments() {
    const method = 'GET';
    const headers = { API_KEY };
    const options = {method, headers};

    const response = await fetch(`${API_URL}/comments`, options);
    const comments = await response.json();
    return comments;
}

fetchAllComments().then(comments => {
    console.log("COMMENTS: ", comments);
})