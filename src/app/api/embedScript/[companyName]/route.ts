import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyName = decodeURIComponent(url.pathname.split('/')[3]); 

  const { data: company } = await supabase
  .from('companies')
  .select('*')
  .eq('name', companyName.toLowerCase())
  .single();

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
  const chatUrl = `${domain}/${companyName}/chat`;

  console.log("This is the url:",chatUrl);
  const investUrl = company.invest_url;
  // const presetPrompts = company.preset_prompts ? JSON.parse(company.preset_prompts) : []; // Assuming `preset_prompts` is stored as a JSON string.

  // const presetPromptsScript = presetPrompts.map((prompt: string) => `
  //   var promptBtn = document.createElement('button');
  //   promptBtn.className = "preset-prompt-button";
  //   promptBtn.innerText = "${prompt}";
  //   promptBtn.addEventListener('click', function(){
  //     sendPrompt("${prompt}");
  //   });
  //   presetContainer.appendChild(promptBtn);
  // `).join("\n");

  const scriptContent = `
(function(){
  var investResizeHandler = null;
  var chatIframe = null;
  var chatBtn, investBtn;

  // Listen for "closeChat" messages from the child embed.
  window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "closeChat") {
      if(chatIframe) {
        chatIframe.style.display = "none";
      }
      if(chatBtn) {
        chatBtn.style.display = "block";
        // Restore the chat icon on desktop
        if(window.innerWidth > 600) {
          chatBtn.innerHTML = \`
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24" fill="none"
                 stroke="white" stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 width="24" height="24">
              <path d="M2 8c0-2.21 1.79-4 4-4h12c2.21 0 4 1.79 4 4v6c0 2.21-1.79 4-4 4H6l-4 4V8z" />
              <path d="M7 8h10M7 12h5" />
            </svg>
          \`;
        }
      }
      if(investBtn) {
        investBtn.style.display = "block";
      }
    }
  });

  // Inject CSS for modal, iframe, buttons, and preset prompts
  var style = document.createElement('style');
  style.innerHTML = \`
    /* ------------------------------ */
    /* Modal overlay for Invest Now   */
    /* ------------------------------ */
    .my-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 100000;
      padding: 20px;
    }
    .my-modal-content {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      width: 80%;
      max-width: 400px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .my-modal-content iframe {
      width: 100%;
      border: none;
      transition: height 0.3s ease;
    }
    .my-close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      color: #fff;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.3s ease;
      z-index: 100001;
    }
    .my-close-button:hover {
      background-color: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }
    /* ------------------------------ */
    /* Common button styling          */
    /* ------------------------------ */
    .my-button {
      font-family: sans-serif;
      font-size: 16px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
      z-index: 100000;
    }
    .my-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0,0,0,0.15);
    }
    /* ----------------------------------- */
    /* Chat button: circular, black & white */
    /* ----------------------------------- */
    .chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #000;
      color: #fff;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      z-index: 100001;
    }
    .chat-button:hover {
      background-color: #222;
    }
    /* ----------------------------------- */
    /* Invest button: pill-shaped, black & white */
    /* ----------------------------------- */
    .invest-button {
      position: fixed;
      bottom: 20px;
      right: 90px;
      background-color: #000;
      color: #fff;
      border-radius: 50px;
      padding: 12px 24px;
      font-family: sans-serif;
      font-size: 16px;
      z-index: 100001;
    }
    .invest-button:hover {
      background-color: #222;
    }
    /* ----------------------------------- */
    /* Chat iframe (responsive)            */
    /* ----------------------------------- */
    .chat-iframe {
      position: fixed;
      bottom: 80px;
      right: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      z-index: 100000;
      display: none;
    }
    @media (min-width: 601px) {
      .chat-iframe {
        width: 400px;
        height: 700px;
      }
    }
    @media (max-width: 600px) {
      .chat-iframe {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 90vh;
        border-radius: 0;
      }
    }
    /* ----------------------------------- */
    /* Preset prompt container & buttons    */
    /* ----------------------------------- */
    .preset-prompt-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      display: flex;
      flex-direction: row;
      gap: 12px;
      z-index: 100000;
    }
    @media (max-width: 600px) {
      .preset-prompt-container {
        flex-direction: column;
      }
    }
    .preset-prompt-button {
      background-color: #000;
      color: #fff;
      border-radius: 50px;
      padding: 10px 18px;
      font-family: sans-serif;
      font-size: 14px;
      border: 1px solid #ADD8E6;
      cursor: pointer;
    }
    .preset-prompt-button:hover {
      background-color: #222;
    }
  \`;
  document.head.appendChild(style);

  /* ---------------------------------------- */
  /* Create Invest Now modal & close function */
  /* ---------------------------------------- */
  var modal = document.createElement('div');
  modal.id = "myModal";
  modal.className = "my-modal";
  var modalContent = document.createElement('div');
  modalContent.className = "my-modal-content";
  var closeButton = document.createElement('div');
  closeButton.className = "my-close-button";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener('click', closeModal);
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  function openModal(url) {
    if (chatIframe) {
      chatIframe.style.display = "none";
    }
    var presetContainer = document.querySelector('.preset-prompt-container');
    if (presetContainer) {
      presetContainer.style.display = "none";
    }
    var existingIframe = modalContent.querySelector('iframe');
    if (existingIframe) {
      if (existingIframe.getAttribute('data-type') === 'invest' && investResizeHandler) {
        window.removeEventListener('message', investResizeHandler, false);
        investResizeHandler = null;
      }
      modalContent.removeChild(existingIframe);
    }
    var iframe = document.createElement('iframe');
    iframe.src = url;
    if (url === "${investUrl}") {
      iframe.setAttribute('data-type', 'invest');
      iframe.style.height = "600px";
      investResizeHandler = function(event) {
        if (event.data && event.data.type === 'resizeIframe' && typeof event.data.height === 'number') {
          iframe.style.height = event.data.height + "px";
        }
      };
      window.addEventListener('message', investResizeHandler, false);
    } else {
      iframe.style.height = "600px";
    }
    modalContent.appendChild(iframe);
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
    var existingIframe = modalContent.querySelector('iframe');
    if (existingIframe) {
      if (existingIframe.getAttribute('data-type') === 'invest' && investResizeHandler) {
        window.removeEventListener('message', investResizeHandler, false);
        investResizeHandler = null;
      }
      modalContent.removeChild(existingIframe);
    }
  }

  /* ----------------------------------- */
  /* sendPrompt sends "fillInput" with newChat:true */
  /* ----------------------------------- */
  function sendPrompt(promptText) {
    closeModal();
    var presetContainer = document.querySelector('.preset-prompt-container');
    if (presetContainer) {
      presetContainer.style.display = "none";
    }
    if (!chatIframe) {
      chatIframe = document.createElement('iframe');
      chatIframe.src = "${chatUrl}";
      chatIframe.className = "chat-iframe";
      document.body.appendChild(chatIframe);
      chatIframe.style.display = "block";
      // For mobile, hide the floating buttons when chat opens.
      if(window.innerWidth <= 600) {
        chatBtn.style.display = "none";
        investBtn.style.display = "none";
      } else {
        // On desktop, update the chat button icon to a down arrow.
        chatBtn.innerHTML = \`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        \`;
      }
      chatIframe.onload = function() {
        chatIframe.contentWindow.postMessage(
          { type: "fillInput", question: promptText, newChat: true },
          "*"
        );
      };
    } else {
      chatIframe.style.display = "block";
      chatIframe.contentWindow.postMessage(
        { type: "fillInput", question: promptText, newChat: true },
        "*"
      );
      if(window.innerWidth <= 600) {
        chatBtn.style.display = "none";
        investBtn.style.display = "none";
      } else {
        chatBtn.innerHTML = \`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        \`;
      }
    }
  }

  // Create Chat button
  chatBtn = document.createElement('button');
  chatBtn.className = "my-button chat-button";
  chatBtn.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24" fill="none"
         stroke="white" stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         width="24" height="24">
      <path d="M2 8c0-2.21 1.79-4 4-4h12c2.21 0 4 1.79 4 4v6c0 2.21-1.79 4-4 4H6l-4 4V8z" />
      <path d="M7 8h10M7 12h5" />
    </svg>
  \`;
  chatBtn.addEventListener('click', function(){
    closeModal();
    if (!chatIframe) {
      chatIframe = document.createElement('iframe');
      chatIframe.src = "${chatUrl}";
      chatIframe.className = "chat-iframe";
      document.body.appendChild(chatIframe);
      chatIframe.style.display = "block";
      if(window.innerWidth <= 600) {
        // Mobile: hide buttons when chat is open.
        chatBtn.style.display = "none";
        investBtn.style.display = "none";
      } else {
        // Desktop: update chat button to down arrow.
        chatBtn.innerHTML = \`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        \`;
      }
    } else {
      if (chatIframe.style.display === "none") {
        chatIframe.style.display = "block";
        if(window.innerWidth <= 600) {
          chatBtn.style.display = "none";
          investBtn.style.display = "none";
        } else {
          chatBtn.innerHTML = \`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                 fill="none" stroke="white" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          \`;
        }
      } else {
        chatIframe.style.display = "none";
        if(window.innerWidth > 600) {
          // Desktop: revert chat button icon to the original chat icon.
          chatBtn.innerHTML = \`
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24" fill="none"
                 stroke="white" stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 width="24" height="24">
              <path d="M2 8c0-2.21 1.79-4 4-4h12c2.21 0 4 1.79 4 4v6c0 2.21-1.79 4-4 4H6l-4 4V8z" />
              <path d="M7 8h10M7 12h5" />
            </svg>
          \`;
          chatBtn.style.display = "block";
          investBtn.style.display = "block";
        } else {
          // Mobile: show the buttons when chat is closed.
          chatBtn.style.display = "block";
          investBtn.style.display = "block";
        }
      }
    }
  });
  document.body.appendChild(chatBtn);

  // Create Invest Now button
  investBtn = document.createElement('button');
  investBtn.className = "my-button invest-button";
  investBtn.innerText = "Invest Now";
  investBtn.addEventListener('click', function(){
    if (chatIframe) {
      chatIframe.style.display = "none";
    }
    var presetContainer = document.querySelector('.preset-prompt-container');
    if (presetContainer) {
      presetContainer.style.display = "none";
    }
    openModal("${investUrl}");
  });
  document.body.appendChild(investBtn);

  // Create Preset Prompt buttons container
  var presetContainer = document.createElement('div');
  presetContainer.className = "preset-prompt-container";

  var presetPrompts = [
    "What makes you different?",
    "Recent drill results?"
  ];

  presetPrompts.forEach(function(prompt) {
    var promptBtn = document.createElement('button');
    promptBtn.className = "preset-prompt-button";
    promptBtn.innerText = prompt;
    promptBtn.addEventListener('click', function(){
      sendPrompt(prompt);
    });
    presetContainer.appendChild(promptBtn);
  });
  document.body.appendChild(presetContainer);
})();
`;

  return new NextResponse(scriptContent, {
    headers: { "Content-Type": "application/javascript" },
  });
}
