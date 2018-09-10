const buttons = document.querySelectorAll('.request');
console.log('button', buttons);
const request = async ({ target }) => {
  console.log('request made');
  const response = await fetch(`/${target.id}`);
  console.log('response', response);
};

buttons.forEach(button => {
  button.addEventListener('click', request);
});
