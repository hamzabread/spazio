// Write Language links for linking post-post
// Also create Canonical links hreflang in HEAD
// Inserts Langue variant links in <div id="language-links">
// Fetches URL's from Cloudflare spazio-multilang.ghostflow.workers.dev
// if postID is not found Default canonical links will be written
// GhostFLow MH 


const handleMultilingualLinks = () => {  
  document.addEventListener("DOMContentLoaded", function () {
    const postIdSpan = document.querySelector("span[data-postid]");    
    if (postIdSpan) {
      // Fetch JSON data and write the hreflang links and language-links      
      const pageID = postIdSpan.getAttribute("data-postid");
      console.log('Post ID ' + pageID )
      const webhookUrl = `https://spazio-multilang.ghostflow.workers.dev?postid=${pageID}`;

      fetch(webhookUrl)
        .then((response) => response.json())
        .then((data) => {
          const languageLinks = document.getElementById("language-links");
          const allowedLanguageCodes = ['EN', 'IT', 'FR', 'DE', 'ES', 'JA', 'RU', 'ZH', 'KO'];
          // const allowedLanguageCodes = ['EN', 'IT'];
          // Write canonical links
          

          // Create language links only if the languageLinks element is found
          if (languageLinks) {
            data.results.forEach((languageData) => {
              for (const [languageCode, url] of Object.entries(languageData)) {
                if (url !== null && allowedLanguageCodes.includes(languageCode) && languageCode !== document.documentElement.lang.toUpperCase() ) {
                  const linkText = `<a href="${url}">${getLanguageName(languageCode)}</a>`;
                  const linkElement = document.createElement("div");
                  linkElement.innerHTML = linkText;
                  languageLinks.appendChild(linkElement);
                }
              }
            });
          } else {
            console.log("language-links element not found");
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }; 
        

    function getLanguageName(languageCode) {
      // Map language codes to their corresponding language names
      const languageNames = {
        EN: "Read this post in English.",
        IT: "Leggi questo post in Italiano.",
        FR: "Lire cet article en Français.",
        DE: "Lesen Sie diesen Beitrag auf Deutsch.",
        ES: "Lee este post en Español.",
        JA: "この投稿を日本語で読む",
        KO: "이 글을 한국어로 읽어보세요",
        RU: "Прочтите этот пост на русском языке.",
        ZH: "阅读这篇中文文章"
      };

      return languageNames[languageCode] || languageCode;
    }
  });
};

export  { handleMultilingualLinks };


