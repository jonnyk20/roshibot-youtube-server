const button = document.getElementById('test');

const getComments = () => fetch('/chat-messages');

button.addEventListener('click', getComments);
