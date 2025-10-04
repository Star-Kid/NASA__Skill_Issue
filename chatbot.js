document.addEventListener('DOMContentLoaded', () => {
  const satelikoButton = document.getElementById('sateliko-button');
  const chatWindow = document.getElementById('sateliko-chat-window');
  const closeBtn = document.getElementById('sateliko-close');
  const form = document.getElementById('sateliko-form');
  const input = document.getElementById('sateliko-input');
  const messages = document.getElementById('sateliko-messages');

  // Toggle chat window visibility
  satelikoButton.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
  });

  // Basic chatbot responses
  const projectInfo = "SatelliteForge is an automated satellite manufacturing platform that leverages advanced 3D printing and robotic assembly technology to build custom satellites efficiently.";

  const sensitiveResponse = "I'm sorry, I cannot provide information on that topic.";

  function getResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes('satelliteforge') || msg.includes('satellite') || msg.includes('manufacturing') || msg.includes('3d printing') || msg.includes('robotic')) {
      return projectInfo;
    }

    if (msg.includes('password') || msg.includes('credit card') || msg.includes('ssn') || msg.includes('private') || msg.includes('secret')) {
      return sensitiveResponse;
    }

    return "I'm here to help with SatelliteForge. Could you please ask something related to our project?";
  }

  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, 'user');
    input.value = '';

    setTimeout(() => {
      const botResponse = getResponse(userMessage);
      appendMessage(botResponse, 'bot');
    }, 500);
  });
});
